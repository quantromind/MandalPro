const asyncHandler = require('express-async-handler');
const Mandal = require('../models/Mandal');
const Budget = require('../models/Budget');

// Default budget category templates per event type
const EVENT_BUDGET_TEMPLATES = {
  'Ganesh Utsav': ['Decoration', 'Prasad', 'Music & DJ', 'Lighting', 'Idol', 'Printing', 'Miscellaneous'],
  'Navratri':     ['Decoration', 'Garba Music', 'Food & Prasad', 'Lighting', 'Stage Setup', 'Miscellaneous'],
  'Jayanti':      ['Decoration', 'Printing', 'Sound System', 'Food', 'Miscellaneous'],
  'Diwali':       ['Fireworks', 'Decoration', 'Sweets', 'Lighting', 'Miscellaneous'],
  'Wedding/Hall': ['Catering', 'Decoration', 'Photography', 'DJ/Music', 'Venue', 'Invitations', 'Miscellaneous'],
  'Custom':       ['Category 1', 'Category 2', 'Miscellaneous']
};

// @desc  Auto-provision mandal after registration
//        Creates default budget categories for selected event types
// @route POST /api/onboarding/provision
const provision = asyncHandler(async (req, res) => {
  const mandalId = req.mandalId;
  const mandal = await Mandal.findById(mandalId);
  if (!mandal) {
    res.status(404);
    throw new Error('Mandal not found');
  }

  // Collect unique categories from all selected event types
  const categories = new Set();
  for (const type of mandal.eventTypes) {
    const tmpl = EVENT_BUDGET_TEMPLATES[type] || EVENT_BUDGET_TEMPLATES['Custom'];
    tmpl.forEach(c => categories.add(c));
  }

  // Set receipt prefix from mandal name initials
  const initials = mandal.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 4);
  mandal.receiptPrefix = initials || 'RCPT';
  mandal.checklist.eventTypesSelected = mandal.eventTypes.length > 0;
  await mandal.save();

  res.json({
    message: 'Mandal provisioned',
    receiptPrefix: mandal.receiptPrefix,
    defaultCategories: [...categories]
  });
});

// @desc  Update mandal profile (Step 2 of onboarding)
// @route PATCH /api/onboarding/profile
const updateProfile = asyncHandler(async (req, res) => {
  const mandalId = req.mandalId;
  const { logoBase64, address, contactPhone, contactEmail, upiId, bankDetails } = req.body;

  const mandal = await Mandal.findByIdAndUpdate(
    mandalId,
    {
      ...(logoBase64 !== undefined && { logoBase64 }),
      ...(address !== undefined && { address }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(contactEmail !== undefined && { contactEmail }),
      ...(upiId !== undefined && { upiId }),
      ...(bankDetails !== undefined && { bankDetails }),
      'checklist.profileComplete': true
    },
    { new: true }
  );

  res.json(mandal);
});

// @desc  Mark a checklist item as complete
// @route PATCH /api/onboarding/checklist/:item
const updateChecklist = asyncHandler(async (req, res) => {
  const { item } = req.params;
  const mandalId = req.mandalId;

  const VALID_ITEMS = ['inviteTeam', 'setReceiptNumber', 'firstDonation', 'firstEvent', 'profileComplete', 'planSelected'];
  if (!VALID_ITEMS.includes(item)) {
    res.status(400);
    throw new Error(`Invalid checklist item: ${item}`);
  }

  const mandal = await Mandal.findByIdAndUpdate(
    mandalId,
    { [`checklist.${item}`]: true },
    { new: true }
  );

  // Check if all checklist items are done → mark onboarding complete
  const c = mandal.checklist;
  if (c.profileComplete && c.eventTypesSelected && c.planSelected && c.inviteTeam && c.firstDonation && c.firstEvent) {
    mandal.onboardingComplete = true;
    await mandal.save();
  }

  res.json({ checklist: mandal.checklist, onboardingComplete: mandal.onboardingComplete });
});

// @desc  Upgrade plan (simulated Razorpay confirmation)
// @route PATCH /api/onboarding/plan
const upgradePlan = asyncHandler(async (req, res) => {
  const { plan, razorpayPaymentId } = req.body;
  const VALID_PLANS = ['Basic', 'Pro', 'Premium', 'Enterprise'];

  if (!VALID_PLANS.includes(plan)) {
    res.status(400);
    throw new Error(`Invalid plan: ${plan}`);
  }

  const renewsAt = new Date();
  renewsAt.setFullYear(renewsAt.getFullYear() + 1);

  const mandal = await Mandal.findByIdAndUpdate(
    req.mandalId,
    {
      plan,
      planStatus: 'Active',
      planRenewsAt: renewsAt,
      onboardingComplete: true,
      'checklist.planSelected': true,
      // Store payment ref if provided
      ...(razorpayPaymentId && { lastPaymentId: razorpayPaymentId })
    },
    { new: true }
  );

  res.json({ plan: mandal.plan, planStatus: mandal.planStatus, planRenewsAt: mandal.planRenewsAt });
});

// @desc  Upload verification documents (Pro+)
// @route POST /api/onboarding/verification-docs
const uploadVerificationDocs = asyncHandler(async (req, res) => {
  const { docs } = req.body; // Array of base64 strings
  if (!Array.isArray(docs) || docs.length === 0) {
    res.status(400);
    throw new Error('docs array is required');
  }

  const mandal = await Mandal.findByIdAndUpdate(
    req.mandalId,
    { $push: { verificationDocs: { $each: docs } } },
    { new: true }
  );

  res.json({ message: 'Documents uploaded. Verification pending.', docCount: mandal.verificationDocs.length });
});

module.exports = { provision, updateProfile, updateChecklist, upgradePlan, uploadVerificationDocs };
