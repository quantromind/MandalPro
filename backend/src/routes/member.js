const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles } = require('../middleware/rbac');
const { listMembers, addMember, removeMember, updateMemberRole } = require('../controllers/memberController');

router.use(protect, requireMandal);
router.get('/', listMembers);
router.post('/', allowRoles('president', 'superadmin', 'secretary'), addMember);
router.delete('/:id', allowRoles('president', 'superadmin'), removeMember);
router.patch('/:id', allowRoles('president', 'superadmin'), updateMemberRole);

module.exports = router;
