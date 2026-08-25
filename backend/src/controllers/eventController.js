const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Task = require('../models/Task');
const Donation = require('../models/Donation');
const Expense = require('../models/Expense');

// @desc Create an event (auto-scoped to mandal)
// @route POST /api/events
const createEvent = asyncHandler(async (req, res) => {
  const { name, type, startDate, endDate } = req.body;
  if (!name || !type || !startDate) { res.status(400); throw new Error('name, type and startDate are required'); }
  const event = await Event.create({
    mandalId: req.mandalId, name, type, startDate, endDate, createdBy: req.user._id
  });
  res.status(201).json(event);
});

const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ mandalId: req.mandalId }).sort({ startDate: -1 });
  res.json(events);
});

const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!event) { res.status(404); throw new Error('Event not found'); }
  const tasks = await Task.find({ eventId: event._id });
  res.json({ event, tasks });
});

// @desc Add a task under an event
// @route POST /api/events/:id/tasks
const addTask = asyncHandler(async (req, res) => {
  const { title, assignedTo, dueDate } = req.body;
  const event = await Event.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!event) { res.status(404); throw new Error('Event not found'); }
  const task = await Task.create({
    mandalId: req.mandalId, eventId: event._id, title, assignedTo, dueDate
  });
  res.status(201).json(task);
});

// @desc Update a task's status or mark attendance
// @route PATCH /api/events/tasks/:taskId
const updateTask = asyncHandler(async (req, res) => {
  const { status, attendanceEntry } = req.body;
  const task = await Task.findOne({ _id: req.params.taskId, mandalId: req.mandalId });
  if (!task) { res.status(404); throw new Error('Task not found'); }
  if (status) task.status = status;
  if (attendanceEntry) task.attendance.push({ ...attendanceEntry, markedAt: new Date() });
  await task.save();
  res.json(task);
});

// @desc Close an event and generate a summary report
// @route PATCH /api/events/:id/close
const closeEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!event) { res.status(404); throw new Error('Event not found'); }

  const collectionsAgg = await Donation.aggregate([
    { $match: { mandalId: event.mandalId, eventId: event._id, status: 'Issued' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const expensesAgg = await Expense.aggregate([
    { $match: { mandalId: event.mandalId, eventId: event._id, status: { $in: ['Approved', 'Paid', 'Reconciled'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const tasks = await Task.find({ eventId: event._id });
  const attendanceCount = tasks.reduce((sum, t) => sum + t.attendance.filter((a) => a.present).length, 0);

  event.status = 'Closed';
  event.closureSummary = {
    totalCollections: collectionsAgg[0]?.total || 0,
    totalExpenses: expensesAgg[0]?.total || 0,
    attendanceCount,
    closedAt: new Date()
  };
  await event.save();

  res.json(event);
});

module.exports = { createEvent, listEvents, getEvent, addTask, updateTask, closeEvent };
