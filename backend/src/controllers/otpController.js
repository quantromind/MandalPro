const asyncHandler = require('express-async-handler');
const sendEmail = require('../utils/sendEmail');
const Otp = require('../models/Otp');
const User = require('../models/User');

// Demo / Reviewer accounts with static OTP for Google Play Console testing & app reviews
const DEMO_EMAILS = [
  'demo@mandalpro.com',
  'demo@aplamandal.com',
  'reviewer@mandalpro.com',
  'reviewer@aplamandal.com',
  'test@aplamandal.com',
  'google-play@mandalpro.com'
];
const DEMO_OTP = '123456';

const isDemoAccount = (email) => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return DEMO_EMAILS.includes(lower) || lower.startsWith('demo@') || lower.startsWith('reviewer@');
};

// In-memory OTP fallback: { email: { code, expiresAt } }
const memoryOtpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// @desc  Send OTP to an email address
// @desc  Send OTP to an email address
// @route POST /api/auth/send-otp
const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      code: 'EMAIL_REQUIRED',
      message: 'email is required'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail
  });

  // If purpose is registration, verify if account already exists
  if (purpose === 'register') {
    if (user) {
      return res.status(409).json({
        success: false,
        code: 'USER_ALREADY_EXISTS',
        message: 'This email is already registered. Please log in to your account.'
      });
    }
  }

  // If purpose is login (or default/no purpose), verify account exists before sending OTP
  // Prevents OTP being sent to unregistered emails during login flow
  if (!purpose || purpose === 'login') {
    // Skip this check for superadmin and demo accounts
    if (normalizedEmail !== 'quantromind@gmail.com' && !isDemoAccount(normalizedEmail)) {
      if (!user) {
        return res.status(404).json({
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'No account found with this email. Please create an account first.'
        });
      }
    }
  }

  // Handle Demo / Reviewer account bypass
  if (isDemoAccount(normalizedEmail)) {
    try {
      await Otp.deleteMany({ email: normalizedEmail });
      await Otp.create({ email: normalizedEmail, code: DEMO_OTP });
    } catch (e) {}
    memoryOtpStore.set(normalizedEmail, { code: DEMO_OTP, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    console.log(`\n========================================\n[DEMO OTP] For: ${normalizedEmail} | Fixed Code: ${DEMO_OTP}\n========================================\n`);
    return res.json({ message: 'OTP sent successfully to email' });
  }

  const code = generateOTP();
  
  // Persist to MongoDB (upsert so latest code is valid)
  try {
    await Otp.deleteMany({ email: normalizedEmail });
    await Otp.create({ email: normalizedEmail, code });
  } catch (dbErr) {
    console.warn(`[OTP DB Warning] Could not persist to DB: ${dbErr.message}. Storing in memory.`);
    memoryOtpStore.set(normalizedEmail, { code, expiresAt: Date.now() + OTP_TTL_MS });
  }

  console.log(`\n========================================\n[OTP Generated] For: ${normalizedEmail} | Code: ${code}\n========================================\n`);

  // Dispatch email asynchronously so client response is instant
  sendEmail({
    to: normalizedEmail,
    subject: 'Your Apla Mandal Verification Code',
    text: `Your verification code is ${code}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #FF6B00;">Apla Mandal Verification</h2>
        <p style="font-size: 16px; color: #333;">Your verification code is:</p>
        <div style="background: #FFF3E0; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #FF6B00;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `
  }).catch((emailErr) => {
    console.error(`[OTP Error] Email send failed to ${normalizedEmail}: ${emailErr.message}`);
  });

  res.json({ message: 'OTP sent successfully to email' });
});

// Helper to validate and consume OTP (used in both verifyOtp and loginWithOtp)
const validateAndConsumeOtp = async (email, code) => {
  const normalizedEmail = email.toLowerCase().trim();
  const inputCode = String(code).trim();

  // Demo / Reviewer accounts always accept DEMO_OTP (123456)
  if (isDemoAccount(normalizedEmail) && inputCode === DEMO_OTP) {
    return true;
  }

  // Try DB first
  let otpRecord = null;
  try {
    otpRecord = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });
  } catch (err) {
    console.warn(`[OTP DB Warning] Error querying DB: ${err.message}`);
  }

  if (otpRecord) {
    if (otpRecord.code !== inputCode) {
      throw new Error('Invalid OTP');
    }
    // Delete OTP once used (unless it's a demo account)
    if (!isDemoAccount(normalizedEmail)) {
      await Otp.deleteMany({ email: normalizedEmail }).catch(() => {});
    }
    return true;
  }

  // Fallback to memory store if not in DB
  const memoryEntry = memoryOtpStore.get(normalizedEmail);
  if (!memoryEntry) {
    throw new Error('No OTP sent for this email or it has expired. Please request again.');
  }
  if (Date.now() > memoryEntry.expiresAt) {
    memoryOtpStore.delete(normalizedEmail);
    throw new Error('OTP has expired. Please request again.');
  }
  if (memoryEntry.code !== inputCode) {
    throw new Error('Invalid OTP');
  }

  if (!isDemoAccount(normalizedEmail)) {
    memoryOtpStore.delete(normalizedEmail);
  }
  return true;
};

// @desc  Check if email is already registered
// @route POST /api/auth/check-email
const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('email is required');
  }
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  // Always return 200 so frontend can read exists flag without catching 409
  return res.json({
    exists: Boolean(existingUser),
    message: existingUser
      ? 'This email is already registered. Please log in to your account.'
      : 'Email is available'
  });
});

// @desc  Verify OTP
// @route POST /api/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code, purpose } = req.body;
  if (!email || !code) {
    res.status(400);
    throw new Error('email and code are required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // If purpose is registration, double-check if account exists
  if (purpose === 'register') {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409);
      throw new Error('This email is already registered. Please log in to your account.');
    }
  }

  try {
    await validateAndConsumeOtp(normalizedEmail, code);
    return res.json({ verified: true });
  } catch (err) {
    res.status(400);
    throw new Error(err.message);
  }
});

// @desc  Diagnostic endpoint to test live email delivery with detailed error response
// @route ALL /api/auth/test-email
const testEmail = asyncHandler(async (req, res) => {
  const targetEmail = req.query.email || req.body?.email || process.env.SMTP_USER;
  if (!targetEmail) {
    return res.status(400).json({ success: false, message: 'Provide an email param: ?email=your_email@gmail.com' });
  }

  try {
    const result = await sendEmail({
      to: targetEmail,
      subject: 'MandalPro Live Email Test',
      text: 'This is a test email to verify live delivery from MandalPro on Render.',
      html: '<h3>MandalPro Live Email Test</h3><p>If you see this email, SMTP delivery from Render is working perfectly!</p>'
    });
    return res.json({ success: true, message: 'Test email sent successfully!', info: result });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
      command: err.command,
      stack: err.stack,
      smtpHost: process.env.SMTP_HOST || 'Not set',
      smtpUser: process.env.SMTP_USER || 'Not set',
      hasPass: Boolean(process.env.SMTP_PASS)
    });
  }
});

module.exports = {
  checkEmail,
  sendOtp,
  verifyOtp,
  testEmail,
  validateAndConsumeOtp,
  memoryOtpStore,
  otpStore: memoryOtpStore,
  isDemoAccount,
  DEMO_EMAILS,
  DEMO_OTP
};


