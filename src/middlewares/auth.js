const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'No token provided. Authentication required', null, 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return ApiResponse.error(res, 'User not found', null, 401);
    }

    // Check if user is active
    if (user.status !== 'active') {
      return ApiResponse.error(
        res,
        `Your account is ${user.status}. Please contact support`,
        null,
        403
      );
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.error(res, 'Invalid token', null, 401);
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token expired', null, 401);
    }
    return ApiResponse.error(res, error.message, null, 401);
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 */
const permitRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'User not authenticated', null, 401);
    }

    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        'You do not have permission to perform this action',
        null,
        403
      );
    }

    next();
  };
};

module.exports = { auth, permitRoles };
