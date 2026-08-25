const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');
const Donation = require('../models/Donation');
const Mandal = require('../models/Mandal');
const AuditLog = require('../models/AuditLog');

// @desc Create a donation + generate trusted receipt number (handles offline idempotency)
// @route POST /api/donations
const createDonation = asyncHandler(async (req, res) => {
  const { donorName, donorMobile, amount, purpose, paymentMode, eventId, idempotencyKey } = req.body;

  if (!donorName || !amount) {
    res.status(400);
    throw new Error('donorName and amount are required');
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
  const receiptNumber = await getNextReceiptNumber(req.mandalId, mandal.receiptPrefix, mandal.financialYearStartMonth);

  const qrPayload = `${receiptNumber}|${amount}|${req.mandalId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

  const donation = await Donation.create({
    mandalId: req.mandalId,
    eventId: eventId || undefined,
    donorName,
    donorMobile,
    amount,
    purpose,
    paymentMode: paymentMode || 'cash',
    status: 'Issued',
    receiptNumber,
    qrCodeDataUrl,
    collectedBy: req.user._id,
    idempotencyKey,
    syncStatus: 'Synced'
  });

  res.status(201).json(donation);
});

// @desc List donations for the mandal, filterable by status/event
// @route GET /api/donations
const listDonations = asyncHandler(async (req, res) => {
  const { status, eventId, search } = req.query;
  const filter = { mandalId: req.mandalId };
  if (status) filter.status = status;
  if (eventId) filter.eventId = eventId;
  if (search) filter.donorName = { $regex: search, $options: 'i' };

  const donations = await Donation.find(filter).populate('mandalId', 'name logoBase64 logoUrl receiptPrefix').sort({ createdAt: -1 }).limit(500);
  res.json(donations);
});

const getDonation = asyncHandler(async (req, res) => {
  const donation = await Donation.findOne({ _id: req.params.id, mandalId: req.mandalId }).populate('mandalId', 'name logoBase64 logoUrl receiptPrefix');
  if (!donation) {
    res.status(404);
    throw new Error('Receipt not found');
  }
  res.json(donation);
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

module.exports = { createDonation, listDonations, getDonation, cancelDonation };
