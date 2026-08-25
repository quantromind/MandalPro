const asyncHandler = require('express-async-handler');
const ChatMessage = require('../models/ChatMessage');

// @desc Get all chat messages for the mandal (old to new)
// @route GET /api/chat
const listMessages = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({ mandalId: req.mandalId })
    .sort({ createdAt: 1 })
    .limit(1000);

  res.json(messages);
});

// @desc Send a new message to the mandal group chat
// @route POST /api/chat
const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Message text is required');
  }

  const message = await ChatMessage.create({
    mandalId: req.mandalId,
    senderId: req.user._id,
    senderName: req.user.name || 'Member',
    senderRole: req.user.role || 'volunteer',
    text: text.trim()
  });

  res.status(201).json(message);
});

module.exports = { listMessages, sendMessage };
