const asyncHandler = require('express-async-handler');
const Mandal = require('../models/Mandal');

const getMandal = asyncHandler(async (req, res) => {
  const mandal = await Mandal.findById(req.mandalId);
  if (!mandal) { res.status(404); throw new Error('Mandal not found'); }
  res.json(mandal);
});

const updateMandal = asyncHandler(async (req, res) => {
  const mandal = await Mandal.findByIdAndUpdate(req.mandalId, req.body, { new: true });
  res.json(mandal);
});

module.exports = { getMandal, updateMandal };
