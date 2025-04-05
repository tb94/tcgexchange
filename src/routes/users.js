const express = require('express');
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middlewares/auth');
const path = require('path');

const router = express.Router();

router.post('/signup', usersController.signup);
router.post('/login', usersController.login);
router.get('/me', authMiddleware, usersController.getCurrentUser);

module.exports = router;
