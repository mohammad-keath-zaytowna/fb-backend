const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   GET /users
 * @desc    Get all users (admin/superAdmin)
 * @access  Private (admin, superAdmin)
 */
exports.getUsers = catchAsync(async (req, res) => {
  const userType = req.user.role;

  let baseQuery
  if (userType === 'admin') {
    baseQuery = User.find({ managerId: req.user._id });
  } else if (userType === 'superAdmin') {
    baseQuery = User.find({ role: { $ne: 'superAdmin' } });
  }
  // Apply API features
  const features = new ApiFeatures(baseQuery, req.query)
    .search(['name', 'email'])
    .filter()
    .sort();

  const paginationInfo = features.paginate();

  // Get total count
  const totalQuery = User.find({ role: { $ne: 'superAdmin' } });
  const totalFeatures = new ApiFeatures(totalQuery, req.query)
    .search(['name', 'email'])
    .filter();
  const total = await totalFeatures.query.countDocuments();

  // Execute query
  const users = await features.query;

  const meta = ApiFeatures.getPaginationMeta(
    paginationInfo.page,
    paginationInfo.rowsPerPage,
    total
  );

  return ApiResponse.success(res, 'Users retrieved successfully', { users }, meta);
});

/**
 * @route   GET /users/:id
 * @desc    Get user by id
 * @access  Private (admin, superAdmin)
 */
exports.getUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');
  if (!user) {
    return ApiResponse.error(res, 'User not found', null, 404);
  }
  return ApiResponse.success(res, 'User retrieved successfully', { user });
});

/**
 * @route   POST /user
 * @desc    Create new user (admin/superAdmin)
 * @access  Private (admin, superAdmin)
 */
exports.createUser = catchAsync(async (req, res) => {
  const { confirmPassword, ...userData } = req.body;
  const userType = req.user.role;

  if (userType === 'admin') {
    const currentUsers = await User.countDocuments({ managerId: req.user._id, status: 'active' });
    if (currentUsers >= req.user.maxManagedUsers) {
      return ApiResponse.error(res, 'You have reached the maximum number of users you can manage', null, 400);
    }
  }

  if (userType === 'admin') {
    userData.managerId = req.user._id;
    userData.role = 'user';
  } else if (userType === 'superAdmin') {
    userData.role = 'admin';
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    return ApiResponse.error(res, 'Email already exists', null, 400);
  }

  // Set default role if not provided
  if (!userData.role) {
    userData.role = 'user';
  }

  const user = await User.create(userData);

  return ApiResponse.success(res, 'User created successfully', { user }, null, 201);
});

/**
 * @route   PATCH /user/:id/status
 * @desc    Update user status
 * @access  Private (admin, superAdmin)
 */
exports.updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const userType = req.user.role;
  if (userType === 'admin' && status === 'active') {
    const currentUsers = await User.countDocuments({ managerId: req.user._id, status: 'active' });
    if (currentUsers >= req.user.maxManagedUsers) {
      return ApiResponse.error(res, 'You have reached the maximum number of users you can manage', null, 400);
    }
  }
  const user = await User.findById(id);

  if (!user) {
    return ApiResponse.error(res, 'User not found', null, 404);
  }

  user.status = status;
  await user.save();

  return ApiResponse.success(res, 'User status updated successfully', { user });
});

/**
 * @route   PATCH /users/:id
 * @desc    Update user fields (admin can update own settings, superAdmin can update any)
 * @access  Private (admin, superAdmin)
 */
exports.updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const userType = req.user.role;

  const user = await User.findById(id);
  if (!user) return ApiResponse.error(res, 'User not found', null, 404);

  // Only allow admin to update their own record, or superAdmin to update any
  if (req.user.role === 'admin' && req.user._id.toString() !== id) {
    // Admin can update managed users' canSeeAllOrders permission
    const targetUser = await User.findById(id);
    if (!targetUser || targetUser.managerId?.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Not authorized to update this user', null, 403);
    }
    // Admin can only update canSeeAllOrders for managed users
    if (Object.keys(updateData).some(key => key !== 'canSeeAllOrders')) {
      return ApiResponse.error(res, 'Admins can only update canSeeAllOrders for managed users', null, 403);
    }
  }

  // Only allow whitelisted fields to be updated
  const allowed = ['name', 'maxManagedUsers', 'currency', 'canSeeAllOrders'];
  allowed.forEach((field) => {
    if (field in updateData) {
      user[field] = updateData[field];
    }
  });

  await user.save();

  return ApiResponse.success(res, 'User updated successfully', { user });
});

/**
 * @route   DELETE /user/:id
 * @desc    Delete user (soft delete)
 * @access  Private (admin, superAdmin)
 */
exports.deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return ApiResponse.error(res, 'User not found', null, 404);
  }

  // Soft delete
  user.status = 'deleted';
  await user.save();

  return ApiResponse.success(res, 'User deleted successfully', null, null, 200);
});

/**
 * @route   PATCH /users/:id/password
 * @desc    Update user password (admin/superAdmin)
 * @access  Private (admin, superAdmin)
 */
exports.updateUserPassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return ApiResponse.error(res, 'User not found', null, 404);
  }

  user.password = newPassword; // Will be hashed by pre-save hook
  await user.save();

  return ApiResponse.success(res, 'Password updated successfully');
});

/**
 * @route   PATCH /users/currency
 * @desc    Update current user's currency preference
 * @access  Private (admin, superAdmin)
 */
exports.updateCurrency = catchAsync(async (req, res) => {
  const { currency } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return ApiResponse.error(res, 'User not found', null, 404);
  }

  // Only admins and superAdmins can set currency
  if (!['admin'].includes(user.role)) {
    return ApiResponse.error(res, 'Only admins can set currency preference', null, 403);
  }

  await User.updateMany({ managerId: req.user._id }, { currency })

  user.currency = currency;
  await user.save();

  return ApiResponse.success(res, 'Currency updated successfully', { user });
});
