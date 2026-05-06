import {
  CardCache,
  CollectionItem,
  Trade,
  TradeOffer,
  TradeOfferItem,
  TradeMessage,
  TradeReadState,
  Sequelize,
  User,
  WishlistItem,
  sequelize
} from '../../models/index.js';

const { Op } = Sequelize;

const CONDITION_RANK = {
  DMG: 1,
  HP: 2,
  MP: 3,
  LP: 4,
  NM: 5
};

function rankCondition(condition) {
  return CONDITION_RANK[String(condition || '').toUpperCase()] || 0;
}

function meetsCondition(actualCondition, minCondition) {
  return rankCondition(actualCondition) >= rankCondition(minCondition);
}

function qtyAvailable(collectionItem, wishlistItem) {
  if (!collectionItem || !wishlistItem) return 0;
  if (!meetsCondition(collectionItem.condition, wishlistItem.minCondition)) return 0;
  return Math.max(
    0,
    Math.min(Number(collectionItem.quantity) || 0, Number(wishlistItem.quantityDesired) || 0)
  );
}

function normalizeCard(card) {
  if (!card) return null;
  return {
    id: card.id,
    name: card.name,
    setId: card.setId,
    setName: card.setName,
    number: card.number,
    rarity: card.rarity,
    supertype: card.supertype,
    types: card.typesJson ? JSON.parse(card.typesJson) : [],
    imageSmall: card.imageSmall,
    imageLarge: card.imageLarge
  };
}

async function cardsById(cardIds) {
  const uniqueIds = Array.from(new Set((cardIds || []).filter(Boolean)));
  if (!uniqueIds.length) return new Map();

  const cards = await CardCache.findAll({ where: { id: uniqueIds } });
  return new Map(cards.map((card) => [card.id, normalizeCard(card)]));
}

function cardFor(cardMap, cardId) {
  return cardMap.get(cardId) || { id: cardId, name: cardId, types: [] };
}

function findMatches(holderCollection, seekerWishlist, cardMap) {
  return holderCollection
    .map((collectionItem) => {
      const wish = seekerWishlist.find((item) => item.cardId === collectionItem.cardId);
      const qty = qtyAvailable(collectionItem, wish);
      if (!qty) return null;

      return {
        cardId: collectionItem.cardId,
        qty,
        collectionItemId: collectionItem.id,
        condition: collectionItem.condition,
        priority: wish.priority,
        card: cardFor(cardMap, collectionItem.cardId)
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.priority - a.priority || b.qty - a.qty || a.cardId.localeCompare(b.cardId));
}

function buildSuggestedSwaps(iGive, theyGive) {
  const max = Math.min(iGive.length, theyGive.length);
  const swaps = [];

  for (let index = 0; index < max; index += 1) {
    const give = iGive[index];
    const receive = theyGive[index];
    swaps.push({
      give: give.card,
      giveCollectionItemId: give.collectionItemId,
      receive: receive.card,
      receiveCollectionItemId: receive.collectionItemId,
      quantity: Math.max(1, Math.min(give.qty, receive.qty)),
      score: (give.priority || 0) + (receive.priority || 0)
    });
  }

  return swaps.sort((a, b) => b.score - a.score);
}

async function getTradeContext(userId, otherUserId = null) {
  const userWhere = otherUserId ? [userId, Number(otherUserId)] : undefined;

  const [users, collections, wishlists] = await Promise.all([
    User.findAll({
      where: userWhere ? { id: userWhere } : undefined,
      attributes: ['id', 'username', 'avatarUrl'],
      order: [['username', 'ASC']]
    }),
    CollectionItem.findAll({ where: userWhere ? { userId: userWhere } : undefined }),
    WishlistItem.findAll({ where: userWhere ? { userId: userWhere } : undefined })
  ]);

  return { users, collections, wishlists };
}

function serializeCollectionItem(item, cardMap, wishedByOther = false) {
  return {
    id: item.id,
    userId: item.userId,
    cardId: item.cardId,
    condition: item.condition,
    quantity: item.quantity,
    notes: item.notes,
    wishedByOther,
    card: cardFor(cardMap, item.cardId)
  };
}

function serializeOfferItem(item, cardMap) {
  return {
    id: item.id,
    ownerId: item.ownerId,
    collectionItemId: item.collectionItemId,
    cardId: item.cardId,
    quantity: item.quantity,
    card: cardFor(cardMap, item.cardId)
  };
}

async function createOffer(trade, proposerId, rawItems, message, transaction, status = 'pending') {
  const previousCount = await TradeOffer.count({ where: { tradeId: trade.id }, transaction });
  const offer = await TradeOffer.create({
    tradeId: trade.id,
    version: previousCount + 1,
    proposerId,
    message: message || null
  }, { transaction });

  await TradeOfferItem.bulkCreate(
    rawItems.map((item) => ({
      offerId: offer.id,
      ownerId: Number(item.ownerId),
      collectionItemId: item.collectionItemId ? Number(item.collectionItemId) : null,
      cardId: item.cardId,
      quantity: Math.max(1, Number(item.quantity) || 1)
    })),
    { transaction }
  );

  await trade.update({ activeOfferId: offer.id, status }, { transaction });

  return offer;
}

async function validateOfferItems(items, participantIds) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('Select at least one card for the offer');
  }

  const cleaned = items.map((item) => ({
    ...item,
    ownerId: Number(item.ownerId),
    collectionItemId: item.collectionItemId ? Number(item.collectionItemId) : null,
    quantity: Math.max(1, Number(item.quantity) || 1)
  }));

  if (cleaned.some((item) => !participantIds.includes(item.ownerId) || !item.cardId)) {
    throw new Error('Offer items must belong to one of the trade participants');
  }

  const collectionIds = cleaned.map((item) => item.collectionItemId).filter(Boolean);
  if (collectionIds.length) {
    const ownedRows = await CollectionItem.findAll({ where: { id: collectionIds } });
    const rowMap = new Map(ownedRows.map((row) => [row.id, row]));

    cleaned.forEach((item) => {
      if (!item.collectionItemId) return;
      const row = rowMap.get(item.collectionItemId);
      if (!row || row.userId !== item.ownerId || row.cardId !== item.cardId) {
        throw new Error('One selected card is no longer available for that trader');
      }
      if (item.quantity > row.quantity) {
        throw new Error(`Quantity too high for ${item.cardId}`);
      }
    });
  }

  return cleaned;
}

function countUnreadMessages(messages, userId, lastReadAt) {
  const last = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  return messages.filter((message) => message.senderId !== userId
    && new Date(message.createdAt).getTime() > last).length;
}

async function markTradeRead(tradeId, userId) {
  const [state] = await TradeReadState.findOrCreate({
    where: { tradeId, userId },
    defaults: { lastReadAt: new Date() }
  });
  state.lastReadAt = new Date();
  await state.save();
  return state;
}

async function serializeTrade(trade) {
  const [participants, offers, messages] = await Promise.all([
    User.findAll({
      where: { id: [trade.initiatorId, trade.recipientId] },
      attributes: ['id', 'username', 'avatarUrl']
    }),
    TradeOffer.findAll({
      where: { tradeId: trade.id },
      order: [['version', 'ASC']]
    }),
    TradeMessage.findAll({
      where: { tradeId: trade.id },
      order: [['createdAt', 'ASC']]
    })
  ]);

  const offerIds = offers.map((offer) => offer.id);
  const offerItems = offerIds.length
    ? await TradeOfferItem.findAll({ where: { offerId: offerIds }, order: [['id', 'ASC']] })
    : [];
  const cardMap = await cardsById(offerItems.map((item) => item.cardId));
  const participantMap = new Map(participants.map((user) => [user.id, user]));

  const serializedOffers = offers.map((offer) => ({
    id: offer.id,
    version: offer.version,
    proposerId: offer.proposerId,
    proposer: participantMap.get(offer.proposerId),
    message: offer.message,
    createdAt: offer.createdAt,
    items: offerItems
      .filter((item) => item.offerId === offer.id)
      .map((item) => serializeOfferItem(item, cardMap))
  }));

  return {
    id: trade.id,
    initiatorId: trade.initiatorId,
    recipientId: trade.recipientId,
    initiator: participantMap.get(trade.initiatorId),
    recipient: participantMap.get(trade.recipientId),
    status: trade.status,
    hiddenByInitiator: trade.hiddenByInitiator,
    hiddenByRecipient: trade.hiddenByRecipient,
    activeOfferId: trade.activeOfferId,
    activeOffer: serializedOffers.find((offer) => offer.id === trade.activeOfferId) || null,
    offers: serializedOffers,
    messages: messages.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      sender: participantMap.get(message.senderId),
      message: message.message,
      createdAt: message.createdAt
    })),
    createdAt: trade.createdAt,
    updatedAt: trade.updatedAt
  };
}

async function list(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const includeHidden = ['1', 'true', 'yes'].includes(String(req.query.hidden || '').toLowerCase());
    const trades = await Trade.findAll({
      where: {
        [Op.or]: includeHidden
          ? [
            { initiatorId: currentUserId, hiddenByInitiator: true },
            { recipientId: currentUserId, hiddenByRecipient: true }
          ]
          : [
            { initiatorId: currentUserId, hiddenByInitiator: false },
            { recipientId: currentUserId, hiddenByRecipient: false }
          ]
      },
      order: [['updatedAt', 'DESC']]
    });

    const [serialized, readStates] = await Promise.all([
      Promise.all(trades.map((trade) => serializeTrade(trade))),
      TradeReadState.findAll({
        where: {
          tradeId: trades.map((trade) => trade.id),
          userId: currentUserId
        }
      })
    ]);
    const readMap = new Map(readStates.map((state) => [state.tradeId, state.lastReadAt]));

    return res.json({
      trades: serialized.map((trade) => ({
        ...trade,
        viewerId: currentUserId,
        otherUser: trade.initiatorId === currentUserId ? trade.recipient : trade.initiator,
        hiddenForViewer: trade.initiatorId === currentUserId
          ? trade.hiddenByInitiator
          : trade.hiddenByRecipient,
        unreadCount: countUnreadMessages(
          trade.messages || [],
          currentUserId,
          readMap.get(trade.id)
        ),
        needsResponse: trade.activeOffer
          ? trade.activeOffer.proposerId !== currentUserId
            && ['pending', 'countered'].includes(trade.status)
          : false
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch trades' });
  }
}

async function recommendations(req, res) {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15));
    const currentUserId = Number(req.user.id);
    const { users, collections, wishlists } = await getTradeContext(currentUserId);

    const myWishlist = wishlists.filter((item) => item.userId === currentUserId);
    const myCollection = collections.filter((item) => item.userId === currentUserId);
    const cardMap = await cardsById([
      ...collections.map((item) => item.cardId),
      ...wishlists.map((item) => item.cardId)
    ]);

    const recommendationsForUsers = users
      .filter((user) => user.id !== currentUserId)
      .map((user) => {
        const theirCollection = collections.filter((item) => item.userId === user.id);
        const theirWishlist = wishlists.filter((item) => item.userId === user.id);
        const theyGive = findMatches(theirCollection, myWishlist, cardMap);
        const iGive = findMatches(myCollection, theirWishlist, cardMap);
        const suggestedSwaps = buildSuggestedSwaps(iGive, theyGive);
        const score = theyGive.reduce((sum, item) => sum + (item.priority * item.qty), 0)
          + iGive.reduce((sum, item) => sum + item.priority, 0)
          + (suggestedSwaps.length * 10);

        return {
          user: { id: user.id, username: user.username, avatarUrl: user.avatarUrl },
          score,
          swapCount: suggestedSwaps.length,
          theyHaveCount: theyGive.length,
          youHaveCount: iGive.length
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score
        || b.swapCount - a.swapCount
        || a.user.username.localeCompare(b.user.username))
      .slice(0, limit);

    return res.json({ recommendations: recommendationsForUsers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch trade recommendations' });
  }
}

async function matches(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const otherUserId = Number(req.params.otherUserId);
    if (!otherUserId || otherUserId === currentUserId) {
      return res.status(400).json({ error: 'Invalid trader id' });
    }

    const { users, collections, wishlists } = await getTradeContext(currentUserId, otherUserId);
    const otherUser = users.find((user) => user.id === otherUserId);
    if (!otherUser) return res.status(404).json({ error: 'Trader not found' });

    const cardMap = await cardsById([
      ...collections.map((item) => item.cardId),
      ...wishlists.map((item) => item.cardId)
    ]);

    const myCollection = collections.filter((item) => item.userId === currentUserId);
    const myWishlist = wishlists.filter((item) => item.userId === currentUserId);
    const theirCollection = collections.filter((item) => item.userId === otherUserId);
    const theirWishlist = wishlists.filter((item) => item.userId === otherUserId);

    const iGive = findMatches(myCollection, theirWishlist, cardMap);
    const theyGive = findMatches(theirCollection, myWishlist, cardMap);

    return res.json({
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        avatarUrl: otherUser.avatarUrl
      },
      iGive,
      theyGive,
      suggestedSwaps: buildSuggestedSwaps(iGive, theyGive)
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch trade matches' });
  }
}

async function builder(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const otherUserId = Number(req.params.otherUserId);
    if (!otherUserId || otherUserId === currentUserId) {
      return res.status(400).json({ error: 'Invalid trader id' });
    }

    const { users, collections, wishlists } = await getTradeContext(currentUserId, otherUserId);
    const me = users.find((user) => user.id === currentUserId);
    const otherUser = users.find((user) => user.id === otherUserId);
    if (!otherUser) return res.status(404).json({ error: 'Trader not found' });

    const cardMap = await cardsById(collections.map((item) => item.cardId));
    const myWishIds = new Set(
      wishlists.filter((item) => item.userId === currentUserId).map((item) => item.cardId)
    );
    const theirWishIds = new Set(
      wishlists.filter((item) => item.userId === otherUserId).map((item) => item.cardId)
    );

    return res.json({
      participants: {
        me,
        otherUser
      },
      collections: {
        me: collections
          .filter((item) => item.userId === currentUserId)
          .map((item) => serializeCollectionItem(item, cardMap, theirWishIds.has(item.cardId))),
        otherUser: collections
          .filter((item) => item.userId === otherUserId)
          .map((item) => serializeCollectionItem(item, cardMap, myWishIds.has(item.cardId)))
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load trade builder' });
  }
}

async function create(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const {
      recipientId,
      message = '',
      items,
      swaps = []
    } = req.body || {};
    const recipient = Number(recipientId);
    if (!recipient || recipient === currentUserId) {
      return res.status(400).json({ error: 'recipientId is required' });
    }

    const rawItems = Array.isArray(items) && items.length
      ? items
      : swaps.flatMap((swap) => ([
        {
          ownerId: currentUserId,
          collectionItemId: swap.giveCollectionItemId,
          cardId: swap.giveCardId,
          quantity: swap.quantity || 1
        },
        {
          ownerId: recipient,
          collectionItemId: swap.receiveCollectionItemId,
          cardId: swap.receiveCardId,
          quantity: swap.quantity || 1
        }
      ]));

    const cleanItems = await validateOfferItems(rawItems, [currentUserId, recipient]);

    const trade = await sequelize.transaction(async (transaction) => {
      const createdTrade = await Trade.create({
        initiatorId: currentUserId,
        recipientId: recipient,
        status: 'pending'
      }, { transaction });

      await createOffer(createdTrade, currentUserId, cleanItems, message, transaction);
      return createdTrade;
    });

    return res.status(201).json({ trade: await serializeTrade(trade) });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to propose trade' });
  }
}

async function detail(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const trade = await Trade.findByPk(Number(req.params.id));
    if (!trade || ![trade.initiatorId, trade.recipientId].includes(currentUserId)) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    await markTradeRead(trade.id, currentUserId);
    const payload = await serializeTrade(trade);
    payload.viewerId = currentUserId;
    payload.unreadCount = 0;
    return res.json({ trade: payload });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch trade' });
  }
}

async function counter(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const trade = await Trade.findByPk(Number(req.params.id));
    if (!trade || ![trade.initiatorId, trade.recipientId].includes(currentUserId)) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    if (['accepted', 'declined', 'denied'].includes(trade.status)) {
      return res.status(400).json({ error: `Cannot counter a ${trade.status} trade` });
    }

    const participantIds = [trade.initiatorId, trade.recipientId];
    const cleanItems = await validateOfferItems(req.body?.items, participantIds);

    await sequelize.transaction(async (transaction) => {
      await createOffer(
        trade,
        currentUserId,
        cleanItems,
        req.body?.message || '',
        transaction,
        'countered'
      );
    });

    const payload = await serializeTrade(trade);
    payload.viewerId = currentUserId;
    return res.json({ trade: payload });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to counter trade' });
  }
}

async function respond(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const trade = await Trade.findByPk(Number(req.params.id));
    if (!trade || ![trade.initiatorId, trade.recipientId].includes(currentUserId)) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const action = String(req.body?.action || '').toLowerCase();
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or decline' });
    }

    const activeOffer = await TradeOffer.findByPk(trade.activeOfferId);
    if (action === 'accept' && activeOffer?.proposerId === currentUserId) {
      return res.status(400).json({ error: 'The other trader must accept your offer' });
    }

    trade.status = action === 'accept' ? 'accepted' : 'denied';
    await trade.save();

    const payload = await serializeTrade(trade);
    payload.viewerId = currentUserId;
    return res.json({ trade: payload });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to respond to trade' });
  }
}

async function sendMessage(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const trade = await Trade.findByPk(Number(req.params.id));
    if (!trade || ![trade.initiatorId, trade.recipientId].includes(currentUserId)) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const text = String(req.body?.message || '').trim();
    if (!text) return res.status(400).json({ error: 'Message is required' });

    await TradeMessage.create({
      tradeId: trade.id,
      senderId: currentUserId,
      message: text
    });
    await markTradeRead(trade.id, currentUserId);

    const payload = await serializeTrade(trade);
    payload.viewerId = currentUserId;
    return res.status(201).json({ trade: payload });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

async function hide(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const trade = await Trade.findByPk(Number(req.params.id));
    if (!trade || ![trade.initiatorId, trade.recipientId].includes(currentUserId)) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    const hidden = req.body?.hidden !== false;
    if (currentUserId === trade.initiatorId) trade.hiddenByInitiator = hidden;
    else trade.hiddenByRecipient = hidden;
    await trade.save();

    return res.json({ ok: true, hidden });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to hide trade' });
  }
}

export default {
  list,
  recommendations,
  matches,
  builder,
  create,
  detail,
  counter,
  respond,
  sendMessage,
  hide
};
