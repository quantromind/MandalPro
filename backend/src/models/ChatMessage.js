const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    mandalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mandal',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    senderName: {
      type: String,
      required: true
    },
    senderRole: {
      type: String,
      default: 'volunteer'
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

chatMessageSchema.index({ mandalId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
