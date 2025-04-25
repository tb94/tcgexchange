const { validationResult } = require('express-validator');
const { body } = require('express-validator');
require('dotenv').config();
const axios = require('axios');

// Input validation
exports.validationRules = [
    body('filters.name').optional().isString().withMessage('name must be a string'),
    body('filters.set').optional().isArray().withMessage('set must be an array'),
    body('filters.set.*').optional().isString().withMessage('each set must be a string'),
    body('filters.types').optional().isArray().withMessage('types must be an array'),
    body('filters.types.*').optional().isString().withMessage('each type must be a string'),
    body('filters.supertype').optional().isArray().withMessage('supertype must be an array'),
    body('filters.supertype.*').optional().isString().withMessage('each supertype must be a string'),
    body('filters.rarity').optional().isArray().withMessage('rarity must be an array'),
    body('filters.rarity.*').optional().isString().withMessage('each rarity must be a string'),
    body('filters.regulationMark').optional().isArray().withMessage('regulationMark must be an array'),
    body('filters.regulationMark.*').optional().isString().withMessage('each regulationMark must be a string'),
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
    body('filters.level').optional().isObject().withMessage('level must be an object'),
    body('filters.level.gte').optional().isNumeric().withMessage('level.gte must be a number'),
    body('filters.level.lte').optional().isNumeric().withMessage('level.lte must be a number'),
    body('filters.weaknesses').optional().isArray().withMessage('weaknesses must be an array'),
    body('filters.weaknesses.*').optional().isString().withMessage('each weakness must be a string'),
    body('filters.resistances').optional().isArray().withMessage('resistances must be an array'),
    body('filters.resistances.*').optional().isString().withMessage('each resistance must be a string'),
    body('filters.legalities').optional().isArray().withMessage('legalities must be an array'),
    body('filters.legalities.*').optional().isString().withMessage('each legality must be a string'),

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
        console.error('Error fetching cards:', err);
        res.status(500).json({ error: 'Failed to fetch card data' });
    }
};

// format search parameters into a query string for pokemontcg.io API
function buildQueryString(filters) {

    const queryParts = [];

    // if no filters are provided, return an empty string
    if (!filters || Object.keys(filters).length === 0) {
        return '';
    }

    // Iterate over filters and build query string

    // name: `(name:Pikachu)`
    if (filters.name) {
        queryParts.push(`name:"${filters.name}"`);
    }

    // set: [] `(set.id:base1 OR set.id:base4)`
    if (filters.set) {
        const setQuery = filters.set.map(set => `set.id:${set}`).join(' OR '); // TODO: map the set names to their IDs so that the client only needs set names
        queryParts.push(`(${setQuery})`);
    }

    // types: [] `(types:grass OR types:fire)`
    if (filters.types) {
        const typeQuery = filters.types.map(type => `types:${type}`).join(' OR ');
        queryParts.push(`(${typeQuery})`);
    }

    // subtypes: [] `(subtypes:stage2 OR subtypes:ex)` // case insensitivity through the API means we can't search for "ex" without also searching for "EX" - probably leave this out until we can figure out a plan.
    // if (filters.subtypes) {
    //     const subtypeQuery = filters.subtypes.map(subtype => `subtypes:${subtype}`).join(' OR ');
    //     queryParts.push(`(${subtypeQuery})`);
    // }

    // supertype: [] `(supertype:Pokémon OR supertype:Trainer)`
    if (filters.supertype) {
        const supertypeQuery = filters.supertype.map(supertype => `supertype:${supertype}`).join(' OR ');
        queryParts.push(`(${supertypeQuery})`);
    }

    // rarity: [] `(rarity:"Double Rare" OR rarity:"Hyper Rare")`
    if (filters.rarity) {
        const rarityQuery = filters.rarity.map(rarity => `rarity:"${rarity}"`).join(' OR ');
        queryParts.push(`(${rarityQuery})`);
    }

    // regulationMark: [] `(regulationMark:D OR regulationMark:E)`
    if (filters.regulationMark) {
        const regulationMarkQuery = filters.regulationMark.map(mark => `regulationMark:${mark}`).join(' OR ');
        queryParts.push(`(${regulationMarkQuery})`);
    }

    // hp: { gte: 50, lte: 100 } `hp:[50 TO 100]`
    if (filters.hp) {
        queryParts.push(`hp:[${filters.hp.gte} TO ${filters.hp.lte}]`);
    }

    // retreatCost: { gte: 1, lte: 3 } `retreatCost:[1 TO 3]`
    if (filters.retreatCost) {
        queryParts.push(`retreatCost:[${filters.retreatCost.gte} TO ${filters.retreatCost.lte}]`);
    }

    // attack energy cost: { gte: 1, lte: 3 } `attacks.convertedEnergyCost:[1 TO 3]`
    if (filters.attackCost) {
        queryParts.push(`attacks.convertedEnergyCost:[${attack.gte} TO ${attack.lte}]`);
    }

    // nationalPokedexNumber: `nationalPokedexNumber:25`
    if (filters.nationalPokedexNumber) {
        queryParts.push(`nationalPokedexNumber:${filters.nationalPokedexNumber}`);
    }

    // cardnumber: `number:125`
    if (filters.cardnumber) {
        queryParts.push(`number:${filters.cardnumber}`);
    }

    // artist: `artist:"John Doe~"`
    if (filters.artist) {
        queryParts.push(`artist:"${filters.artist}~"`);
    }

    // text: `flavorText:"trees"`
    if (filters.text) {
        queryParts.push(`flavorText:"${filters.text}"`);
    }

    // level: { gte: 10, lte: 30 } `level:[10 TO 30]`
    if (filters.level) {
        queryParts.push(`(level:[${filters.level.gte} TO ${filters.level.lte}])`);
    }

    // weaknesses: [] `(weaknesses.type:water OR weaknesses.type:fire)`
    if (filters.weaknesses) {
        const weaknessQuery = filters.weaknesses.map(weakness => `weaknesses.type:${weakness}`).join(' OR ');
        queryParts.push(`(${weaknessQuery})`);
    }

    // resistance: [] `(resistances.type:water OR resistances.type:fire)`
    if (filters.resistances) {
        const resistanceQuery = filters.resistances.map(resistance => `resistances.type:${resistance}`).join(' OR ');
        queryParts.push(`(${resistanceQuery})`);
    }

    // legalities: [] `(legalities.standard:legal OR legalities.expanded:legal)`
    if (filters.legalities) {
        const legalityQuery = filters.legalities.map(legality => `legalities.${legality}:Legal`).join(' OR ');
        queryParts.push(`(${legalityQuery})`);
    }

    // tcgplayer.prices: { gte: 15, lte: 30 } //  I don't understand the pricing for the tcgplayer and cardmarket objects. we might have to do some extra parsing for that.
    // if (filters.tcgplayer) {}

    // cardmarket.prices: { gte: 15, lte: 30 }

    return queryParts.join(' ');
}