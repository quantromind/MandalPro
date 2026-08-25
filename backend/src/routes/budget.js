const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles } = require('../middleware/rbac');
const { upsertBudget, listBudgets } = require('../controllers/budgetController');

router.use(protect, requireMandal);

router.post('/', allowRoles('president', 'treasurer'), upsertBudget);
router.get('/', listBudgets);

module.exports = router;
