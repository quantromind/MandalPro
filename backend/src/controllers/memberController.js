const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Mandal = require('../models/Mandal');

// @desc List all members under the mandal
// @route GET /api/members
const listMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ mandalId: req.mandalId }).select('-passwordHash').sort({ createdAt: -1 });
  res.json(members);
});

// @desc Add a new member to the mandal (so they can log in via OTP for free)
// @route POST /api/members
const addMember = asyncHandler(async (req, res) => {
  const { name, email, mobile, role } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error('Name and email are required to add a member');
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail === 'quantromind@gmail.com') {
    res.status(400);
    throw new Error('This email is reserved for system admin');
  }

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // If user already exists in this mandal
    if (user.mandalId && user.mandalId.toString() === req.mandalId.toString()) {
      user.status = 'active';
      if (name) user.name = name.trim();
      if (mobile) user.mobile = mobile.trim();
      if (role) user.role = role;
      await user.save();
      return res.status(200).json(user);
    }
    
    // If user exists in another mandal as president
    if (user.role === 'president') {
      res.status(400);
      throw new Error('This user is already registered as a Mandal President with another Mandal');
    }

    // Attach to current mandal
    user.mandalId = req.mandalId;
    if (!user.mandalIds.includes(req.mandalId)) {
      user.mandalIds.push(req.mandalId);
    }
    user.role = role || 'volunteer';
    user.status = 'active';
    if (name) user.name = name.trim();
    if (mobile) user.mobile = mobile.trim();
    await user.save();
    return res.status(200).json(user);
  }

  // Create new member with temporary hashed password (they will log in via OTP)
  const passwordHash = await User.hashPassword(`Mandal@${Date.now()}`);
  user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    mobile: mobile ? mobile.trim() : '',
    passwordHash,
    role: role || 'volunteer',
    mandalId: req.mandalId,
    mandalIds: [req.mandalId],
    status: 'active'
  });

  // Update mandal member count if needed
  const memberCount = await User.countDocuments({ mandalId: req.mandalId });
  await Mandal.findByIdAndUpdate(req.mandalId, { memberCount });

  res.status(201).json(user);
});

// @desc Remove a member from the mandal
// @route DELETE /api/members/:id
const removeMember = asyncHandler(async (req, res) => {
  const member = await User.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }

  if (member.role === 'president') {
    res.status(400);
    throw new Error('Cannot remove the Mandal President');
  }

  await User.findByIdAndDelete(req.params.id);

  const memberCount = await User.countDocuments({ mandalId: req.mandalId });
  await Mandal.findByIdAndUpdate(req.mandalId, { memberCount });

  res.json({ message: 'Member removed successfully' });
});

// @desc Update member role or status
// @route PATCH /api/members/:id
const updateMemberRole = asyncHandler(async (req, res) => {
  const { role, status } = req.body;
  const member = await User.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }
  if (role) member.role = role;
  if (status) member.status = status;
  await member.save();
  res.json(member);
});

module.exports = { listMembers, addMember, removeMember, updateMemberRole };
