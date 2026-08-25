const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { getSummary } = require('../controllers/dashboardController');

router.use(protect, requireMandal);
router.get('/summary', getSummary);

module.exports = router;
