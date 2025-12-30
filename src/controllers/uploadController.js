const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const path = require('path');

/**
 * @route   POST /upload/image
 * @desc    Upload image file
 * @access  Private (admin, superAdmin)
 */
exports.uploadImage = catchAsync(async (req, res) => {
  if (!req.uploadResult?.secure_url) {
    return ApiResponse.error(res, 'No file uploaded', null, 400);
  }

  // Return the file URL/path
  const fileUrl = req.uploadResult?.secure_url;

  return ApiResponse.success(
    res,
    'Image uploaded successfully',
    { imageUrl: fileUrl },
    null,
    200
  );
});

