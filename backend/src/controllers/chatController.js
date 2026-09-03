const asyncHandler = require('express-async-handler');
const ChatMessage = require('../models/ChatMessage');

// @desc Get all chat messages for the mandal (old to new)
// @route GET /api/chat
const listMessages = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({ mandalId: req.mandalId })
    .populate('senderId', 'name role')
    .sort({ createdAt: 1 })
    .limit(1000)
    .lean();

  const formatted = messages.map(m => {
    const actualName = m.senderId?.name || (m.senderName && m.senderName !== 'Member' ? m.senderName : (m.senderName || 'Member'));
    const actualRole = m.senderId?.role || m.senderRole || 'volunteer';
    const actualId = m.senderId?._id ? m.senderId._id.toString() : (m.senderId ? m.senderId.toString() : null);

    return {
      ...m,
      senderId: actualId,
      senderName: actualName,
      senderRole: actualRole,
      sender: {
        _id: actualId,
        id: actualId,
        name: actualName,
        role: actualRole
      }
    };
  });

  res.json(formatted);
});

// @desc Send a new message to the mandal group chat
// @route POST /api/chat
const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Message text is required');
  }

  if (req.user?.permissions && req.user.permissions.canChat === false) {
    res.status(403);
    throw new Error('You do not have permission to send messages in the committee chat');
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
