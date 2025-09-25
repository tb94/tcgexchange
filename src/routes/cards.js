const express = require('express');
const cardsController = require('../controllers/cardsController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Card Search Endpoint
router.post(
  '/search',
  cardsController.searchValidation,
  cardsController.searchCards
);

// Get card by ID
router.get(
  '/:id',
  cardsController.getCardById
);

// Add to Wishlist (NEW)
router.post(
  '/add-to-wishlist',
  authMiddleware,
  cardsController.addToWishlist
);

module.exports = router;
