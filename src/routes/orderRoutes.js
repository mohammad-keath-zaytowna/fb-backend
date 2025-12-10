const express = require('express');
const orderController = require('../controllers/orderController');
const { auth, permitRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schemas = require('../validations/schemas');

const router = express.Router();

// All order routes require authentication
router.use(auth);

// POST /cart - Create order (user)
router.post(
  '/cart',
  permitRoles('user'),
  validate(schemas.createOrder),
  orderController.createOrder
);

// GET /orders - List orders
router.get(
  '/',
  validate(schemas.pagination, 'query'),
  orderController.getOrders
);

// GET /order/:id - Get order details
router.get(
  '/:id',
  validate(schemas.mongoId, 'params'),
  orderController.getOrderById
);

// PATCH /order/:id/status - Update order status (admin only)
router.patch(
  '/:id/status',
  permitRoles('admin', 'superAdmin'),
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateOrderStatus),
  orderController.updateOrderStatus
);

module.exports = router;
