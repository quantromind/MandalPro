const asyncHandler = require('express-async-handler');
const QRCode = require('qrcode');
const InventoryItem = require('../models/InventoryItem');

const createItem = asyncHandler(async (req, res) => {
  const { name, type, quantity, lowStockThreshold } = req.body;
  const qrCode = await QRCode.toDataURL(`${req.mandalId}|${name}|${Date.now()}`);
  const item = await InventoryItem.create({
    mandalId: req.mandalId, name, type, quantity, lowStockThreshold, qrCode
  });
  res.status(201).json(item);
});

const listItems = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({ mandalId: req.mandalId }).sort({ createdAt: -1 });
  res.json(items);
});

const issueItem = asyncHandler(async (req, res) => {
  const { userId, dueBackAt } = req.body;
  const item = await InventoryItem.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!item) { res.status(404); throw new Error('Item not found'); }
  item.status = 'Issued';
  item.issuedTo = userId;
  item.issuedAt = new Date();
  item.dueBackAt = dueBackAt;
  await item.save();
  res.json(item);
});

const returnItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, mandalId: req.mandalId });
  if (!item) { res.status(404); throw new Error('Item not found'); }
  item.status = 'Available';
  item.issuedTo = undefined;
  item.dueBackAt = undefined;
  await item.save();
  res.json(item);
});

module.exports = { createItem, listItems, issueItem, returnItem };
