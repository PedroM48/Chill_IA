// back/src/routes/analyticsRoutes.js
const router = require('express').Router();
const validateToken = require('../middleware/validateToken');
const { storeEvent } = require('../controllers/analyticsController');

router.post('/', validateToken, storeEvent);

module.exports = router;
