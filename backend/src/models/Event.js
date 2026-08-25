const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['Ganesh Utsav', 'Navratri', 'Jayanti', 'Diwali', 'Wedding/Hall', 'Custom'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: { type: String, enum: ['Planned', 'Active', 'Closed'], default: 'Planned' },
    closureSummary: {
      totalCollections: Number,
      totalExpenses: Number,
      attendanceCount: Number,
      closedAt: Date
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
