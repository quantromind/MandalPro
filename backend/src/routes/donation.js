const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles } = require('../middleware/rbac');
const {
  createDonation,
  listDonations,
  getDonation,
  cancelDonation
} = require('../controllers/donationController');

router.use(protect, requireMandal);

router.post('/', allowRoles('president', 'treasurer', 'secretary', 'volunteer'), createDonation);
router.get('/', listDonations);
router.get('/:id', getDonation);
router.patch('/:id/cancel', allowRoles('president', 'treasurer'), cancelDonation);

module.exports = router;
