const express = require('express');
const userController = require('../controllers/userController');
const { auth, permitRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schemas = require('../validations/schemas');

const router = express.Router();

// All user management routes require admin or superAdmin role
router.use(auth);
router.use(permitRoles('admin', 'superAdmin'));

// GET /users - List users
router.get('/', validate(schemas.pagination, 'query'), userController.getUsers);

// GET /users/:id - Get user by id
router.get('/:id', validate(schemas.mongoId, 'params'), userController.getUser);

// POST /user - Create user
router.post('/', validate(schemas.createUser), userController.createUser);

// PATCH /user/:id/status - Update user status
router.patch(
  '/:id/status',
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateUserStatus),
  userController.updateUserStatus
);

// DELETE /user/:id - Delete user
router.delete(
  '/:id',
  validate(schemas.mongoId, 'params'),
  userController.deleteUser
);

module.exports = router;
