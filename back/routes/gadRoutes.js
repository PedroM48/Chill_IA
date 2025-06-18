// src/routes/gadRoutes.js
const router = require('express').Router();
const validateToken = require('../middleware/validateToken');
const { storeGadResult } = require('../controllers/gadController');

router.post('/', validateToken, storeGadResult);

module.exports = router;
