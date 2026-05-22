import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import wishlistController from '../controllers/wishlistController.js';

const router = express.Router();

router.get('/', authMiddleware, wishlistController.list);
router.post('/', authMiddleware, wishlistController.create);
router.put('/:id', authMiddleware, wishlistController.update);
router.delete('/:id', authMiddleware, wishlistController.remove);

export default router;
