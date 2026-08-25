const asyncHandler = require('express-async-handler');
const sendEmail = require('../utils/sendEmail');
const Otp = require('../models/Otp');

// In-memory OTP fallback: { email: { code, expiresAt } }
const memoryOtpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// @desc  Send OTP to an email address
// @route POST /api/auth/send-otp
const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('email is required');
  }

  const normalizedEmail = email.toLowerCase().trim();
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
    subject: 'Your MandalPro Verification Code',
    text: `Your verification code is ${code}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #FF6B00;">MandalPro Verification</h2>
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

// @desc  Verify OTP
// @route POST /api/auth/verify-otp
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400);
    throw new Error('email and code are required');
  }

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
      res.status(400);
      throw new Error('Invalid OTP');
    }
    // Delete OTP once used
    await Otp.deleteMany({ email: normalizedEmail }).catch(() => {});
    return res.json({ verified: true });
  }

  // Fallback to memory store if not in DB
  const memoryEntry = memoryOtpStore.get(normalizedEmail);
  if (!memoryEntry) {
    res.status(400);
    throw new Error('No OTP sent for this email. Please request again.');
  }
  if (Date.now() > memoryEntry.expiresAt) {
    memoryOtpStore.delete(normalizedEmail);
    res.status(400);
    throw new Error('OTP has expired. Please request again.');
  }
  if (memoryEntry.code !== inputCode) {
    res.status(400);
    throw new Error('Invalid OTP');
  }

  memoryOtpStore.delete(normalizedEmail);
  res.json({ verified: true });
});

module.exports = { sendOtp, verifyOtp };

