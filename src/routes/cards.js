import express from 'express';
import { searchValidation, searchCards, getCardById } from '../controllers/cardsController.js';

const router = express.Router();

// Card Search Endpoint
router.post(
  '/search',
  searchValidation,
  searchCards
);

router.get(
  '/:id',
  getCardById
);

export default router;
