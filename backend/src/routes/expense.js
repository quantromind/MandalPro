const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles } = require('../middleware/rbac');
const {
  createExpense,
  submitExpense,
  listExpenses,
  approveExpense,
  rejectExpense,
  markPaid,
  reconcileExpense
} = require('../controllers/expenseController');

router.use(protect, requireMandal);

router.post('/', allowRoles('president', 'treasurer', 'secretary', 'volunteer'), createExpense);
router.get('/', listExpenses);
router.patch('/:id/submit', submitExpense);
router.patch('/:id/approve', allowRoles('president', 'treasurer'), approveExpense);
router.patch('/:id/reject', allowRoles('president', 'treasurer'), rejectExpense);
router.patch('/:id/mark-paid', allowRoles('president', 'treasurer'), markPaid);
router.patch('/:id/reconcile', allowRoles('president', 'treasurer'), reconcileExpense);

module.exports = router;
