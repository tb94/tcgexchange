import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import tradesController from '../controllers/tradesController.js';

const router = express.Router();

router.get('/recommendations', authMiddleware, tradesController.recommendations);
router.get('/matches/:otherUserId', authMiddleware, tradesController.matches);
router.post('/', authMiddleware, tradesController.create);
router.get('/:id', authMiddleware, tradesController.detail);

export default router;
