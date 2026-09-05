const asyncHandler = require('express-async-handler');
const Mandal = require('../models/Mandal');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/superadmin/users
// @access  Private/Superadmin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .populate('mandalId', 'name plan')
    .sort({ createdAt: -1 })
    .select('-passwordHash');

  res.json(users);
});

// @desc    Update user
// @route   PUT /api/superadmin/users/:id
// @access  Private/Superadmin
const updateUser = asyncHandler(async (req, res) => {
  const { name, mobile, role, status, mandalId, password } = req.body;

  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent modifying role/status of primary superadmin account
  if (targetUser.email === 'quantromind@gmail.com') {
    if (role && role !== 'superadmin') {
      res.status(400);
      throw new Error('Cannot change role of primary superadmin');
    }
    if (status && status !== 'active') {
      res.status(400);
      throw new Error('Cannot deactivate primary superadmin');
    }
  }

  if (name !== undefined) targetUser.name = name.trim();
  if (mobile !== undefined) targetUser.mobile = mobile.trim();
  if (role !== undefined) targetUser.role = role;
  if (status !== undefined) targetUser.status = status;

  if (mandalId !== undefined) {
    if (!mandalId || mandalId === 'none' || mandalId === '') {
      targetUser.mandalId = null;
    } else {
      targetUser.mandalId = mandalId;
      if (!targetUser.mandalIds) targetUser.mandalIds = [];
      if (!targetUser.mandalIds.includes(mandalId)) {
        targetUser.mandalIds.push(mandalId);
      }
    }
  }

  if (password && password.trim().length >= 6) {
    targetUser.passwordHash = await User.hashPassword(password.trim());
  }

  await targetUser.save();

  const populated = await User.findById(targetUser._id)
    .populate('mandalId', 'name plan')
    .select('-passwordHash');

  res.json(populated);
});

// @desc    Delete user
// @route   DELETE /api/superadmin/users/:id
// @access  Private/Superadmin
const deleteUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    res.status(404);
    throw new Error('User not found');
  }

  if (targetUser.email === 'quantromind@gmail.com' || targetUser.role === 'superadmin') {
    res.status(400);
    throw new Error('Superadmin account cannot be deleted');
  }

  if (req.user && req.user._id.toString() === targetUser._id.toString()) {
    res.status(400);
    throw new Error('Cannot delete your own account');
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted successfully' });
});

// @desc    Get all mandals
// @route   GET /api/superadmin/mandals
// @access  Private/Superadmin
const getAllMandals = asyncHandler(async (req, res) => {
  const mandals = await Mandal.find({})
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  // Add member counts
  const mandalsWithCounts = await Promise.all(mandals.map(async (mandal) => {
    const memberCount = await User.countDocuments({ mandalId: mandal._id });
    return { ...mandal.toObject(), memberCount };
  }));

  res.json(mandalsWithCounts);
});

// @desc    Get mandal by ID
// @route   GET /api/superadmin/mandals/:id
// @access  Private/Superadmin
const getMandalById = asyncHandler(async (req, res) => {
  const mandal = await Mandal.findById(req.params.id).populate('createdBy', 'name email mobile');
  
  if (!mandal) {
    res.status(404);
    throw new Error('Mandal not found');
  }

  const memberCount = await User.countDocuments({ mandalId: mandal._id });

  res.json({ ...mandal.toObject(), memberCount });
});

// @desc    Update mandal (Superadmin)
// @route   PUT /api/superadmin/mandals/:id
// @access  Private/Superadmin
const updateMandal = asyncHandler(async (req, res) => {
  const { name, address, contactPhone, contactEmail, plan, planStatus, verified } = req.body;

  const mandal = await Mandal.findById(req.params.id);

  if (!mandal) {
    res.status(404);
    throw new Error('Mandal not found');
  }

  mandal.name = name || mandal.name;
  mandal.address = address !== undefined ? address : mandal.address;
  mandal.contactPhone = contactPhone !== undefined ? contactPhone : mandal.contactPhone;
  mandal.contactEmail = contactEmail !== undefined ? contactEmail : mandal.contactEmail;
  mandal.plan = plan || mandal.plan;
  mandal.planStatus = planStatus || mandal.planStatus;
  
  if (verified !== undefined) {
    mandal.verified = verified;
  }

  const updatedMandal = await mandal.save();
  res.json(updatedMandal);
});

// @desc    Delete mandal
// @route   DELETE /api/superadmin/mandals/:id
// @access  Private/Superadmin
const deleteMandal = asyncHandler(async (req, res) => {
  const mandal = await Mandal.findById(req.params.id);

  if (!mandal) {
    res.status(404);
    throw new Error('Mandal not found');
  }

  await Mandal.findByIdAndDelete(req.params.id);
  res.json({ message: 'Mandal removed' });
});

const Plan = require('../models/Plan');
const { seedDefaultPlansIfEmpty } = require('./planController');

// ══════════════════════════════════════════════════════════
// PLAN MANAGEMENT (Superadmin)
// ══════════════════════════════════════════════════════════

// @desc    Get all plans (active & inactive)
// @route   GET /api/superadmin/plans
// @access  Private/Superadmin
const getAllPlans = asyncHandler(async (req, res) => {
  await seedDefaultPlansIfEmpty();
  const plans = await Plan.find({}).sort({ sortOrder: 1, tier: 1, price: 1 });
  res.json(plans);
});

// @desc    Create new plan
// @route   POST /api/superadmin/plans
// @access  Private/Superadmin
const createPlan = asyncHandler(async (req, res) => {
  const {
    name,
    nameMr,
    code,
    price,
    period,
    periodMr,
    tier,
    memberLimit,
    memberLimitEn,
    memberLimitMr,
    tagline,
    taglineMr,
    badge,
    badgeMr,
    color,
    popular,
    features,
    featuresMr,
    isActive,
    sortOrder
  } = req.body;

  if (!name || !code || price === undefined) {
    res.status(400);
    throw new Error('Name, code, and price are required');
  }

  const existing = await Plan.findOne({
    $or: [{ code: code.trim() }, { code: new RegExp(`^${code.trim()}$`, 'i') }]
  });
  if (existing) {
    res.status(400);
    throw new Error(`A plan with code "${code}" already exists`);
  }

  const newPlan = await Plan.create({
    name: name.trim(),
    nameMr: (nameMr || '').trim(),
    code: code.trim(),
    price: Number(price),
    period: period || '/month',
    periodMr: periodMr || '/महिना',
    tier: tier ? Number(tier) : 1,
    memberLimit: memberLimit ? Number(memberLimit) : 15,
    memberLimitEn: memberLimitEn || `Up to ${memberLimit || 15} Committee Members`,
    memberLimitMr: memberLimitMr || `${memberLimit || 15} समिती सदस्य व स्वयंसेवक`,
    tagline: tagline || '',
    taglineMr: taglineMr || '',
    badge: badge || '',
    badgeMr: badgeMr || '',
    color: color || '#0284C7',
    popular: Boolean(popular),
    features: Array.isArray(features) ? features : [],
    featuresMr: Array.isArray(featuresMr) ? featuresMr : [],
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    sortOrder: sortOrder ? Number(sortOrder) : 0
  });

  res.status(201).json(newPlan);
});

// @desc    Update plan
// @route   PUT /api/superadmin/plans/:id
// @access  Private/Superadmin
const updatePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }

  const {
    name,
    nameMr,
    price,
    period,
    periodMr,
    tier,
    memberLimit,
    memberLimitEn,
    memberLimitMr,
    tagline,
    taglineMr,
    badge,
    badgeMr,
    color,
    popular,
    features,
    featuresMr,
    isActive,
    sortOrder
  } = req.body;

  if (name !== undefined) plan.name = name.trim();
  if (nameMr !== undefined) plan.nameMr = nameMr.trim();
  if (price !== undefined) plan.price = Number(price);
  if (period !== undefined) plan.period = period;
  if (periodMr !== undefined) plan.periodMr = periodMr;
  if (tier !== undefined) plan.tier = Number(tier);
  if (memberLimit !== undefined) plan.memberLimit = Number(memberLimit);
  if (memberLimitEn !== undefined) plan.memberLimitEn = memberLimitEn;
  if (memberLimitMr !== undefined) plan.memberLimitMr = memberLimitMr;
  if (tagline !== undefined) plan.tagline = tagline;
  if (taglineMr !== undefined) plan.taglineMr = taglineMr;
  if (badge !== undefined) plan.badge = badge;
  if (badgeMr !== undefined) plan.badgeMr = badgeMr;
  if (color !== undefined) plan.color = color;
  if (popular !== undefined) plan.popular = Boolean(popular);
  if (features !== undefined) plan.features = Array.isArray(features) ? features : [];
  if (featuresMr !== undefined) plan.featuresMr = Array.isArray(featuresMr) ? featuresMr : [];
  if (isActive !== undefined) plan.isActive = Boolean(isActive);
  if (sortOrder !== undefined) plan.sortOrder = Number(sortOrder);

  const updated = await plan.save();
  res.json(updated);
});

// @desc    Toggle plan active/inactive status
// @route   PATCH /api/superadmin/plans/:id/status
// @access  Private/Superadmin
const togglePlanStatus = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }

  const { isActive } = req.body;
  plan.isActive = isActive !== undefined ? Boolean(isActive) : !plan.isActive;

  const updated = await plan.save();
  console.log(`[SuperAdmin] Plan "${plan.name}" (${plan.code}) status changed to: ${plan.isActive ? 'ACTIVE' : 'DEACTIVATED'}`);
  res.json(updated);
});

// @desc    Delete plan
// @route   DELETE /api/superadmin/plans/:id
// @access  Private/Superadmin
const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    res.status(404);
    throw new Error('Plan not found');
  }

  // Check if any mandal is currently on this plan
  const activeMandalsOnPlan = await Mandal.countDocuments({
    plan: plan.code,
    planStatus: 'Active'
  });

  if (activeMandalsOnPlan > 0) {
    // If active mandals exist, deactivate it instead of deleting to maintain integrity
    plan.isActive = false;
    await plan.save();
    return res.json({
      success: true,
      message: `Plan has ${activeMandalsOnPlan} active mandal(s). It has been deactivated instead of deleted.`
    });
  }

  await Plan.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Plan deleted successfully' });
});

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  getAllMandals,
  getMandalById,
  updateMandal,
  deleteMandal,
  getAllPlans,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan
};
