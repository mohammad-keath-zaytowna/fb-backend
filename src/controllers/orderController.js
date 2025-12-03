const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiResponse = require('../utils/apiResponse');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   POST /cart
 * @desc    Create new order (customer)
 * @access  Private (customer)
 */
exports.createOrder = catchAsync(async (req, res) => {
  // Validate products exist and are active
  const productIds = req.body.items.map((item) => item.prod_id);
  const products = await Product.find({
    _id: { $in: productIds },
    status: 'active'
  });

  if (products.length !== productIds.length) {
    return ApiResponse.error(
      res,
      'One or more products are not available',
      null,
      400
    );
  }

  // Create order with user ID
  const order = await Order.create({
    ...req.body,
    user: req.user._id
  });

  // Populate product details
  await order.populate('items.prod_id', 'name image');
  await order.populate('user', 'name email');

  return ApiResponse.success(res, 'Order created successfully', { order }, null, 201);
});

/**
 * @route   GET /orders
 * @desc    Get orders (customer sees own, admin sees all)
 * @access  Private
 */
exports.getOrders = catchAsync(async (req, res) => {
  // Build base query
  const queryObj = {};

  const isAdmin = req.user && ['admin', 'superAdmin'].includes(req.user.role);

  // If not admin, only show user's own orders
  if (!isAdmin) {
    queryObj.user = req.user._id;
  }

  // Admin filters
  if (isAdmin) {
    if (req.query.customer) {
      queryObj.user = req.query.customer;
    }
    if (req.query.user) {
      queryObj.createdByAdmin = req.query.user;
    }
  }

  const baseQuery = Order.find(queryObj)
    .populate('user', 'name email')
    .populate('items.prod_id', 'name image');

  // Apply API features
  const features = new ApiFeatures(baseQuery, req.query)
    .search(['customerName', 'phoneNumber'])
    .filter()
    .dateRange('createdAt')
    .sort();

  const paginationInfo = features.paginate();

  // Get total count
  const totalQuery = Order.find(queryObj);
  const totalFeatures = new ApiFeatures(totalQuery, req.query)
    .search(['customerName', 'phoneNumber'])
    .filter()
    .dateRange('createdAt');
  const total = await totalFeatures.query.countDocuments();

  // Execute query
  const orders = await features.query;

  const meta = ApiFeatures.getPaginationMeta(
    paginationInfo.page,
    paginationInfo.rowsPerPage,
    total
  );

  return ApiResponse.success(res, 'Orders retrieved successfully', { orders }, meta);
});

/**
 * @route   GET /order/:id
 * @desc    Get order by ID
 * @access  Private
 */
exports.getOrderById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'name email')
    .populate('items.prod_id')
    .populate('createdByAdmin', 'name email');

  if (!order) {
    return ApiResponse.error(res, 'Order not found', null, 404);
  }

  // Check if user has permission to view this order
  const isAdmin = req.user && ['admin', 'superAdmin'].includes(req.user.role);
  if (!isAdmin && order.user._id.toString() !== req.user._id.toString()) {
    return ApiResponse.error(
      res,
      'You do not have permission to view this order',
      null,
      403
    );
  }

  return ApiResponse.success(res, 'Order retrieved successfully', { order });
});

/**
 * @route   PATCH /order/:id/status
 * @desc    Update order status
 * @access  Private (admin, superAdmin)
 */
exports.updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    return ApiResponse.error(res, 'Order not found', null, 404);
  }

  order.status = status;
  await order.save();

  await order.populate('user', 'name email');
  await order.populate('items.prod_id', 'name image');

  return ApiResponse.success(res, 'Order status updated successfully', { order });
});
