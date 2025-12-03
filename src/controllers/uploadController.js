const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const path = require('path');

/**
 * @route   POST /upload/image
 * @desc    Upload image file
 * @access  Private (admin, superAdmin)
 */
exports.uploadImage = catchAsync(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No file uploaded', null, 400);
  }

  // Return the file URL/path
  // In production, you might want to upload to cloud storage (AWS S3, Cloudinary, etc.)
  const fileUrl = `/uploads/${req.file.filename}`;

  return ApiResponse.success(
    res,
    'Image uploaded successfully',
    { imageUrl: fileUrl },
    null,
    200
  );
});

