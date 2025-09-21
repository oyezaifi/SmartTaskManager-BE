const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upgrade } = require('../controllers/subscription.controller');

router.use(auth);
router.post('/upgrade', upgrade);

module.exports = router;


