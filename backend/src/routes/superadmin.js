const express = require('express');
const router = express.Router();
const { protect, protectSuperadmin } = require('../middleware/auth');
const {
  getAllUsers,
  updateUser,
  deleteUser,
  getAllMandals,
  getMandalById,
  updateMandal,
  deleteMandal,
  getAllPlans,
  createPlan,
  updatePlan,
  togglePlanStatus,
  deletePlan
} = require('../controllers/superadminController');

// All routes are protected and require superadmin role
router.use(protect, protectSuperadmin);

router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

router.route('/mandals')
  .get(getAllMandals);

router.route('/mandals/:id')
  .get(getMandalById)
  .put(updateMandal)
  .delete(deleteMandal);

router.route('/plans')
  .get(getAllPlans)
  .post(createPlan);

router.route('/plans/:id')
  .put(updatePlan)
  .delete(deletePlan);

router.route('/plans/:id/status')
  .patch(togglePlanStatus);

module.exports = router;
