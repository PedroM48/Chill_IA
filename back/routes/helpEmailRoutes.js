// routes/helpEmailRoutes.js
const express = require("express");
const router  = express.Router();
const validateToken = require("../middleware/validateToken");
const { sendHelpEmail } = require("../controllers/helpEmailController");

router.post("/", validateToken, sendHelpEmail);

module.exports = router;
