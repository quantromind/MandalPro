const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Event = require('../models/Event');

// @desc Dashboard summary: collections, expenses, balance, pending approvals
// @route GET /api/dashboard/summary
const getSummary = asyncHandler(async (req, res) => {
  const mandalId = req.mandalId;

  const [collectionsAgg, expensesAgg, pendingApprovals, activeEvents, recentDonations] = await Promise.all([
    Donation.aggregate([
      { $match: { mandalId: new mongoose.Types.ObjectId(mandalId), status: 'Issued' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Expense.aggregate([
      { $match: { mandalId: new mongoose.Types.ObjectId(mandalId), status: { $in: ['Approved', 'Paid', 'Reconciled'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Expense.countDocuments({ mandalId, status: 'Submitted' }),
    Event.countDocuments({ mandalId, status: { $in: ['Planned', 'Active'] } }),
    Donation.find({ mandalId }).sort({ createdAt: -1 }).limit(5)
  ]);

  const totalCollections = collectionsAgg[0]?.total || 0;
  const totalExpenses = expensesAgg[0]?.total || 0;

  res.json({
    totalCollections,
    totalExpenses,
    balance: totalCollections - totalExpenses,
    donationCount: collectionsAgg[0]?.count || 0,
    expenseCount: expensesAgg[0]?.count || 0,
    pendingApprovals,
    activeEvents,
    recentDonations
  });
});

module.exports = { getSummary };
