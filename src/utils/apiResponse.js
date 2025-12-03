/**
 * Standard response format for all API endpoints
 */
class ApiResponse {
  static success(res, message, data = null, meta = null, statusCode = 200) {
    const response = {
      success: true,
      message
    };

    if (data !== null) {
      response.data = data;
    }

    if (meta !== null) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  static error(res, message, errors = null, statusCode = 400) {
    const response = {
      success: false,
      message
    };

    if (errors !== null) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;