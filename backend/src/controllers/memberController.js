const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Mandal = require('../models/Mandal');
const ChatMessage = require('../models/ChatMessage');

// Default permissions preset by role
const getDefaultPermissions = (role) => {
  switch (role) {
    case 'president':
      return {
        canCollect: true,
        canManageExpenses: true,
        canAddMembers: true,
        canChat: true,
        canViewReports: true
      };
    case 'secretary':
      return {
        canCollect: true,
        canManageExpenses: true,
        canAddMembers: true,
        canChat: true,
        canViewReports: true
      };
    case 'treasurer':
      return {
        canCollect: true,
        canManageExpenses: true,
        canAddMembers: false,
        canChat: true,
        canViewReports: true
      };
    case 'volunteer':
    default:
      return {
        canCollect: true,
        canManageExpenses: false,
        canAddMembers: false,
        canChat: true,
        canViewReports: false
      };
  }
};

// @desc List all members under the mandal
// @route GET /api/members
const listMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ mandalId: req.mandalId })
    .select('-passwordHash')
    .sort({ createdAt: -1 });
  res.json(members);
});

// @desc Add a new member to the mandal (Unlimited members, with granular permissions)
// @route POST /api/members
const addMember = asyncHandler(async (req, res) => {
  const { name, email, mobile, role = 'volunteer', permissions } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error('Name and email are required to add a member');
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail === 'quantromind@gmail.com') {
    res.status(400);
    throw new Error('This email is reserved for system admin');
  }

  // Merge default permissions with any customized permissions passed
  const mergedPermissions = {
    ...getDefaultPermissions(role),
    ...(permissions || {})
  };

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // If user already exists in this mandal
    if (user.mandalId && user.mandalId.toString() === req.mandalId.toString()) {
      user.status = 'active';
      if (name) user.name = name.trim();
      if (mobile) user.mobile = mobile.trim();
      if (role) user.role = role;
      user.permissions = mergedPermissions;
      await user.save();

      // System chat announcement
      try {
        await ChatMessage.create({
          mandalId: req.mandalId,
          senderName: 'Mandal System',
          senderRole: 'system',
          text: `🎉 ${user.name} (${user.role}) details were updated by ${req.user?.name || 'Admin'}.`,
          isSystem: true
        });
      } catch (e) {
        console.error('Chat announcement error:', e);
      }

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
    user.permissions = mergedPermissions;
    if (name) user.name = name.trim();
    if (mobile) user.mobile = mobile.trim();
    await user.save();

    // System chat announcement
    try {
      await ChatMessage.create({
        mandalId: req.mandalId,
        senderName: 'Mandal System',
        senderRole: 'system',
        text: `🎉 ${user.name} (${user.role}) was added to the committee by ${req.user?.name || 'Admin'}. Welcome!`,
        isSystem: true
      });
    } catch (e) {
      console.error('Chat announcement error:', e);
    }

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
    permissions: mergedPermissions,
    mandalId: req.mandalId,
    mandalIds: [req.mandalId],
    status: 'active'
  });

  // Update mandal member count
  const memberCount = await User.countDocuments({ mandalId: req.mandalId });
  await Mandal.findByIdAndUpdate(req.mandalId, { memberCount });

  // Post system announcement to chat
  try {
    await ChatMessage.create({
      mandalId: req.mandalId,
      senderName: 'Mandal System',
      senderRole: 'system',
      text: `🎉 ${user.name} (${user.role}) was added to the committee by ${req.user?.name || 'Admin'}. Welcome!`,
      isSystem: true
    });
  } catch (e) {
    console.error('Chat announcement error:', e);
  }

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

  const memberName = member.name;
  const memberRole = member.role;

  // Detach or delete user
  if (member.mandalIds && member.mandalIds.length > 1) {
    member.mandalIds = member.mandalIds.filter(id => id.toString() !== req.mandalId.toString());
    member.mandalId = member.mandalIds[0] || null;
    await member.save();
  } else {
    await User.findByIdAndDelete(req.params.id);
  }

  const memberCount = await User.countDocuments({ mandalId: req.mandalId });
  await Mandal.findByIdAndUpdate(req.mandalId, { memberCount });

  // Post system chat announcement
  try {
    await ChatMessage.create({
      mandalId: req.mandalId,
      senderName: 'Mandal System',
      senderRole: 'system',
      text: `🚫 ${memberName} (${memberRole}) was removed from the committee by ${req.user?.name || 'Admin'}.`,
      isSystem: true
    });
  } catch (e) {
    console.error('Chat announcement error:', e);
  }

  res.json({ message: 'Member removed successfully' });
});

// @desc Update member role, permissions or status
// @route PATCH /api/members/:id
const updateMemberRole = asyncHandler(async (req, res) => {
  const { name, mobile, role, permissions, status } = req.body;
  const member = await User.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!member) {
    res.status(404);
    throw new Error('Member not found');
  }

  if (name) member.name = name.trim();
  if (mobile !== undefined) member.mobile = mobile ? mobile.trim() : '';
  if (role) {
    member.role = role;
    // If role changed and no custom permissions passed, apply new role defaults
    if (!permissions) {
      member.permissions = getDefaultPermissions(role);
    }
  }
  if (permissions) {
    member.permissions = {
      ...(member.permissions ? member.permissions.toObject?.() || member.permissions : getDefaultPermissions(member.role)),
      ...permissions
    };
  }
  if (status) member.status = status;

  await member.save();
  res.json(member);
});

// @desc Voluntary leave mandal committee (For non-president members)
// @route POST /api/members/leave
const leaveMandal = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'president') {
    res.status(400);
    throw new Error('The Mandal President cannot leave the Mandal directly. Transfer leadership or contact support.');
  }

  const mandalId = req.mandalId;
  const userName = user.name;
  const userRole = user.role;

  // Detach from current mandal
  user.mandalId = null;
  if (user.mandalIds && user.mandalIds.length > 0) {
    user.mandalIds = user.mandalIds.filter(id => id.toString() !== mandalId.toString());
    if (user.mandalIds.length > 0) {
      user.mandalId = user.mandalIds[0];
    }
  }
  user.status = 'disabled';
  await user.save();

  // Update member count
  const memberCount = await User.countDocuments({ mandalId });
  await Mandal.findByIdAndUpdate(mandalId, { memberCount });

  // Post system announcement to chat
  try {
    await ChatMessage.create({
      mandalId,
      senderId: req.user._id,
      senderName: 'Mandal System',
      senderRole: 'system',
      text: `👋 ${userName} (${userRole}) has left the committee group.`,
      isSystem: true
    });
  } catch (e) {
    console.error('Chat announcement error:', e);
  }

  res.json({ success: true, message: 'You have left the Mandal committee successfully.' });
});

module.exports = { listMembers, addMember, removeMember, updateMemberRole, leaveMandal, getDefaultPermissions };
