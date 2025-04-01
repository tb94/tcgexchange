const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

// Card Search Endpoint
router.post('/search', async (req, res) => {
    const { name, set, rarity, types, subtypes, hp, supertype } = req.body;
  
    try {
      // Build query string for PokémonTCG API
      let query = [];
      if (name) query.push(`name:${name}`);
      if (set) query.push(`set.id:${set}`);
      if (rarity) query.push(`rarity:${rarity}`);
      if (types) query.push(`types:${types}`);
      if (subtypes) query.push(`subtypes:${subtypes}`);
      if (hp) query.push(`hp:${hp}`);
      if (supertype) query.push(`supertype:${supertype}`);
  
      const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
        headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY },
        params: { q: query.join(' ') } // Format query
      });
  
      res.json(response.data); // Return API response to client
    } catch (error) {
      console.error('Error fetching cards:', error);
      res.status(500).json({ error: 'Failed to fetch card data' });
    }
  });
  
module.exports = router;
