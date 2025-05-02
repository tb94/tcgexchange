const express = require('express');
const cardsController = require('../controllers/cardsController');

const router = express.Router();

// Card Search Endpoint
router.post(
  '/search',
  cardsController.validationRules,
  cardsController.searchCards
);

module.exports = router;
