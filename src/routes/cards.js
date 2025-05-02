const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const router = express.Router();

// Card Search Endpoint
router.post(
  '/search',
  [
    // Validation Rules
    body('name').optional().isString(),
    body('set').optional().isString(),
    body('rarity').optional().isString(),
    body('types').optional().isArray(),
    body('subtypes').optional().isArray(),
    body('hp').optional().isInt({ min: 10 }), // HP should be a positive integer
    body('supertype').optional().isString(),
    body('page').optional().isInt({ min: 1 }),
    body('pageSize').optional().isInt({ min: 1, max: 100 }) // Limit to 100 results per page
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract filters from request body
    const {
      name, set, rarity, types, subtypes, hp, supertype,
      page = 1, pageSize = 20
    } = req.body;

    try {
      // Build query string for PokémonTCG API
      const query = [];
      if (name) query.push(`name:${name}`);
      if (set) query.push(`set.id:${set}`);
      if (rarity) query.push(`rarity:${rarity}`);
      if (types && types.length) query.push(`types:${types.join(',')}`);
      if (subtypes && subtypes.length) query.push(`subtypes:${subtypes.join(',')}`);
      if (hp) query.push(`hp:${hp}`);
      if (supertype) query.push(`supertype:${supertype}`);

      // API Request
      const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
        headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY },
        params: {
          q: query.join(' '),
          page,
          pageSize,
          orderBy: 'name' // Default sorting by name
        }
      });

      return res.json(response.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
      return res.status(500).json({ error: 'Failed to fetch card data' });
    }
  }
);
module.exports = router;
