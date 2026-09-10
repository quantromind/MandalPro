const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { checkPermission } = require('../middleware/rbac');
const { listMessages, sendMessage } = require('../controllers/chatController');

router.use(protect, requireMandal);

router.get('/', checkPermission('canChat'), listMessages);
router.post('/', checkPermission('canChat'), sendMessage);

module.exports = router;

