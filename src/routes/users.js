import express from 'express';
import { signup, login, validate, getCurrentUser } from '../controllers/usersController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/validate', authMiddleware, validate);
router.get('/me', authMiddleware, getCurrentUser);

export default router;
