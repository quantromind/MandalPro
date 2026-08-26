const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Mandal = require('../models/Mandal');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');
const Event = require('../models/Event');
const ChatMessage = require('../models/ChatMessage');
const Task = require('../models/Task');
const InventoryItem = require('../models/InventoryItem');
const Budget = require('../models/Budget');
const Sponsor = require('../models/Sponsor');
const AuditLog = require('../models/AuditLog');
const Counter = require('../models/Counter');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');
const { generateToken } = require('../utils/jwt');
const { validateAndConsumeOtp, memoryOtpStore } = require('./otpController');

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
    res.status(409);
    throw new Error('An account with this email is already registered. Please log in.');
  }

  // Auto-generate receipt prefix from mandal name initials
  const initials = mandalName
    .split(' ')
    .map(w => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 4) || 'RCPT';

  const selectedTypes = eventTypes || [];
  if (Array.isArray(selectedTypes) && selectedTypes.length > 3) {
    res.status(400);
    throw new Error('You can select a maximum of 3 event types for your Mandal plan.');
  }

  const mandal = await Mandal.create({
    name: mandalName,
    eventTypes: selectedTypes,
    plan: 'Basic',
    planStatus: 'Active',
    receiptPrefix: initials,
    onboardingComplete: false,
    'checklist.profileComplete': true,
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
    if (mandal && (!mandal.name.includes("'s Mandal") || user.mobile || mandal.checklist?.profileComplete)) {
      mandal.onboardingComplete = true;
      mandal.checklist.profileComplete = true;
      mandal.checklist.planSelected = true;
      await mandal.save();
    }
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
  let mandal = null;
  if (req.user.mandalId) {
    mandal = await Mandal.findById(req.user.mandalId);
  }
  res.json({
    ...req.user.toObject(),
    mandal
  });
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
      if (eventTypes && Array.isArray(eventTypes)) {
        if (eventTypes.length > 3) {
          res.status(400);
          throw new Error('You can select a maximum of 3 event types for your Mandal plan.');
        }
        mandal.eventTypes = eventTypes;
      }
      if (address !== undefined) mandal.address = address;
      if (upiId !== undefined) mandal.upiId = upiId;
      if (logoBase64 !== undefined) mandal.logoBase64 = logoBase64;
      mandal.onboardingComplete = true;
      mandal.checklist.profileComplete = true;
      mandal.checklist.eventTypesSelected = true;
      mandal.checklist.planSelected = true;
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

  const normalizedEmail = email.toLowerCase().trim();

  // Verify OTP
  try {
    await validateAndConsumeOtp(normalizedEmail, code);
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }

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
    if (mandal && (!mandal.name.includes("'s Mandal") || user.mobile || mandal.checklist?.profileComplete)) {
      mandal.onboardingComplete = true;
      mandal.checklist.profileComplete = true;
      mandal.checklist.planSelected = true;
      await mandal.save();
    }
  }

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, mandalId: user.mandalId },
    mandal,
    isNewPresident: false
  });
});

// @desc    Send OTP to authenticated user's email for permanent account deletion
// @route   POST /api/auth/delete-account/send-otp
// @access  Private (protect)
const sendDeleteAccountOtp = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const normalizedEmail = user.email.toLowerCase().trim();

  // Prevent superadmin deletion
  if (user.role === 'superadmin' || normalizedEmail === 'quantromind@gmail.com') {
    res.status(400);
    throw new Error('Superadmin account cannot be deleted');
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

  // Persist to MongoDB (or memory fallback)
  try {
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, code });
  } catch (dbErr) {
    console.warn(`[OTP DB Warning] Could not persist deletion OTP to DB: ${dbErr.message}`);
    memoryOtpStore.set(normalizedEmail, { code, expiresAt: Date.now() + OTP_TTL_MS });
  }

  console.log(`\n========================================\n[Account Deletion OTP] For: ${normalizedEmail} | Code: ${code}\n========================================\n`);

  // Dispatch warning email
  sendEmail({
    to: normalizedEmail,
    subject: '⚠️ Apla Mandal - Account Deletion Verification Code',
    text: `Your verification code to permanently delete your Apla Mandal account is ${code}. It will expire in 10 minutes. If you did not request this, please secure your account immediately.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #fee2e2; border-radius: 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">⚠️ Confirm Account Deletion</h2>
        <p style="font-size: 15px; color: #333;">You have requested to permanently delete your Apla Mandal account (<strong>${normalizedEmail}</strong>).</p>
        <p style="font-size: 14px; color: #666;">Use the verification code below to confirm deletion:</p>
        <div style="background: #fef2f2; border: 1px dashed #ef4444; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #dc2626;">${code}</span>
        </div>
        <p style="font-size: 13px; color: #991b1b; font-weight: bold;">Warning: This action is permanent and cannot be undone. All your data, receipts, and records will be deleted from the database.</p>
        <p style="font-size: 12px; color: #888;">If you did not make this request, please change your password immediately.</p>
      </div>
    `
  }).catch((emailErr) => {
    console.error(`[Delete Account OTP Error] Email send failed to ${normalizedEmail}: ${emailErr.message}`);
  });

  res.json({ message: 'Account deletion verification code sent to your email.' });
});

// @desc    Permanently delete account from database after OTP verification
// @route   POST /api/auth/delete-account or DELETE /api/auth/delete-account
// @access  Private (protect)
const deleteAccountWithOtp = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error('Verification code is required');
  }

  const normalizedEmail = user.email.toLowerCase().trim();

  // Prevent superadmin deletion
  if (user.role === 'superadmin' || normalizedEmail === 'quantromind@gmail.com') {
    res.status(400);
    throw new Error('Superadmin account cannot be deleted');
  }

  // Validate and consume OTP
  try {
    await validateAndConsumeOtp(normalizedEmail, code);
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }

  const userId = user._id;
  const mandalId = user.mandalId;

  // If user is a president and has a mandal: purge mandal and all child records
  if (user.role === 'president' && mandalId) {
    await Promise.all([
      Donation.deleteMany({ mandalId }).catch(() => {}),
      Expense.deleteMany({ mandalId }).catch(() => {}),
      Event.deleteMany({ mandalId }).catch(() => {}),
      ChatMessage.deleteMany({ mandalId }).catch(() => {}),
      Task.deleteMany({ mandalId }).catch(() => {}),
      InventoryItem.deleteMany({ mandalId }).catch(() => {}),
      Budget.deleteMany({ mandalId }).catch(() => {}),
      Sponsor.deleteMany({ mandalId }).catch(() => {}),
      AuditLog.deleteMany({ mandalId }).catch(() => {}),
      Counter.deleteMany({ key: new RegExp(`^${mandalId}`) }).catch(() => {}),
      User.deleteMany({ mandalId }).catch(() => {}),
      Mandal.findByIdAndDelete(mandalId).catch(() => {})
    ]);
  }

  // In all cases, ensure the user document itself is deleted
  await User.findByIdAndDelete(userId).catch(() => {});

  res.json({
    success: true,
    message: 'Your account and all associated data have been permanently deleted from the database.'
  });
});

module.exports = {
  register,
  login,
  loginWithOtp,
  getMe,
  updateProfile,
  inviteMember,
  sendDeleteAccountOtp,
  deleteAccountWithOtp
};
