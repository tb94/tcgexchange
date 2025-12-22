const express = require('express');
const router = express.Router();
const cardsController = require('../controllers/cardsController');
const authMiddleware = require('../middlewares/auth'); // use JWT version


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
