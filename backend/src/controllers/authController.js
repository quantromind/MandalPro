const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Mandal = require('../models/Mandal');
const { generateToken } = require('../utils/jwt');
const { otpStore } = require('./otpController');

// @desc Register: creates a Mandal + first President user together (onboarding step 1-2)
// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, mobile, mandalName, eventTypes } = req.body;

  if (!name || !email || !password || !mandalName) {
    res.status(400);
    throw new Error('name, email, password and mandalName are required');
  }

  const normalizedEmail = email.toLowerCase();
  
  if (normalizedEmail === 'quantromind@gmail.com') {
    res.status(400);
    throw new Error('This email is reserved for the system admin');
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Auto-generate receipt prefix from mandal name initials
  const initials = mandalName
    .split(' ')
    .map(w => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 4) || 'RCPT';

  const selectedTypes = eventTypes || [];

  const mandal = await Mandal.create({
    name: mandalName,
    eventTypes: selectedTypes,
    plan: 'Basic',
    planStatus: 'Active',
    receiptPrefix: initials,
    'checklist.eventTypesSelected': selectedTypes.length > 0,
    'checklist.planSelected': false
  });

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email: normalizedEmail,
    mobile: mobile || '',
    passwordHash,
    role: 'president',
    mandalId: mandal._id,
    mandalIds: [mandal._id]
  });

  mandal.createdBy = user._id;
  await mandal.save();

  const token = generateToken({ id: user._id, mandalId: mandal._id.toString(), role: user.role });

  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, mandalId: mandal._id },
    mandal
  });
});

// @desc Add a team member to an existing mandal (invite flow, simplified — no email dispatch here)
// @route POST /api/auth/invite
const inviteMember = asyncHandler(async (req, res) => {
  const { name, email, password, role, mobile } = req.body;
  if (!['treasurer', 'secretary', 'volunteer'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role for invite');
  }
  const normalizedEmail = email.toLowerCase();
  if (normalizedEmail === 'quantromind@gmail.com') {
    res.status(400);
    throw new Error('This email is reserved for the system admin');
  }
  const passwordHash = await User.hashPassword(password || 'Welcome123');
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    mobile,
    passwordHash,
    role,
    mandalId: req.mandalId,
    status: 'active'
  });
  res.status(201).json(user);
});

// @desc Login
// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').toLowerCase();

  // Superadmin static credentials check
  if (normalizedEmail === 'quantromind@gmail.com') {
    if (password !== 'Nakshatra@#12345') {
      res.status(401);
      throw new Error('Invalid email or password');
    }
    
    // Ensure the superadmin user exists in the database
    let adminUser = await User.findOne({ email: 'quantromind@gmail.com' });
    if (!adminUser) {
      const passwordHash = await User.hashPassword('Nakshatra@#12345');
      adminUser = await User.create({
        name: 'Super Admin',
        email: 'quantromind@gmail.com',
        passwordHash,
        role: 'superadmin',
        status: 'active'
      });
    }

    const token = generateToken({
      id: adminUser._id,
      mandalId: null,
      role: adminUser.role
    });

    return res.json({
      token,
      user: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: adminUser.role, mandalId: null }
    });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (user.status !== 'active') {
    res.status(403);
    throw new Error('This account is not active');
  }

  const token = generateToken({
    id: user._id,
    mandalId: user.mandalId ? user.mandalId.toString() : null,
    role: user.role
  });

  let mandal = null;
  if (user.mandalId) {
    mandal = await Mandal.findById(user.mandalId);
  }

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, mandalId: user.mandalId },
    mandal
  });
});


// @desc Get current logged-in user
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc Update user profile & mandal onboarding details
// @route PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, mobile, mandalName, logoBase64, eventTypes, address, upiId } = req.body;

  // Update user
  if (name) req.user.name = name.trim();
  if (mobile) req.user.mobile = mobile.trim();
  await req.user.save();

  // Update mandal if user is President and has mandal
  let mandal = null;
  if (req.user.mandalId) {
    mandal = await Mandal.findById(req.user.mandalId);
    if (mandal) {
      if (mandalName) {
        mandal.name = mandalName.trim();
        const initials = mandalName.trim()
          .split(' ')
          .map(w => w[0]?.toUpperCase() || '')
          .join('')
          .slice(0, 4) || 'MNDL';
        mandal.receiptPrefix = initials;
      }
      if (logoBase64 !== undefined) mandal.logoBase64 = logoBase64;
      if (eventTypes && Array.isArray(eventTypes)) mandal.eventTypes = eventTypes;
      if (address !== undefined) mandal.address = address;
      if (upiId !== undefined) mandal.upiId = upiId;
      mandal.checklist.profileComplete = true;
      await mandal.save();
    }
  }

  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
      role: req.user.role,
      mandalId: req.user.mandalId
    },
    mandal
  });
});

// @desc Login with email OTP (passwordless)
// @route POST /api/auth/login-otp
const loginWithOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400);
    throw new Error('email and code are required');
  }

  const normalizedEmail = email.toLowerCase();

  // Verify OTP
  const entry = otpStore.get(normalizedEmail);
  if (!entry) {
    res.status(400);
    throw new Error('No OTP sent for this email. Please request again.');
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    res.status(400);
    throw new Error('OTP has expired. Please request again.');
  }
  if (entry.code !== String(code)) {
    res.status(400);
    throw new Error('Invalid OTP. Please try again.');
  }
  otpStore.delete(normalizedEmail);

  // Handle superadmin
  if (normalizedEmail === 'quantromind@gmail.com') {
    let adminUser = await User.findOne({ email: normalizedEmail });
    if (!adminUser) {
      const passwordHash = await User.hashPassword('Nakshatra@#12345');
      adminUser = await User.create({
        name: 'Super Admin', email: normalizedEmail,
        passwordHash, role: 'superadmin', status: 'active'
      });
    }
    const token = generateToken({ id: adminUser._id, mandalId: null, role: adminUser.role });
    return res.json({
      token,
      user: { id: adminUser._id, name: adminUser.name, email: adminUser.email, role: adminUser.role, mandalId: null }
    });
  }

  // Regular user lookup
  let user = await User.findOne({ email: normalizedEmail });

  // If the email is not registered or added by a president, create as a new President user!
  if (!user) {
    const rawName = normalizedEmail.split('@')[0] || 'President';
    const defaultName = rawName
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'President';

    const defaultMandalName = `${defaultName}'s Mandal`;
    const initials = defaultName
      .split(' ')
      .map(w => w[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 4) || 'MNDL';

    const mandal = await Mandal.create({
      name: defaultMandalName,
      eventTypes: ['Ganesh Utsav'],
      plan: 'Basic',
      planStatus: 'Active',
      receiptPrefix: initials,
      'checklist.eventTypesSelected': true,
      'checklist.planSelected': false
    });

    const randomPassword = Math.random().toString(36).slice(-8) + 'Mandal@1';
    const passwordHash = await User.hashPassword(randomPassword);

    user = await User.create({
      name: defaultName,
      email: normalizedEmail,
      passwordHash,
      role: 'president',
      mandalId: mandal._id,
      mandalIds: [mandal._id],
      status: 'active'
    });

    mandal.createdBy = user._id;
    await mandal.save();

    const token = generateToken({
      id: user._id,
      mandalId: mandal._id.toString(),
      role: user.role
    });

    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, mandalId: mandal._id },
      mandal,
      isNewPresident: true
    });
  }

  if (user.status !== 'active') {
    res.status(403);
    throw new Error('This account is not active. Please contact support.');
  }

  const token = generateToken({
    id: user._id,
    mandalId: user.mandalId ? user.mandalId.toString() : null,
    role: user.role
  });

  let mandal = null;
  if (user.mandalId) {
    mandal = await Mandal.findById(user.mandalId);
  }

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, mandalId: user.mandalId },
    mandal,
    isNewPresident: false
  });
});

module.exports = { register, login, loginWithOtp, getMe, updateProfile, inviteMember };
