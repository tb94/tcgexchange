import bcrypt from 'bcryptjs';
import {
  CardCache,
  CollectionItem,
  User,
  WishlistItem,
  sequelize
} from '../models/index.js';

const CONDITION_RANK = {
  DMG: 1,
  HP: 2,
  MP: 3,
  LP: 4,
  NM: 5
};

const FIXTURE_PASSWORD = 'tcgtest123';
const FIXTURE_USERNAMES = [
  'match_ash',
  'match_misty',
  'match_brock',
  'match_leaf',
  'match_red'
];

const cards = [
  {
    id: 'base1-4',
    name: 'Charizard',
    setId: 'base1',
    setName: 'Base Set',
    setSeries: 'Base',
    setReleaseDate: '1999/01/09',
    setPrintedTotal: 102,
    number: '4',
    rarity: 'Rare Holo',
    supertype: 'Pokémon',
    subtypesJson: JSON.stringify(['Stage 2']),
    typesJson: JSON.stringify(['Fire']),
    imageSmall: 'https://images.pokemontcg.io/base1/4.png',
    imageLarge: 'https://images.pokemontcg.io/base1/4_hires.png'
  },
  {
    id: 'base1-2',
    name: 'Blastoise',
    setId: 'base1',
    setName: 'Base Set',
    setSeries: 'Base',
    setReleaseDate: '1999/01/09',
    setPrintedTotal: 102,
    number: '2',
    rarity: 'Rare Holo',
    supertype: 'Pokémon',
    subtypesJson: JSON.stringify(['Stage 2']),
    typesJson: JSON.stringify(['Water']),
    imageSmall: 'https://images.pokemontcg.io/base1/2.png',
    imageLarge: 'https://images.pokemontcg.io/base1/2_hires.png'
  },
  {
    id: 'base1-15',
    name: 'Venusaur',
    setId: 'base1',
    setName: 'Base Set',
    setSeries: 'Base',
    setReleaseDate: '1999/01/09',
    setPrintedTotal: 102,
    number: '15',
    rarity: 'Rare Holo',
    supertype: 'Pokémon',
    subtypesJson: JSON.stringify(['Stage 2']),
    typesJson: JSON.stringify(['Grass']),
    imageSmall: 'https://images.pokemontcg.io/base1/15.png',
    imageLarge: 'https://images.pokemontcg.io/base1/15_hires.png'
  },
  {
    id: 'base1-16',
    name: 'Zapdos',
    setId: 'base1',
    setName: 'Base Set',
    setSeries: 'Base',
    setReleaseDate: '1999/01/09',
    setPrintedTotal: 102,
    number: '16',
    rarity: 'Rare Holo',
    supertype: 'Pokémon',
    subtypesJson: JSON.stringify(['Basic']),
    typesJson: JSON.stringify(['Lightning']),
    imageSmall: 'https://images.pokemontcg.io/base1/16.png',
    imageLarge: 'https://images.pokemontcg.io/base1/16_hires.png'
  },
  {
    id: 'base1-10',
    name: 'Mewtwo',
    setId: 'base1',
    setName: 'Base Set',
    setSeries: 'Base',
    setReleaseDate: '1999/01/09',
    setPrintedTotal: 102,
    number: '10',
    rarity: 'Rare Holo',
    supertype: 'Pokémon',
    subtypesJson: JSON.stringify(['Basic']),
    typesJson: JSON.stringify(['Psychic']),
    imageSmall: 'https://images.pokemontcg.io/base1/10.png',
    imageLarge: 'https://images.pokemontcg.io/base1/10_hires.png'
  },
  {
    id: 'base1-6',
    name: 'Gyarados',
    setId: 'base1',
    setName: 'Base Set',
    setSeries: 'Base',
    setReleaseDate: '1999/01/09',
    setPrintedTotal: 102,
    number: '6',
    rarity: 'Rare Holo',
    supertype: 'Pokémon',
    subtypesJson: JSON.stringify(['Stage 1']),
    typesJson: JSON.stringify(['Water']),
    imageSmall: 'https://images.pokemontcg.io/base1/6.png',
    imageLarge: 'https://images.pokemontcg.io/base1/6_hires.png'
  },
  {
    id: 'base1-58',
    name: 'Pikachu',
    setId: 'base1',
    setName: 'Base Set',
    setSeries: 'Base',
    setReleaseDate: '1999/01/09',
    setPrintedTotal: 102,
    number: '58',
    rarity: 'Common',
    supertype: 'Pokémon',
    subtypesJson: JSON.stringify(['Basic']),
    typesJson: JSON.stringify(['Lightning']),
    imageSmall: 'https://images.pokemontcg.io/base1/58.png',
    imageLarge: 'https://images.pokemontcg.io/base1/58_hires.png'
  },
  {
    id: 'base1-44',
    name: 'Bulbasaur',
    setId: 'base1',
    setName: 'Base Set',
    setSeries: 'Base',
    setReleaseDate: '1999/01/09',
    setPrintedTotal: 102,
    number: '44',
    rarity: 'Common',
    supertype: 'Pokémon',
    subtypesJson: JSON.stringify(['Basic']),
    typesJson: JSON.stringify(['Grass']),
    imageSmall: 'https://images.pokemontcg.io/base1/44.png',
    imageLarge: 'https://images.pokemontcg.io/base1/44_hires.png'
  }
];

const people = [
  {
    username: 'match_ash',
    avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=match_ash',
    collection: [
      {
        cardId: 'base1-4', condition: 'LP', quantity: 1, notes: 'Duplicate Charizard, prefers trading for water holos.'
      },
      { cardId: 'base1-58', condition: 'NM', quantity: 3 },
      { cardId: 'base1-16', condition: 'MP', quantity: 1 }
    ],
    wishlist: [
      {
        cardId: 'base1-2', minCondition: 'LP', quantityDesired: 1, priority: 1
      },
      {
        cardId: 'base1-6', minCondition: 'MP', quantityDesired: 1, priority: 3
      },
      {
        cardId: 'base1-44', minCondition: 'NM', quantityDesired: 2, priority: 5
      }
    ]
  },
  {
    username: 'match_misty',
    avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=match_misty',
    collection: [
      { cardId: 'base1-2', condition: 'NM', quantity: 1 },
      { cardId: 'base1-6', condition: 'LP', quantity: 2 },
      { cardId: 'base1-44', condition: 'NM', quantity: 1 }
    ],
    wishlist: [
      {
        cardId: 'base1-4', minCondition: 'LP', quantityDesired: 1, priority: 1
      },
      {
        cardId: 'base1-10', minCondition: 'LP', quantityDesired: 1, priority: 2
      },
      {
        cardId: 'base1-16', minCondition: 'NM', quantityDesired: 1, priority: 4
      }
    ]
  },
  {
    username: 'match_brock',
    avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=match_brock',
    collection: [
      { cardId: 'base1-15', condition: 'LP', quantity: 1 },
      { cardId: 'base1-10', condition: 'MP', quantity: 1 },
      { cardId: 'base1-16', condition: 'NM', quantity: 1 }
    ],
    wishlist: [
      {
        cardId: 'base1-6', minCondition: 'LP', quantityDesired: 1, priority: 2
      },
      {
        cardId: 'base1-58', minCondition: 'LP', quantityDesired: 1, priority: 3
      },
      {
        cardId: 'base1-2', minCondition: 'NM', quantityDesired: 1, priority: 4
      }
    ]
  },
  {
    username: 'match_leaf',
    avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=match_leaf',
    collection: [
      { cardId: 'base1-44', condition: 'NM', quantity: 4 },
      { cardId: 'base1-15', condition: 'NM', quantity: 1 },
      { cardId: 'base1-10', condition: 'LP', quantity: 1 }
    ],
    wishlist: [
      {
        cardId: 'base1-4', minCondition: 'NM', quantityDesired: 1, priority: 1
      },
      {
        cardId: 'base1-16', minCondition: 'LP', quantityDesired: 1, priority: 3
      },
      {
        cardId: 'base1-2', minCondition: 'LP', quantityDesired: 1, priority: 5
      }
    ]
  },
  {
    username: 'match_red',
    avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?seed=match_red',
    collection: [
      { cardId: 'base1-4', condition: 'NM', quantity: 1 },
      { cardId: 'base1-2', condition: 'LP', quantity: 1 },
      { cardId: 'base1-58', condition: 'LP', quantity: 2 }
    ],
    wishlist: [
      {
        cardId: 'base1-15', minCondition: 'LP', quantityDesired: 1, priority: 1
      },
      {
        cardId: 'base1-10', minCondition: 'MP', quantityDesired: 1, priority: 2
      },
      {
        cardId: 'base1-6', minCondition: 'NM', quantityDesired: 1, priority: 4
      }
    ]
  }
];

function conditionMeetsMinimum(actual, minimum) {
  return CONDITION_RANK[actual] >= CONDITION_RANK[minimum];
}

function priorityWeight(priority) {
  return 6 - priority;
}

function buildMatches(users) {
  const cardNames = new Map(cards.map((card) => [card.id, card.name]));
  const directed = [];

  users.forEach((seeker) => {
    users.forEach((holder) => {
      if (seeker.username === holder.username) return;

      seeker.wishlist.forEach((want) => {
        holder.collection
          .filter((owned) => owned.cardId === want.cardId)
          .filter((owned) => conditionMeetsMinimum(owned.condition, want.minCondition))
          .forEach((owned) => {
            const quantityMatched = Math.min(owned.quantity, want.quantityDesired);
            const conditionBonus = CONDITION_RANK[owned.condition]
              - CONDITION_RANK[want.minCondition];
            const score = (priorityWeight(want.priority) * 10)
              + (quantityMatched * 2)
              + conditionBonus;

            directed.push({
              seeker: seeker.username,
              holder: holder.username,
              cardId: want.cardId,
              cardName: cardNames.get(want.cardId) || want.cardId,
              quantityMatched,
              priority: want.priority,
              condition: owned.condition,
              minCondition: want.minCondition,
              score
            });
          });
      });
    });
  });

  return directed
    .map((match) => {
      const reciprocal = directed.some(
        (other) => other.seeker === match.holder && other.holder === match.seeker
      );
      return {
        ...match,
        reciprocal,
        score: reciprocal ? match.score + 25 : match.score
      };
    })
    .sort((a, b) => b.score - a.score || a.seeker.localeCompare(b.seeker));
}

async function upsertCard(card, transaction) {
  await CardCache.upsert(card, { transaction });
}

async function seed() {
  const password = await bcrypt.hash(FIXTURE_PASSWORD, 10);

  await sequelize.transaction(async (transaction) => {
    await Promise.all(cards.map((card) => upsertCard(card, transaction)));

    await Promise.all(people.map(async (person) => {
      const [user] = await User.findOrCreate({
        where: { username: person.username },
        defaults: { password, avatarUrl: person.avatarUrl },
        transaction
      });

      await user.update({ password, avatarUrl: person.avatarUrl }, { transaction });
      await CollectionItem.destroy({ where: { userId: user.id }, transaction });
      await WishlistItem.destroy({ where: { userId: user.id }, transaction });

      await CollectionItem.bulkCreate(
        person.collection.map((item) => ({ ...item, userId: user.id })),
        { transaction }
      );
      await WishlistItem.bulkCreate(
        person.wishlist.map((item) => ({ ...item, userId: user.id })),
        { transaction }
      );
    }));
  });
}

async function reset() {
  await sequelize.transaction(async (transaction) => {
    const users = await User.findAll({
      where: { username: FIXTURE_USERNAMES },
      attributes: ['id'],
      transaction
    });
    const userIds = users.map((user) => user.id);

    await CollectionItem.destroy({ where: { userId: userIds }, transaction });
    await WishlistItem.destroy({ where: { userId: userIds }, transaction });
    await User.destroy({ where: { id: userIds }, transaction });
  });
}

function printPreview(matches) {
  console.log('Fixture users:');
  people.forEach((person) => {
    console.log(
      `- ${person.username}: ${person.collection.length} collection cards, `
      + `${person.wishlist.length} wishlist cards`
    );
  });

  console.log('\nTop matches:');
  matches.slice(0, 12).forEach((match, index) => {
    const tradeType = match.reciprocal ? 'two-way' : 'one-way';
    console.log(
      `${index + 1}. ${match.holder} has ${match.cardName} (${match.condition}) for ${match.seeker} `
      + `[${tradeType}, priority ${match.priority}, score ${match.score}]`
    );
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));

  try {
    if (args.has('--reset')) {
      await reset();
      console.log('Removed matching fixture users and their inventory.');
    } else if (args.has('--preview')) {
      printPreview(buildMatches(people));
    } else {
      await seed();
      console.log(
        `Seeded ${people.length} matching fixture users. Password for all: ${FIXTURE_PASSWORD}`
      );
      printPreview(buildMatches(people));
    }
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
