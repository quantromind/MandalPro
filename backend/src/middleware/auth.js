const asyncHandler = require('express-async-handler');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Verifies JWT, attaches req.user and req.mandalId (tenant scope)
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, invalid token');
  }

  const user = await User.findById(decoded.id).select('-passwordHash');
  if (!user || user.status !== 'active') {
    res.status(401);
    throw new Error('Not authorized, user inactive or not found');
  }

  req.user = user;
  req.mandalId = user.mandalId ? user.mandalId.toString() : null; // tenant guard
  next();
});

// Verifies user is superadmin
const protectSuperadmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as superadmin');
  }
});

module.exports = { protect, protectSuperadmin };
