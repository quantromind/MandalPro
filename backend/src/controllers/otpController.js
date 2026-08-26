const asyncHandler = require('express-async-handler');
const sendEmail = require('../utils/sendEmail');
const Otp = require('../models/Otp');
const User = require('../models/User');

// In-memory OTP fallback: { email: { code, expiresAt } }
const memoryOtpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// @desc  Send OTP to an email address
// @route POST /api/auth/send-otp
const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('email is required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // If purpose is registration, verify if account already exists
  if (purpose === 'register') {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409);
      throw new Error('This email is already registered. Please log in to your account.');
    }
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
    // Delete OTP once used
    await Otp.deleteMany({ email: normalizedEmail }).catch(() => {});
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

  memoryOtpStore.delete(normalizedEmail);
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
  otpStore: memoryOtpStore
};

