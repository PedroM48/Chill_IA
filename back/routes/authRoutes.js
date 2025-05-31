const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const validateToken = require('../middleware/validateToken');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', validateToken, getProfile);

module.exports = router;