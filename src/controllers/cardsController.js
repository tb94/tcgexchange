import { body, validationResult } from 'express-validator';
import 'dotenv/config';
import axios from 'axios';
import { Op } from 'sequelize';

import setConverter from '../util/setConverter.js';
import { CardCache } from '../../models/index.js';

// Input validation
const searchValidation = [
  body('filters.name').optional().isString().withMessage('name must be a string'),
  body('filters.sets').optional().isArray().withMessage('set must be an array'),
  body('filters.sets.*').optional().isString().withMessage('each set must be a string'),
  body('filters.types').optional().isArray().withMessage('types must be an array'),
  body('filters.types.*').optional().isString().withMessage('each type must be a string'),
  body('filters.supertypes').optional().isArray().withMessage('supertype must be an array'),
  body('filters.supertypes.*').optional().isString().withMessage('each supertype must be a string'),
  body('filters.rarities').optional().isArray().withMessage('rarity must be an array'),
  body('filters.rarities.*').optional().isString().withMessage('each rarity must be a string'),
  body('filters.regulationMarks').optional().isArray().withMessage('regulationMark must be an array'),
  body('filters.regulationMarks.*').optional().isString().withMessage('each regulationMark must be a string'),
  body('filters.hp').optional().isObject().withMessage('hp must be an object'),
  body('filters.hp.gte').optional().isNumeric().withMessage('hp.gte must be a number'),
  body('filters.hp.lte').optional().isNumeric().withMessage('hp.lte must be a number'),
  body('filters.retreatCost').optional().isObject().withMessage('retreatCost must be an object'),
  body('filters.retreatCost.gte').optional().isNumeric().withMessage('retreatCost.gte must be a number'),
  body('filters.retreatCost.lte').optional().isNumeric().withMessage('retreatCost.lte must be a number'),
  body('filters.attackCost').optional().isObject().withMessage('attackCost must be an object'),
  body('filters.attackCost.gte').optional().isNumeric().withMessage('attackCost.gte must be a number'),
  body('filters.attackCost.lte').optional().isNumeric().withMessage('attackCost.lte must be a number'),
  body('filters.nationalPokedexNumber').optional().isNumeric().withMessage('nationalPokedexNumber must be a number'),
  body('filters.cardnumber').optional().isNumeric().withMessage('cardnumber must be a number'),
  body('filters.artist').optional().isString().withMessage('artist must be a string'),
  body('filters.text').optional().isString().withMessage('text must be a string'),
  body('filters.level').optional().isNumeric().withMessage('level must be a number'),
  body('filters.weaknesses').optional().isArray().withMessage('weaknesses must be an array'),
  body('filters.weaknesses.*').optional().isString().withMessage('each weakness must be a string'),
  body('filters.resistances').optional().isArray().withMessage('resistances must be an array'),
  body('filters.resistances.*').optional().isString().withMessage('each resistance must be a string'),
  body('filters.legalities').optional().isArray().withMessage('legalities must be an array'),
  body('filters.legalities.*').optional().isString().withMessage('each legality must be a string'),

  body('page').optional().isInt({ min: 1 }),
  body('pageSize').optional().isInt({ min: 1, max: 100 })
];

// format search parameters into a query string for pokemontcg.io API
function buildQueryString(filters) {
  const queryParts = [];

  if (!filters || Object.keys(filters).length === 0) return '';

  if (filters.name && filters.name.trim() !== '') {
    queryParts.push(`name:"${filters.name}"`);
  }

  if (filters.sets && filters.sets.length > 0) {
    queryParts.push(`(${setConverter.convertNamesToIds(filters.sets).map((set) => `set.id:${set}`).join(' OR ')})`);
  }

  if (filters.types && filters.types.length > 0) {
    queryParts.push(`(${filters.types.map((type) => `types:${type}`).join(' OR ')})`);
  }

  if (filters.supertypes && filters.supertypes.length > 0) {
    queryParts.push(`(${filters.supertypes.map((supertype) => `supertype:${supertype}`).join(' OR ')})`);
  }

  if (filters.rarities && filters.rarities.length > 0) {
    queryParts.push(`(${filters.rarities.map((rarity) => `rarity:"${rarity}"`).join(' OR ')})`);
  }

  if (filters.regulationMarks && filters.regulationMarks.length > 0) {
    queryParts.push(`(${filters.regulationMarks.map((mark) => `regulationMark:${mark}`).join(' OR ')})`);
  }

  if (filters.hp?.gte !== undefined || filters.hp?.lte !== undefined) {
    queryParts.push(`hp:[${filters.hp.gte || '*'} TO ${filters.hp.lte || '*'}]`);
  }

  if (filters.retreatCost?.gte !== undefined || filters.retreatCost?.lte !== undefined) {
    queryParts.push(`convertedRetreatCost:[${filters.retreatCost.gte || '*'} TO ${filters.retreatCost.lte || '*'}]`);
  }

  if (filters.attackCost?.gte !== undefined || filters.attackCost?.lte !== undefined) {
    queryParts.push(`attacks.convertedEnergyCost:[${filters.attackCost.gte || '*'} TO ${filters.attackCost.lte || '*'}]`);
  }

  if (filters.nationalPokedexNumber) {
    queryParts.push(`nationalPokedexNumbers:${filters.nationalPokedexNumber}`);
  }

  if (filters.cardnumber) {
    queryParts.push(`number:${filters.cardnumber}`);
  }

  if (filters.artist) {
    queryParts.push(`artist:"${filters.artist}"`);
  }

  if (filters.text) {
    queryParts.push(`text:"${filters.text}"`);
  }

  if (filters.level) {
    queryParts.push(`level:${filters.level}`);
  }

  if (filters.weaknesses && filters.weaknesses.length > 0) {
    queryParts.push(`(${filters.weaknesses.map((w) => `weaknesses.type:${w}`).join(' OR ')})`);
  }

  if (filters.resistances && filters.resistances.length > 0) {
    queryParts.push(`(${filters.resistances.map((r) => `resistances.type:${r}`).join(' OR ')})`);
  }

  if (filters.legalities && filters.legalities.length > 0) {
    queryParts.push(`(${filters.legalities.map((legality) => `legalities.${legality.toLowerCase()}:Legal`).join(' OR ')})`);
  }

  return queryParts.join(' ');
}

async function searchCards(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { filters, sort = 'name', page = 1, pageSize = 20 } = req.body;

  try {
    const query = buildQueryString(filters);

    const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
      headers: {
        Accept: 'application/json',
        'X-Api-Key': process.env.POKEMON_TCG_API_KEY
      },
      params: {
        q: query,
        page,
        pageSize,
        orderBy: sort
      }
    });

    return res.json({ cards: response.data.data });
  } catch (err) {
    console.error('Error fetching cards:', err);
    return res.status(500).json({ error: 'Failed to fetch card data' });
  }
}

async function searchCardsLocal(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { filters, sort = 'name', page = 1, pageSize = 20 } = req.body;

  try {
    const where = {};

    if (filters?.name && filters.name.trim() !== '') {
      where.name = { [Op.like]: `%${filters.name.trim()}%` };
    }

    if (filters?.sets && Array.isArray(filters.sets) && filters.sets.length > 0) {
      const setVals = filters.sets.map((s) => String(s).trim()).filter(Boolean);

      let mappedIds = [];
      try {
        mappedIds = setConverter.convertNamesToIds(setVals);
      } catch (e) {
        mappedIds = [];
      }

      const looksLikeSetId = (x) => /^[a-z0-9]+$/i.test(x) && x.length <= 12;
      const directIds = setVals.filter(looksLikeSetId);

      const setIds = Array.from(new Set([...(mappedIds || []), ...(directIds || [])]));

      where[Op.or] = [
        ...(setIds.length ? [{ setId: { [Op.in]: setIds } }] : []),
        { setName: { [Op.in]: setVals } }
      ];
    }

    if (filters?.rarities && Array.isArray(filters.rarities) && filters.rarities.length > 0) {
      where.rarity = { [Op.in]: filters.rarities };
    }

    if (filters?.supertypes && Array.isArray(filters.supertypes) && filters.supertypes.length > 0) {
      where.supertype = { [Op.in]: filters.supertypes };
    }

    if (filters?.types && Array.isArray(filters.types) && filters.types.length > 0) {
      where.typesJson = {
        [Op.and]: filters.types.map((t) => ({ [Op.like]: `%"${t}"%` }))
      };
    }

    const order = [];
    if (sort === 'name') order.push(['name', 'ASC']);
    else if (sort === '-name') order.push(['name', 'DESC']);
    else if (sort === 'number') order.push(['number', 'ASC']);
    else if (sort === '-number') order.push(['number', 'DESC']);
    else order.push(['name', 'ASC']);

    const limit = Math.min(Number(pageSize) || 20, 100);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const rows = await CardCache.findAll({ where, limit, offset, order });

    const cards = rows.map((r) => ({
      id: r.id,
      name: r.name,
      number: r.number,
      set: {
        name: r.setName,
        id: r.setId,
        ptcgoCode: r.setId
      },
      images: {
        small: r.imageSmall,
        large: r.imageLarge
      },
      rarity: r.rarity,
      supertype: r.supertype
    }));

    return res.json({ cards, source: 'local' });
  } catch (err) {
    console.error('Local search failed:', err);
    return res.status(500).json({ error: 'Local search failed' });
  }
}

async function listSetsLocal(req, res) {
  try {
    const rows = await CardCache.findAll({
      attributes: ['setId', 'setName'],
      where: {
        setId: { [Op.not]: null }
      },
      group: ['setId', 'setName'],
      order: [['setName', 'ASC']]
    });

    const sets = rows
      .map((r) => ({
        id: r.setId,
        name: r.setName || r.setId
      }))
      .filter((s) => s.id && s.id.trim() !== '')
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    return res.json({ sets });
  } catch (err) {
    console.error('listSetsLocal failed:', err);
    return res.status(500).json({ error: 'Failed to list sets' });
  }
}

async function getCardsByIds(req, res) {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }

  const uniqueIds = Array.from(new Set(ids)).slice(0, 250);

  try {
    const rows = await CardCache.findAll({ where: { id: uniqueIds } });

    const map = {};
    rows.forEach((r) => {
      map[r.id] = {
        id: r.id,
        name: r.name,
        set: r.setName,
        number: r.number,
        images: {
          small: r.imageSmall,
          large: r.imageLarge
        }
      };
    });

    const missing = uniqueIds.filter((x) => !map[x]).slice(0, 100);
    if (missing.length === 0) {
      return res.json({ cards: map, source: 'local' });
    }

    const q = `id:(${missing.map((x) => `\"${x}\"`).join(' OR ')})`;
    const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
      headers: {
        Accept: 'application/json',
        'X-Api-Key': process.env.POKEMON_TCG_API_KEY
      },
      params: {
        q,
        page: 1,
        pageSize: missing.length
      }
    });

    const cards = response.data?.data || [];
    cards.forEach((c) => {
      map[c.id] = {
        id: c.id,
        name: c.name,
        set: c.set?.name,
        number: c.number,
        images: c.images
      };
    });

    return res.json({ cards: map, source: 'mixed' });
  } catch (err) {
    console.error('Error fetching cards by ids:', err?.response?.status || err?.message);
    return res.status(502).json({ error: 'Failed to fetch card data' });
  }
}

async function getCardByIdLocal(req, res) {
  const { id } = req.params;

  try {
    const r = await CardCache.findByPk(id);
    if (!r) return res.status(404).json({ error: 'Card not found (local)' });

    let types;
    let subtypes;
    try { types = r.typesJson ? JSON.parse(r.typesJson) : undefined; } catch (e) { types = undefined; }
    try { subtypes = r.subtypesJson ? JSON.parse(r.subtypesJson) : undefined; } catch (e) { subtypes = undefined; }

    const card = {
      id: r.id,
      name: r.name,
      hp: r.hp,
      types,
      supertype: r.supertype,
      subtypes,
      rarity: r.rarity,
      number: r.number,
      set: {
        id: r.setId,
        name: r.setName,
        series: r.setSeries,
        releaseDate: r.setReleaseDate,
        printedTotal: r.setPrintedTotal
      },
      images: {
        small: r.imageSmall,
        large: r.imageLarge
      }
    };

    return res.json({ card, source: 'local' });
  } catch (err) {
    console.error('getCardByIdLocal failed:', err);
    return res.status(500).json({ error: 'Failed to fetch card (local)' });
  }
}

async function getCardById(req, res) {
  const { id } = req.params;

  try {
    const response = await axios.get(`https://api.pokemontcg.io/v2/cards/${id}`, {
      headers: {
        Accept: 'application/json',
        'X-Api-Key': process.env.POKEMON_TCG_API_KEY
      }
    });

    if (response.data.count === 0 && response.data.totalCount === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }

    return res.json({ card: response.data.data });
  } catch (err) {
    console.error('Error fetching card by ID:', err);
    return res.status(500).json({ error: 'Failed to fetch card data' });
  }
}

export default {
  searchValidation,
  searchCards,
  searchCardsLocal,
  listSetsLocal,
  getCardsByIds,
  getCardByIdLocal,
  getCardById
};
