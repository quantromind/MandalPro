const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { listMessages, sendMessage } = require('../controllers/chatController');

router.use(protect, requireMandal);

router.get('/', listMessages);
router.post('/', sendMessage);

module.exports = router;
