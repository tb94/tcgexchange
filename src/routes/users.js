const express = require('express');
const usersController = require('../controllers/usersController');
const authMiddleware = require('../middlewares/auth');
const path = require('path');

const router = express.Router();

router.post('/signup', usersController.signup);
// router.get('/signup', (req, res) => {
//     res.sendFile(path.join(__dirname, '../views/signup.html'));
// });

router.post('/login', usersController.login);
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.get('/me', authMiddleware, usersController.getCurrentUser);

module.exports = router;
