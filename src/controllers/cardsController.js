const { validationResult } = require('express-validator');
const { body } = require('express-validator');
require('dotenv').config();
const axios = require('axios');

// Input validation
exports.validationRules = [
    body('name').optional().isString().withMessage('name must be a string'),
    body('types').optional().isArray().withMessage('types must be an array'),
    body('types.*').optional().isString().withMessage('each type must be a string'),
    body('hp.gte').optional().isNumeric().withMessage('hp.gte must be a number'),
    body('hp.lte').optional().isNumeric().withMessage('hp.lte must be a number'),
    body('set').optional().isString().withMessage('set must be a string'),
    body('tcgplayer.prices.normal.market.gte').optional().isNumeric()
        .withMessage('tcgplayer.prices.normal.market.gte must be a number'),
    body('tcgplayer.prices.normal.market.lte').optional().isNumeric()
        .withMessage('tcgplayer.prices.normal.market.lte must be a number'),
    body('page').optional().isInt({ min: 1 }),
    body('pageSize').optional().isInt({ min: 1, max: 100 }) // Limit to 100 results per page
];

// Search external api for cards
exports.searchCards = async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Extract filters from request body
    const { filters, sort = 'name', page = 1, pageSize = 20 } = req.body;

    try {
        // Build query string for PokémonTCG API
        let query = buildQueryString(filters);

        // API Request
        const response = await axios.get('https://api.pokemontcg.io/v2/cards', {
            headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY },
            params: {
                q: query,
                page,
                pageSize,
                orderBy: sort
            }
        });

        res.json({ cards: response.data.data });
    } catch (err) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch card data' });
    }
};

// format search parameters into a query string for pokemontcg.io
function buildQueryString(filters) {
    const queryParts = [];

    for (const [field, value] of Object.entries(filters)) {
        if (typeof value === 'string' || typeof value === 'number') {
            queryParts.push(`${field}:"${value}"`);
        } else if (Array.isArray(value)) {
            const orQuery = value.map(v => `${field}:"${v}"`).join(' OR ');
            queryParts.push(`(${orQuery})`);
        } else if (typeof value === 'object' && value !== null) {
            // Range queries
            if (value.gte !== undefined) {
                queryParts.push(`${field}>=${value.gte}`);
            }
            if (value.lte !== undefined) {
                queryParts.push(`${field}<=${value.lte}`);
            }
        }
    }

    return queryParts.join(' ');
}