const asyncHandler = require('express-async-handler');
const Sponsor = require('../models/Sponsor');

const createSponsor = asyncHandler(async (req, res) => {
  const sponsor = await Sponsor.create({ ...req.body, mandalId: req.mandalId });
  res.status(201).json(sponsor);
});

const listSponsors = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = { mandalId: req.mandalId };
  if (type) filter.type = type;
  const sponsors = await Sponsor.find(filter).sort({ createdAt: -1 });
  res.json(sponsors);
});

const recordPayment = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const sponsor = await Sponsor.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!sponsor) { res.status(404); throw new Error('Not found'); }
  sponsor.amountPaid += Number(amount || 0);
  await sponsor.save();
  res.json(sponsor);
});

module.exports = { createSponsor, listSponsors, recordPayment };
