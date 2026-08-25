const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireMandal } = require('../middleware/tenant');
const { allowRoles } = require('../middleware/rbac');
const {
  createEvent, listEvents, getEvent, addTask, updateTask, closeEvent
} = require('../controllers/eventController');

router.use(protect, requireMandal);

router.post('/', allowRoles('president', 'secretary'), createEvent);
router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/:id/tasks', allowRoles('president', 'secretary'), addTask);
router.patch('/tasks/:taskId', updateTask);
router.patch('/:id/close', allowRoles('president', 'secretary'), closeEvent);

module.exports = router;
