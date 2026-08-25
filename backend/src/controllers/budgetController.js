const asyncHandler = require('express-async-handler');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @desc Create or update a category budget
// @route POST /api/budgets
const upsertBudget = asyncHandler(async (req, res) => {
  const { category, allocatedAmount, eventId } = req.body;
  if (!category || allocatedAmount == null) {
    res.status(400); throw new Error('category and allocatedAmount are required');
  }
  const budget = await Budget.findOneAndUpdate(
    { mandalId: req.mandalId, eventId: eventId || null, category },
    { allocatedAmount, createdBy: req.user._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(budget);
});

// @desc List budgets with live spend-vs-budget and a simple linear-trend forecast/risk flag
// @route GET /api/budgets
const listBudgets = asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const filter = { mandalId: req.mandalId };
  if (eventId) filter.eventId = eventId;

  const budgets = await Budget.find(filter).lean();

  const results = await Promise.all(
    budgets.map(async (b) => {
      const spendAgg = await Expense.aggregate([
        {
          $match: {
            mandalId: b.mandalId,
            category: b.category,
            ...(b.eventId ? { eventId: b.eventId } : {}),
            status: { $in: ['Approved', 'Paid', 'Reconciled'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const spent = spendAgg[0]?.total || 0;
      const pctUsed = b.allocatedAmount > 0 ? spent / b.allocatedAmount : 0;

      // Simple linear-pace forecast: if we've used pctUsed of budget, flag risk level
      let risk = 'on-track';
      if (pctUsed >= 1) risk = 'over';
      else if (pctUsed >= 0.8) risk = 'at-risk';

      return { ...b, spent, remaining: b.allocatedAmount - spent, pctUsed, risk };
    })
  );

  res.json(results);
});

module.exports = { upsertBudget, listBudgets };
