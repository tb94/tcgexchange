import express from 'express';
import authMiddleware from '../middlewares/auth.js';
import adminMiddleware from '../middlewares/admin.js';
import usersController from '../controllers/usersController.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/users', usersController.adminListUsers);
router.post('/users', usersController.adminCreateUser);
router.put('/users/:id', usersController.adminUpdateUser);
router.post('/users/:id/deactivate', usersController.adminDeactivateUser);
router.post('/users/:id/activate', usersController.adminActivateUser);
router.delete('/users/:id', usersController.adminDeleteUser);

export default router;
