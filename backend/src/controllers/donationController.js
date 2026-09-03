const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');
const Donation = require('../models/Donation');
const Mandal = require('../models/Mandal');
const AuditLog = require('../models/AuditLog');

// @desc Create a donation / collection + generate trusted receipt number (handles offline idempotency)
// @route POST /api/donations (or /api/collections)
const createDonation = asyncHandler(async (req, res) => {
  const {
    donorName,
    contributor,
    title,
    purpose,
    category,
    amount,
    date,
    description,
    donorMobile,
    paymentMode,
    eventId,
    idempotencyKey
  } = req.body;

  const resolvedName = donorName || contributor || title;
  const numAmount = Number(amount);

  if (!resolvedName || isNaN(numAmount) || numAmount <= 0) {
    res.status(400);
    throw new Error('Name/Title and positive amount are required');
  }

  // Idempotent replay: if this key was already synced, return the existing record instead of duplicating
  if (idempotencyKey) {
    const existing = await Donation.findOne({ mandalId: req.mandalId, idempotencyKey });
    if (existing) {
      return res.status(200).json(existing);
    }
  }

  const mandal = await Mandal.findById(req.mandalId);
  const { getNextReceiptNumber } = require('../utils/receiptNumber');
  const receiptNumber = await getNextReceiptNumber(req.mandalId, mandal?.receiptPrefix || 'RCPT', mandal?.financialYearStartMonth || 4);

  const qrPayload = `${receiptNumber}|${numAmount}|${req.mandalId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

  const effectiveIdempotencyKey = (typeof idempotencyKey === 'string' && idempotencyKey.trim())
    ? idempotencyKey.trim()
    : `srv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const donation = await Donation.create({
    mandalId: req.mandalId,
    eventId: eventId || undefined,
    title: title || purpose || 'General Donation',
    donorName: resolvedName,
    donorMobile,
    amount: numAmount,
    purpose: purpose || title || 'General Donation',
    category: category || 'Donation',
    date: date ? new Date(date) : new Date(),
    description,
    paymentMode: paymentMode || 'cash',
    status: 'Issued',
    receiptNumber,
    qrCodeDataUrl,
    collectedBy: req.user._id,
    idempotencyKey: effectiveIdempotencyKey,
    syncStatus: 'Synced'
  });

  res.status(201).json(donation);
});

// @desc List donations / collections for the mandal
// @route GET /api/donations (or /api/collections)
const listDonations = asyncHandler(async (req, res) => {
  const { status, eventId, search } = req.query;
  const filter = { mandalId: req.mandalId };
  if (status) filter.status = status;
  if (eventId) filter.eventId = eventId;
  if (search) {
    filter.$or = [
      { donorName: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { purpose: { $regex: search, $options: 'i' } }
    ];
  }

  const donations = await Donation.find(filter)
    .populate('mandalId', 'name logoBase64 logoUrl receiptPrefix')
    .sort({ date: -1, createdAt: -1 })
    .limit(500);
  res.json(donations);
});

// @desc Get single donation
// @route GET /api/donations/:id
const getDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findOne({ _id: req.params.id, mandalId: req.mandalId })
    .populate('mandalId', 'name logoBase64 logoUrl receiptPrefix');
  if (!donation) {
    res.status(404);
    throw new Error('Receipt not found');
  }
  res.json(donation);
});

// @desc Update donation / collection
// @route PUT/PATCH /api/donations/:id
const updateDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!donation) {
    res.status(404);
    throw new Error('Receipt not found');
  }

  const { donorName, contributor, title, purpose, category, amount, date, description, donorMobile, paymentMode } = req.body;
  if (donorName !== undefined || contributor !== undefined) donation.donorName = donorName || contributor;
  if (title !== undefined) donation.title = title;
  if (purpose !== undefined) donation.purpose = purpose;
  if (category !== undefined) donation.category = category;
  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400);
      throw new Error('Amount must be a positive number');
    }
    donation.amount = numAmount;
  }
  if (date !== undefined) donation.date = new Date(date);
  if (description !== undefined) donation.description = description;
  if (donorMobile !== undefined) donation.donorMobile = donorMobile;
  if (paymentMode !== undefined) donation.paymentMode = paymentMode;

  await donation.save();
  res.json(donation);
});

// @desc Delete donation / collection
// @route DELETE /api/donations/:id
const deleteDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!donation) {
    res.status(404);
    throw new Error('Receipt not found');
  }

  await Donation.deleteOne({ _id: req.params.id, mandalId: req.mandalId });

  await AuditLog.create({
    mandalId: req.mandalId,
    action: 'donation.delete',
    entity: 'Donation',
    entityId: donation._id,
    performedBy: req.user._id
  });

  res.json({ message: 'Collection record deleted successfully', id: req.params.id });
});

// @desc Cancel or reverse a receipt — never hard-deleted, always logged
// @route PATCH /api/donations/:id/cancel
const cancelDonation = asyncHandler(async (req, res) => {
  const { reason, reversal } = req.body;
  if (!reason) {
    res.status(400);
    throw new Error('A reason is required to cancel or reverse a receipt');
  }
  const donation = await Donation.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!donation) {
    res.status(404);
    throw new Error('Receipt not found');
  }

  donation.status = reversal ? 'Reversed' : 'Cancelled';
  donation.cancelReason = reason;
  await donation.save();

  await AuditLog.create({
    mandalId: req.mandalId,
    action: reversal ? 'donation.reverse' : 'donation.cancel',
    entity: 'Donation',
    entityId: donation._id,
    performedBy: req.user._id,
    reason
  });

  res.json(donation);
});

module.exports = {
  createDonation,
  listDonations,
  getDonation,
  updateDonation,
  deleteDonation,
  cancelDonation
};
