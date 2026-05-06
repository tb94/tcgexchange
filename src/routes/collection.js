import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import collectionController from '../controllers/collectionController.js';

const router = express.Router();

router.get('/', authMiddleware, collectionController.list);
router.post('/', authMiddleware, collectionController.create);
router.put('/:id', authMiddleware, collectionController.update);
router.delete('/:id', authMiddleware, collectionController.remove);

export default router;
