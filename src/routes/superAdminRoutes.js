const express = require('express');
const superAdminController = require('../controllers/superAdminController');
const { auth, permitRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schemas = require('../validations/schemas');

const router = express.Router();

// All super admin routes require superAdmin role
router.use(auth);
router.use(permitRoles('superAdmin'));

// GET /admins - List admins with stats
router.get(
  '/',
  validate(schemas.pagination, 'query'),
  superAdminController.getAdmins
);

// POST /admins - Create admin
router.post(
  '/',
  validate(schemas.createAdmin),
  superAdminController.createAdmin
);

// PATCH /admins/:id/status - Update admin status
router.patch(
  '/:id/status',
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateUserStatus),
  superAdminController.updateAdminStatus
);

module.exports = router;
