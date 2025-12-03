const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   GET /stats
 * @desc    Get dashboard statistics
 * @access  Private (admin, superAdmin)
 */
exports.getStats = catchAsync(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user._id;

  let stats = {};

  if (userRole === 'superAdmin') {
    // SuperAdmin sees all stats
    const totalUsers = await User.countDocuments({ role: { $ne: 'superAdmin' } });
    const activeUsers = await User.countDocuments({ 
      role: { $ne: 'superAdmin' },
      status: 'active' 
    });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments({ status: { $ne: 'deleted' } });
    
    stats = {
      totalUsers,
      activeUsers,
      remainingUsers: null, // Not applicable for superAdmin
      maxManagedUsers: null,
      totalOrders,
      totalProducts,
    };
  } else if (userRole === 'admin') {
    // Admin sees stats for their managed users
    const adminUser = await User.findById(userId);
    const maxManagedUsers = adminUser?.maxManagedUsers || 0;
    
    const totalUsers = await User.countDocuments({ 
      managerId: userId,
      status: { $ne: 'deleted' }
    });
    const activeUsers = await User.countDocuments({ 
      managerId: userId,
      status: 'active' 
    });
    const remainingUsers = Math.max(0, maxManagedUsers - activeUsers);
    
    // Get orders for admin's managed users
    const managedUserIds = await User.find({ managerId: userId }).select('_id');
    const managedUserIdsArray = managedUserIds.map(u => u._id);
    const totalOrders = managedUserIdsArray.length > 0 
      ? await Order.countDocuments({ user: { $in: managedUserIdsArray } })
      : 0;
    
    // Get products created by this admin
    const totalProducts = await Product.countDocuments({ 
      admin: userId,
      status: { $ne: 'deleted' } 
    });
    
    stats = {
      totalUsers,
      activeUsers,
      remainingUsers,
      maxManagedUsers,
      totalOrders,
      totalProducts,
    };
  } else {
    return ApiResponse.error(res, 'Unauthorized', null, 403);
  }

  return ApiResponse.success(res, 'Stats retrieved successfully', { stats });
});

