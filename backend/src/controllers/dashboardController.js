const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Event = require('../models/Event');

// @desc Dashboard summary: collections, expenses, balance, pending approvals
// @route GET /api/dashboard/summary
const getSummary = asyncHandler(async (req, res) => {
  const mandalId = req.mandalId;

  const mandalObjId = mongoose.Types.ObjectId.isValid(mandalId)
    ? new mongoose.Types.ObjectId(mandalId)
    : null;

  const mandalMatch = mandalObjId
    ? { $in: [mandalObjId, mandalId.toString()] }
    : mandalId;

  const [collectionsAgg, expensesAgg, pendingApprovals, activeEvents, recentDonations, recentExpenses] = await Promise.all([
    Donation.aggregate([
      { $match: { mandalId: mandalMatch, status: { $in: ['Issued', 'issued'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Expense.aggregate([
      { $match: { mandalId: mandalMatch, status: { $in: ['Approved', 'Paid', 'Reconciled', 'approved', 'paid', 'reconciled'] } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),
    Expense.countDocuments({ mandalId, status: { $in: ['Submitted', 'pending'] } }),
    Event.countDocuments({ mandalId, status: { $in: ['Planned', 'Active'] } }),
    Donation.find({ mandalId }).sort({ createdAt: -1 }).limit(5),
    Expense.find({ mandalId }).sort({ createdAt: -1 }).limit(5)
  ]);

  const totalCollections = collectionsAgg[0]?.total || 0;
  const totalExpenses = expensesAgg[0]?.total || 0;

  res.json({
    totalCollections,
    totalExpenses,
    totalInflow: totalCollections,
    totalOutflow: totalExpenses,
    balance: totalCollections - totalExpenses,
    netBalance: totalCollections - totalExpenses,
    donationCount: collectionsAgg[0]?.count || 0,
    expenseCount: expensesAgg[0]?.count || 0,
    pendingApprovals,
    activeEvents,
    recentDonations,
    recentExpenses
  });
});

module.exports = { getSummary };
