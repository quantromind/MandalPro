const express = require('express');
const router = express.Router();
const { getActivePlans, getPlanByCode } = require('../controllers/planController');

router.get('/', getActivePlans);
router.get('/:code', getPlanByCode);

module.exports = router;
