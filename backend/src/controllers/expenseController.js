const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');
const AuditLog = require('../models/AuditLog');

const APPROVAL_THRESHOLD = 5000; // configurable per mandal in a future settings model

// @desc Create an expense (auto-approved if created by President)
// @route POST /api/expenses
const createExpense = asyncHandler(async (req, res) => {
  const { title, category, amount, vendor, date, description, billImageUrl, ocrData, eventId, status } = req.body;
  const numAmount = Number(amount);
  if (!category || isNaN(numAmount) || numAmount <= 0) {
    res.status(400);
    throw new Error('Valid category and positive amount are required');
  }

  const isPresident = req.user.role === 'president' || req.user.role === 'superadmin';
  const initialStatus = isPresident ? (status || 'Approved') : (status || 'Submitted');

  const expense = await Expense.create({
    mandalId: req.mandalId,
    eventId,
    title: title || category,
    category: category || 'Misc / Other',
    amount: numAmount,
    vendor,
    date: date ? new Date(date) : new Date(),
    description,
    billImageUrl,
    ocrData,
    status: initialStatus,
    createdBy: req.user._id,
    approvedBy: isPresident ? req.user._id : undefined
  });
  res.status(201).json(expense);
});

// @desc Get single expense
// @route GET /api/expenses/:id
const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }
  res.json(expense);
});

// @desc Update expense
// @route PUT/PATCH /api/expenses/:id
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  const { title, category, amount, vendor, date, description, billImageUrl } = req.body;
  if (title !== undefined) expense.title = title;
  if (category !== undefined) expense.category = category;
  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400);
      throw new Error('Amount must be a positive number');
    }
    expense.amount = numAmount;
  }
  if (vendor !== undefined) expense.vendor = vendor;
  if (date !== undefined) expense.date = new Date(date);
  if (description !== undefined) expense.description = description;
  if (billImageUrl !== undefined) expense.billImageUrl = billImageUrl;

  await expense.save();
  res.json(expense);
});

// @desc Delete expense
// @route DELETE /api/expenses/:id
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  await Expense.deleteOne({ _id: req.params.id, mandalId: req.mandalId });

  await AuditLog.create({
    mandalId: req.mandalId,
    action: 'expense.delete',
    entity: 'Expense',
    entityId: expense._id,
    performedBy: req.user._id
  });

  res.json({ message: 'Expense deleted successfully', id: req.params.id });
});

// @desc Submit a draft for approval
// @route PATCH /api/expenses/:id/submit
const submitExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!expense) { res.status(404); throw new Error('Expense not found'); }
  if (expense.status !== 'Draft') { res.status(400); throw new Error('Only draft expenses can be submitted'); }
  expense.status = 'Submitted';
  await expense.save();
  res.json(expense);
});

// @desc List expenses, filterable by status
// @route GET /api/expenses
const listExpenses = asyncHandler(async (req, res) => {
  const { status, eventId } = req.query;
  const filter = { mandalId: req.mandalId };
  if (status) filter.status = status;
  if (eventId) filter.eventId = eventId;
  const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 }).limit(500);
  res.json(expenses);
});

// @desc Approve an expense. Above threshold, only president role may approve.
// @route PATCH /api/expenses/:id/approve
const approveExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!expense) { res.status(404); throw new Error('Expense not found'); }
  if (expense.status !== 'Submitted') { res.status(400); throw new Error('Only submitted expenses can be approved'); }

  if (expense.amount > APPROVAL_THRESHOLD && req.user.role !== 'president') {
    res.status(403);
    throw new Error(`Expenses above ₹${APPROVAL_THRESHOLD} require President approval`);
  }

  expense.status = 'Approved';
  expense.reviewedBy = req.user._id;
  expense.approvedBy = req.user._id;
  await expense.save();

  await AuditLog.create({
    mandalId: req.mandalId,
    action: 'expense.approve',
    entity: 'Expense',
    entityId: expense._id,
    performedBy: req.user._id
  });

  res.json(expense);
});

// @desc Reject an expense — requires a written reason, returns to Draft
// @route PATCH /api/expenses/:id/reject
const rejectExpense = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason) { res.status(400); throw new Error('A reason is required to reject an expense'); }
  const expense = await Expense.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!expense) { res.status(404); throw new Error('Expense not found'); }

  expense.status = 'Draft';
  expense.rejectReason = reason;
  expense.reviewedBy = req.user._id;
  await expense.save();

  await AuditLog.create({
    mandalId: req.mandalId,
    action: 'expense.reject',
    entity: 'Expense',
    entityId: expense._id,
    performedBy: req.user._id,
    reason
  });

  res.json(expense);
});

// @desc Mark an approved expense Paid, then Reconciled
// @route PATCH /api/expenses/:id/mark-paid
const markPaid = asyncHandler(async (req, res) => {
  const { paymentType } = req.body;
  const expense = await Expense.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!expense) { res.status(404); throw new Error('Expense not found'); }
  if (expense.status !== 'Approved') { res.status(400); throw new Error('Only approved expenses can be marked Paid'); }
  expense.status = 'Paid';
  expense.paymentType = paymentType || 'cash';
  await expense.save();
  res.json(expense);
});

// @desc Mark a paid expense Reconciled during cash/bank reconciliation
// @route PATCH /api/expenses/:id/reconcile
const reconcileExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!expense) { res.status(404); throw new Error('Expense not found'); }
  if (expense.status !== 'Paid') { res.status(400); throw new Error('Only paid expenses can be reconciled'); }
  expense.status = 'Reconciled';
  await expense.save();
  res.json(expense);
});

module.exports = {
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
};
