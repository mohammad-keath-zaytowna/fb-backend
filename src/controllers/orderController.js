const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   POST /cart
 * @desc    Create new order (user)
 * @access  Private (user)
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
  let isStockManaged = false;
  if (req.user.role === 'user') {
    const admin = await User.findById(req.user.managerId);
    if (!admin) {
      return ApiResponse.error(
        res,
        'Admin not found',
        null,
        404
      );
    }
    isStockManaged = admin.stockManagement;
  } else if (req.user.role === 'admin') {
    isStockManaged = req.user.stockManagement;
  }
  if (isStockManaged) {
    Promise.all(
      req.body.items.map(async (item) => {
        const product = await Product.findById(item.prod_id);
        if (!product) {
          return ApiResponse.error(
            res,
            'Product not found',
            null,
            404
          );
        }
        if (product.stock < item.count) {
          return ApiResponse.error(
            res,
            'Not enough stock',
            null,
            400
          );
        }
        await Product.updateOne(
          { _id: item.prod_id },
          { $inc: { stock: -item.count } }
        );
      })
    );

  }

  // Calculate total from items, shipping, and discount
  const subtotal = req.body.items.reduce((sum, item) => sum + (item.price * item.count), 0);
  const shipping = req.body.shipping || 0;
  const discount = req.body.discount || 0;
  const calculatedTotal = Math.max(0, subtotal + shipping - discount);

  // Create order with user ID and calculated total
  const order = await Order.create({
    ...req.body,
    total: calculatedTotal,
    user: req.user._id
  });

  // Populate product details
  await order.populate('items.prod_id', 'name image');
  await order.populate('user', 'name email');

  return ApiResponse.success(res, 'Order created successfully', { order }, null, 201);
});

/**
 * @route   GET /orders
 * @desc    Get orders (user sees own, admin sees their managed users' orders, superAdmin sees all)
 * @access  Private
 */
exports.getOrders = catchAsync(async (req, res) => {
  // Build base query
  const queryObj = {};

  // If regular user, only show their own orders (unless they have canSeeAllOrders permission)
  if (req.user.role === 'user') {
    if (req.user.canSeeAllOrders && req.user.managerId) {
      // User can see all orders from users under the same admin
      const managedUsers = await User.find({ managerId: req.user.managerId }).select('_id');
      const managedUserIds = managedUsers.map(u => u._id);
      queryObj.user = { $in: [req.user._id, ...managedUserIds] };
    } else {
      // User can only see their own orders
      queryObj.user = req.user._id;
    }
  } else if (req.user.role === 'admin') {
    // Admin sees orders from users they manage and themselves
    const managedUsers = await User.find({ managerId: req.user._id }).select('_id');
    const managedUserIds = managedUsers.map(u => u._id);

    // If query has specific user filter, validate it's a managed user
    if (req.query.user) {
      queryObj.user = req.query.user;
    } else {
      queryObj.user = { $in: [req.user._id, ...managedUserIds] };
    }
  } else if (req.user.role === 'superAdmin') {
    // SuperAdmin sees all orders, can filter by user if specified
    if (req.query.user) {
      queryObj.user = req.query.user;
    }
  }

  const baseQuery = Order.find(queryObj)
    .populate('user', 'name email')
    .populate('items.prod_id', 'name image');

  // Apply API features
  const features = new ApiFeatures(baseQuery, req.query)
    .search(['userName', 'phoneNumber'])
    .filter()
    .dateRange('createdAt')
    .sort();

  const paginationInfo = features.paginate();

  // Get total count
  const totalQuery = Order.find(queryObj);
  const totalFeatures = new ApiFeatures(totalQuery, req.query)
    .search(['userName', 'phoneNumber'])
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
  const isOrderOwner = order.user._id.toString() === req.user._id.toString();
  const canSeeAllOrdersInGroup = req.user.role === 'user' && req.user.canSeeAllOrders &&
    req.user.managerId && order.user.managerId?.toString() === req.user.managerId.toString();

  if (!isAdmin && !isOrderOwner && !canSeeAllOrdersInGroup) {
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

/**
 * @route   PATCH /order/:id
 * @desc    Update order (full update)
 * @access  Private (admin, superAdmin)
 */
exports.updateOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { items, address, shipping, discount, notes, userName, phoneNumber, status } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    return ApiResponse.error(res, 'Order not found', null, 404);
  }

  // Update fields if provided
  if (items) {
    // Validate products exist and are active
    const productIds = items.map((item) => item.prod_id);
    const products = await Product.find({
      _id: { $in: productIds },
      status: { $ne: 'deleted' }
    });

    if (products.length !== productIds.length) {
      return ApiResponse.error(
        res,
        'One or more products are not available',
        null,
        400
      );
    }

    order.items = items;
  }

  if (address !== undefined) order.address = address;
  if (shipping !== undefined) order.shipping = shipping;
  if (discount !== undefined) order.discount = discount;
  if (notes !== undefined) order.notes = notes;
  if (userName !== undefined) order.userName = userName;
  if (phoneNumber !== undefined) order.phoneNumber = phoneNumber;
  if (status !== undefined) order.status = status;

  // Recalculate total
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.count), 0);
  const shippingCost = order.shipping || 0;
  const discountAmount = order.discount || 0;
  order.total = Math.max(0, subtotal + shippingCost - discountAmount);

  await order.save();

  await order.populate('user', 'name email');
  await order.populate('items.prod_id', 'name image');
  await order.populate('createdByAdmin', 'name email');

  return ApiResponse.success(res, 'Order updated successfully', { order });
});

