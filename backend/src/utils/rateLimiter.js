// In-memory sliding window and cooldown rate limiter for OTP operations
const otpSendStore = new Map(); // key -> [timestamp1, timestamp2, ...]
const failedAttemptsStore = new Map(); // key -> { count: number, lastAttempt: number }
const usedResetTokensStore = new Set(); // set of consumed resetToken IDs/signatures

const COOLDOWN_SECONDS = 60;
const COOLDOWN_MS = COOLDOWN_SECONDS * 1000;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_FAILED_ATTEMPTS = 5;

// Clean up old memory entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of otpSendStore.entries()) {
    const valid = timestamps.filter(t => now - t < WINDOW_MS);
    if (valid.length === 0) {
      otpSendStore.delete(key);
    } else {
      otpSendStore.set(key, valid);
    }
  }

  for (const [key, data] of failedAttemptsStore.entries()) {
    if (now - data.lastAttempt > WINDOW_MS) {
      failedAttemptsStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

/**
 * Checks if an OTP send request is allowed for a given identifier (email/IP).
 * Enforces a 60-second cooldown and max 5 requests per 15 minutes.
 */
const checkOtpSendRateLimit = (key) => {
  const normalizedKey = String(key || '').toLowerCase().trim();
  const now = Date.now();
  const timestamps = otpSendStore.get(normalizedKey) || [];

  // Filter timestamps within the 15-minute window
  const recentTimestamps = timestamps.filter(t => now - t < WINDOW_MS);

  if (recentTimestamps.length > 0) {
    const lastRequest = recentTimestamps[recentTimestamps.length - 1];
    const elapsedMs = now - lastRequest;

    // Check 60s cooldown
    if (elapsedMs < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - elapsedMs) / 1000);
      return {
        allowed: false,
        reason: 'COOLDOWN',
        waitSeconds,
        message: `Please wait ${waitSeconds} second${waitSeconds > 1 ? 's' : ''} before requesting another OTP.`
      };
    }

    // Check max requests in 15m window
    if (recentTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      const oldestInWindow = recentTimestamps[0];
      const resetWaitSeconds = Math.ceil((WINDOW_MS - (now - oldestInWindow)) / 1000);
      const waitMinutes = Math.ceil(resetWaitSeconds / 60);
      return {
        allowed: false,
        reason: 'LIMIT_EXCEEDED',
        waitSeconds: resetWaitSeconds,
        message: `Too many OTP requests. Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before trying again.`
      };
    }
  }

  return { allowed: true };
};

/**
 * Records an OTP send event for rate limiting tracking.
 */
const recordOtpSent = (key) => {
  const normalizedKey = String(key || '').toLowerCase().trim();
  const now = Date.now();
  const timestamps = otpSendStore.get(normalizedKey) || [];
  const recentTimestamps = timestamps.filter(t => now - t < WINDOW_MS);
  recentTimestamps.push(now);
  otpSendStore.set(normalizedKey, recentTimestamps);
};

/**
 * Records a failed verification attempt. Returns true if attempts exceeded.
 */
const recordFailedAttempt = (key) => {
  const normalizedKey = String(key || '').toLowerCase().trim();
  const data = failedAttemptsStore.get(normalizedKey) || { count: 0, lastAttempt: Date.now() };
  data.count += 1;
  data.lastAttempt = Date.now();
  failedAttemptsStore.set(normalizedKey, data);

  const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - data.count);
  const isLocked = data.count >= MAX_FAILED_ATTEMPTS;

  return {
    isLocked,
    attemptsLeft,
    count: data.count
  };
};

/**
 * Resets failed verification attempt count upon success.
 */
const clearAttempts = (key) => {
  const normalizedKey = String(key || '').toLowerCase().trim();
  failedAttemptsStore.delete(normalizedKey);
};

/**
 * Single-use token tracking to prevent replay attacks on reset tokens.
 */
const isResetTokenUsed = (tokenId) => {
  return usedResetTokensStore.has(tokenId);
};

const markResetTokenUsed = (tokenId) => {
  usedResetTokensStore.add(tokenId);
  // Auto-expire after 30 minutes
  setTimeout(() => {
    usedResetTokensStore.delete(tokenId);
  }, 30 * 60 * 1000);
};

module.exports = {
  checkOtpSendRateLimit,
  recordOtpSent,
  recordFailedAttempt,
  clearAttempts,
  isResetTokenUsed,
  markResetTokenUsed,
  COOLDOWN_SECONDS
};
