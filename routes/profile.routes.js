const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMe, updateProfile, changePassword } = require('../controllers/profile.controller');

router.use(auth);
router.get('/me', getMe);
router.patch('/me', updateProfile);
router.post('/change-password', changePassword);

module.exports = router;


