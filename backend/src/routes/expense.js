const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles, checkPermission } = require('../middleware/rbac');
const {
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
  submitExpense,
  listExpenses,
  approveExpense,
  rejectExpense,
  markPaid,
  reconcileExpense
} = require('../controllers/expenseController');

router.use(protect, requireMandal);

router.post('/', checkPermission('canManageExpenses'), createExpense);
router.get('/', listExpenses);
router.get('/:id', getExpense);
router.put('/:id', checkPermission('canManageExpenses'), updateExpense);
router.patch('/:id', checkPermission('canManageExpenses'), updateExpense);
router.delete('/:id', allowRoles('president', 'treasurer'), deleteExpense);
router.patch('/:id/submit', checkPermission('canManageExpenses'), submitExpense);
router.patch('/:id/approve', allowRoles('president', 'treasurer'), approveExpense);
router.patch('/:id/reject', allowRoles('president', 'treasurer'), rejectExpense);
router.patch('/:id/mark-paid', allowRoles('president', 'treasurer'), markPaid);
router.patch('/:id/reconcile', allowRoles('president', 'treasurer'), reconcileExpense);

module.exports = router;

