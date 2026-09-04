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

  // Hard delete for now, or you could do soft delete if preferred
  await Mandal.findByIdAndDelete(req.params.id);
  // Optional: delete associated users/events here, but keeping it simple for now
  
  res.json({ message: 'Mandal removed' });
});

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  getAllMandals,
  getMandalById,
  updateMandal,
  deleteMandal
};
