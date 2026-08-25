const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    title: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    status: { type: String, enum: ['Todo', 'InProgress', 'Done'], default: 'Todo' },
    attendance: [
      {
        volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        shift: String,
        present: Boolean,
        markedAt: Date
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
