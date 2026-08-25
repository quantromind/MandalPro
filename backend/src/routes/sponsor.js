const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles } = require('../middleware/rbac');
const { createSponsor, listSponsors, recordPayment } = require('../controllers/sponsorController');

router.use(protect, requireMandal);
router.post('/', allowRoles('president', 'treasurer', 'secretary'), createSponsor);
router.get('/', listSponsors);
router.patch('/:id/payment', allowRoles('president', 'treasurer'), recordPayment);

module.exports = router;
