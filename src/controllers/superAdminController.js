const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   GET /admins
 * @desc    Get all admins with statistics
 * @access  Private (superAdmin)
 */
exports.getAdmins = catchAsync(async (req, res) => {
  // Build query for admins only
  const baseQuery = User.find({ role: 'admin' });

  // Apply API features
  const features = new ApiFeatures(baseQuery, req.query)
    .search(['name', 'email'])
    .filter()
    .sort();

  const paginationInfo = features.paginate();

  // Get total count
  const totalQuery = User.find({ role: 'admin' });
  const totalFeatures = new ApiFeatures(totalQuery, req.query)
    .search(['name', 'email'])
    .filter();
  const total = await totalFeatures.query.countDocuments();

  // Execute query
  const admins = await features.query;

  // Calculate statistics for each admin
  // Note: This is a simplified interpretation where we count all customers
  // In a real scenario, you might have a relationship between admins and customers
  const adminsWithStats = await Promise.all(
    admins.map(async (admin) => {
      const adminObj = admin.toJSON();

      // Count all customers (interpretation: total users in system)
      const numberOfUsers = await User.countDocuments({ role: 'customer' });

      // Count active customers
      const numberOfCurrentActiveUsers = await User.countDocuments({
        role: 'customer',
        status: 'active'
      });

      return {
        ...adminObj,
        numberOfUsers,
        numberOfCurrentActiveUsers
      };
    })
  );

  const meta = ApiFeatures.getPaginationMeta(
    paginationInfo.page,
    paginationInfo.rowsPerPage,
    total
  );

  return ApiResponse.success(
    res,
    'Admins retrieved successfully',
    { admins: adminsWithStats },
    meta
  );
});

/**
 * @route   POST /admins
 * @desc    Create new admin
 * @access  Private (superAdmin)
 */
exports.createAdmin = catchAsync(async (req, res) => {
  const { confirmPassword, numberOfUsers, ...adminData } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email: adminData.email });
  if (existingUser) {
    return ApiResponse.error(res, 'Email already exists', null, 400);
  }

  // Create admin user
  const admin = await User.create({
    ...adminData,
    role: 'admin',
    maxManagedUsers: numberOfUsers
  });

  return ApiResponse.success(res, 'Admin created successfully', { admin }, null, 201);
});

/**
 * @route   PATCH /admins/:id/status
 * @desc    Update admin status
 * @access  Private (superAdmin)
 */
exports.updateAdminStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const admin = await User.findOne({ _id: id, role: 'admin' });

  if (!admin) {
    return ApiResponse.error(res, 'Admin not found', null, 404);
  }

  admin.status = status;
  await admin.save();

  return ApiResponse.success(res, 'Admin status updated successfully', { admin });
});
