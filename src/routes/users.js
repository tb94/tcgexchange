import express from 'express';
import usersController from '../controllers/usersController.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', usersController.register);
router.post('/signup', usersController.register);
router.post('/login', usersController.login);
router.get('/me', authMiddleware, usersController.me);
router.put('/me/password', authMiddleware, usersController.changePassword);
router.put('/me/avatar', authMiddleware, usersController.updateAvatar);

export default router;
