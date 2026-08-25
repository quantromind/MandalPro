const mongoose = require('mongoose');

// Used for atomic, gapless receipt numbering per mandal per financial year
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. mandalId_FY2025-26
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);
