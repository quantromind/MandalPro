const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles, checkPermission } = require('../middleware/rbac');
const {
  createDonation,
  listDonations,
  getDonation,
  updateDonation,
  deleteDonation,
  cancelDonation
} = require('../controllers/donationController');

router.use(protect, requireMandal);

router.post('/', checkPermission('canCollect'), createDonation);
router.get('/', listDonations);
router.get('/:id', getDonation);
router.put('/:id', checkPermission('canCollect'), updateDonation);
router.patch('/:id', checkPermission('canCollect'), updateDonation);
router.delete('/:id', allowRoles('president', 'treasurer'), deleteDonation);
router.patch('/:id/cancel', allowRoles('president', 'treasurer'), cancelDonation);

module.exports = router;

