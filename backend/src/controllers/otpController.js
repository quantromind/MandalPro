const asyncHandler = require('express-async-handler');
const sendEmail = require('../utils/sendEmail');

// In-memory OTP store: { email: { code, expiresAt } }
const otpStore = new Map();

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

  const normalizedEmail = email.toLowerCase();
  const code = generateOTP();
  
  otpStore.set(normalizedEmail, { code, expiresAt: Date.now() + OTP_TTL_MS });
  console.log(`\n========================================\n[OTP Generated] For: ${normalizedEmail} | Code: ${code}\n========================================\n`);

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Your MandalPro Verification Code',
      text: `Your verification code is ${code}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Verify your email</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #FF6B00; letter-spacing: 2px;">${code}</h1>
          <p>It will expire in 10 minutes.</p>
        </div>
      `
    });
  } catch (emailErr) {
    console.warn(`[OTP Warning] Email could not be sent (${emailErr.message}). Use the console OTP above for testing.`);
  }

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

  const normalizedEmail = email.toLowerCase();
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
    throw new Error('Invalid OTP');
  }

  otpStore.delete(normalizedEmail);
  res.json({ verified: true });
});

module.exports = { sendOtp, verifyOtp, otpStore };
