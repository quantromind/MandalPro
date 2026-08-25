const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles } = require('../middleware/rbac');
const { getMandal, updateMandal } = require('../controllers/mandalController');

router.use(protect, requireMandal);
router.get('/', getMandal);
router.patch('/', allowRoles('president', 'superadmin', 'secretary', 'treasurer'), updateMandal);
router.put('/', allowRoles('president', 'superadmin', 'secretary', 'treasurer'), updateMandal);

module.exports = router;
