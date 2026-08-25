const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { createItem, listItems, issueItem, returnItem } = require('../controllers/inventoryController');

router.use(protect, requireMandal);
router.post('/', createItem);
router.get('/', listItems);
router.patch('/:id/issue', issueItem);
router.patch('/:id/return', returnItem);

module.exports = router;
