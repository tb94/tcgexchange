import {
  CardCache,
  CollectionItem,
  User,
  WishlistItem
} from '../../models/index.js';

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

function findMatches(holderCollection, seekerWishlist, cardMap) {
  return holderCollection
    .map((collectionItem) => {
      const wish = seekerWishlist.find((item) => item.cardId === collectionItem.cardId);
      const qty = qtyAvailable(collectionItem, wish);
      if (!qty) return null;

      return {
        cardId: collectionItem.cardId,
        qty,
        condition: collectionItem.condition,
        priority: wish.priority,
        card: cardMap.get(collectionItem.cardId) || { id: collectionItem.cardId }
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
      receive: receive.card,
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

async function create(req, res) {
  try {
    const { recipientId, swaps = [], note = '' } = req.body || {};
    if (!recipientId || !Array.isArray(swaps) || !swaps.length) {
      return res.status(400).json({ error: 'recipientId and swaps are required' });
    }

    return res.status(201).json({
      trade: {
        id: `local-${Date.now()}`,
        senderId: req.user.id,
        recipientId,
        swaps,
        note,
        status: 'proposed'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to propose trade' });
  }
}

async function detail(req, res) {
  return res.status(404).json({ error: 'Trade persistence is not available in this local dev build yet' });
}

export default {
  recommendations,
  matches,
  create,
  detail
};
