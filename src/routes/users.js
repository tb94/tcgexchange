const express = require('express');
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middlewares/auth');
const router = express.Router();

router.post('/signup', usersController.signup);
router.post('/login', usersController.login);
router.get('/validate', authMiddleware, usersController.validate);
router.get('/me', authMiddleware, usersController.getCurrentUser);

module.exports = router;
