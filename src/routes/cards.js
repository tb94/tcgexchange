const express = require('express');
const cardsController = require('../controllers/cardsController');

const router = express.Router();

// Card Search Endpoint
router.post(
  '/search',
  cardsController.searchValidation,
  cardsController.searchCards
);

router.get(
  '/:id',
  cardsController.getCardById
);
module.exports = router;
