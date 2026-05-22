import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import tradesController from '../controllers/tradesController.js';

const router = express.Router();

router.get('/', authMiddleware, tradesController.list);
router.get('/recommendations', authMiddleware, tradesController.recommendations);
router.get('/matches/:otherUserId', authMiddleware, tradesController.matches);
router.get('/builder/:otherUserId', authMiddleware, tradesController.builder);
router.post('/', authMiddleware, tradesController.create);
router.get('/:id', authMiddleware, tradesController.detail);
router.post('/:id/counter', authMiddleware, tradesController.counter);
router.post('/:id/respond', authMiddleware, tradesController.respond);
router.post('/:id/messages', authMiddleware, tradesController.sendMessage);
router.post('/:id/hide', authMiddleware, tradesController.hide);

export default router;
