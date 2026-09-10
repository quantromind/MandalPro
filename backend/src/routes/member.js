const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles, checkPermission } = require('../middleware/rbac');
const { listMembers, addMember, removeMember, updateMemberRole, leaveMandal } = require('../controllers/memberController');

router.use(protect, requireMandal);
router.get('/', listMembers);
router.post('/leave', leaveMandal);
router.post('/', checkPermission('canAddMembers'), addMember);
router.delete('/:id', allowRoles('president', 'superadmin'), removeMember);
router.patch('/:id', checkPermission('canAddMembers'), updateMemberRole);

module.exports = router;

