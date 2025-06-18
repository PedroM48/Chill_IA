// back/src/routes/chatRoutes.js
const router = require('express').Router();
const validateToken = require('../middleware/validateToken');
const { startChat, endChat } = require('../controllers/chatController');

router.post('/start', validateToken, startChat);
router.post('/end',   validateToken, endChat);

module.exports = router;
