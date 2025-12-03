const ApiResponse = require('../utils/apiResponse');

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message
    }));
    return ApiResponse.error(res, 'Validation failed', errors, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return ApiResponse.error(res, `${field} already exists`, null, 400);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return ApiResponse.error(res, 'Invalid ID format', null, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid token', null, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Token expired', null, 401);
  }

  // Custom operational errors
  if (err.isOperational) {
    return ApiResponse.error(res, err.message, null, err.statusCode || 400);
  }

  // Default server error
  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    null,
    500
  );
};

module.exports = errorHandler;
