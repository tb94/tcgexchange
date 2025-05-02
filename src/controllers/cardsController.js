const { validationResult } = require('express-validator');
const { body } = require('express-validator');
require('dotenv').config();
const axios = require('axios');
const setConverter = require('../util/setConverter');

// Input validation
exports.validationRules = [
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
    if (filters.name && filters.name.trim() !== '') {
        queryParts.push(`name:"${filters.name}"`);
    }

    // set: [] `(set.id:base1 OR set.id:base4)`
    if (filters.sets && filters.sets.length > 0) {
        queryParts.push(`(${setConverter.convertNamesToIds(filters.sets).map(set => `set.id:${set}`).join(' OR ')})`);
    }

    // types: [] `(types:grass OR types:fire)`
    if (filters.types && filters.types.length > 0) {
        queryParts.push(`(${filters.types.map(type => `types:${type}`).join(' OR ')})`);
    }

    // subtypes: [] `(subtypes:stage2 OR subtypes:ex)` // case insensitivity through the API means we can't search for "ex" without also searching for "EX" - probably leave this out until we can figure out a plan.
    // if (filters.subtypes && filters.subtypes.length > 0) {
    //     const subtypeQuery = filters.subtypes.map(subtype => `subtypes:${subtype}`).join(' OR ');
    //     queryParts.push(`(${subtypeQuery})`);
    // }

    // supertype: [] `(supertype:Pokémon OR supertype:Trainer)`
    if (filters.supertypes && filters.supertypes.length > 0) {
        queryParts.push(`(${filters.supertypes.map(supertype => `supertype:${supertype}`).join(' OR ')})`);
    }

    // rarity: [] `(rarity:"Double Rare" OR rarity:"Hyper Rare")`
    if (filters.rarities && filters.rarities.length > 0) {
        queryParts.push(`(${filters.rarities.map(rarity => `rarity:"${rarity}"`).join(' OR ')})`);
    }

    // regulationMark: [] `(regulationMark:D OR regulationMark:E)`
    if (filters.regulationMarks && filters.regulationMarks.length > 0) {
        queryParts.push(`(${filters.regulationMarks.map(mark => `regulationMark:${mark}`).join(' OR ')})`);
    }

    // hp: { gte: 50, lte: 100 } `hp:[50 TO 100]`
    if (filters.hp.gte !== undefined || filters.hp.lte !== undefined) {
        queryParts.push(`hp:[${filters.hp.gte || "*"} TO ${filters.hp.lte || "*"}]`);
    }

    // retreatCost: { gte: 1, lte: 3 } `retreatCost:[1 TO 3]`
    if (filters.retreatCost?.gte !== undefined || filters.retreatCost?.lte !== undefined) {
        queryParts.push(`convertedRetreatCost:[${filters.retreatCost.gte || "*"} TO ${filters.retreatCost.lte || "*"}]`);
    }

    // attack energy cost: { gte: 1, lte: 3 } `attacks.convertedEnergyCost:[1 TO 3]`
    if (filters.attackCost.gte !== undefined || filters.attackCost.lte !== undefined) {
        queryParts.push(`attacks.convertedEnergyCost:[${filters.attackCost.gte || "*"} TO ${filters.attackCost.lte || "*"}]`);
    }

    // nationalPokedexNumber: `nationalPokedexNumber:25`
    if (filters.nationalPokedexNumber) {
        queryParts.push(`nationalPokedexNumbers:${filters.nationalPokedexNumber}`);
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

    // level: `level:17`
    if (filters.level) {
        queryParts.push(`level:${filters.level}`);
    }

    // weaknesses: [] `(weaknesses.type:water OR weaknesses.type:fire)`
    if (filters.weaknesses && filters.weaknesses.length > 0) {
        queryParts.push(`(${filters.weaknesses.map(weakness => `weaknesses.type:${weakness}`).join(' OR ')})`);
    }

    // resistance: [] `(resistances.type:water OR resistances.type:fire)`
    if (filters.resistances && filters.resistances.length > 0) {
        queryParts.push(`(${filters.resistances.map(resistance => `resistances.type:${resistance}`).join(' OR ')})`);
    }

    // legalities: [] `(legalities.standard:legal OR legalities.expanded:legal)`
    if (filters.legalities && filters.legalities.length > 0) {
        queryParts.push(`(${filters.legalities.map(legality => `legalities.${legality.toLowerCase()}:Legal`).join(' OR ')})`);
    }

    // tcgplayer.prices: { gte: 15, lte: 30 } //  I don't understand the pricing for the tcgplayer and cardmarket objects. we might have to do some extra parsing for that.
    // if (filters.tcgplayer) {}

    // cardmarket.prices: { gte: 15, lte: 30 }

    return queryParts.join(' ');
}