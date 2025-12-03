const Product = require('../models/Product');
const ApiResponse = require('../utils/apiResponse');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   GET /products
 * @desc    Get all products (public/admin)
 * @access  Public
 */
exports.getProducts = catchAsync(async (req, res) => {
  // Build base query
  const queryObj = {};

  // Non-admin users can only see active products
  if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
    queryObj.status = 'active';
  }
  if (req.user.role === 'admin') {
    queryObj.admin = req.user._id;
  }
  if (req.user.role === 'customer') {
    queryObj.admin = req.user.managerId;
  }

  const baseQuery = Product.find(queryObj);

  // Apply API features
  const features = new ApiFeatures(baseQuery, req.query)
    .search(['name', 'description'])
    .filter()
    .sort();

  const paginationInfo = features.paginate();

  // Get total count
  const totalQuery = Product.find(queryObj);
  const totalFeatures = new ApiFeatures(totalQuery, req.query)
    .search(['name', 'description'])
    .filter();
  const total = await totalFeatures.query.countDocuments();

  // Execute query
  const products = await features.query;

  const meta = ApiFeatures.getPaginationMeta(
    paginationInfo.page,
    paginationInfo.rowsPerPage,
    total
  );

  return ApiResponse.success(res, 'Products retrieved successfully', { products }, meta);
});

/**
 * @route   GET /products/:id
 * @desc    Get product by ID
 * @access  Public
 */
exports.getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return ApiResponse.error(res, 'Product not found', null, 404);
  }

  return ApiResponse.success(res, 'Product retrieved successfully', { product });
});

/**
 * @route   POST /product
 * @desc    Create new product
 * @access  Private (admin, superAdmin)
 */
exports.createProduct = catchAsync(async (req, res) => {
  const productData = { ...req.body };
  const userRole = req.user.role;
  if (userRole === 'customer') {
    productData.admin = req.user.managerId;
  } else {
    productData.admin = req.user._id;
  }

  // If file is uploaded, use the file path, otherwise use the image URL from body
  if (req.file) {
    productData.image = `/uploads/${req.file.filename}`;
  }

  // Parse colors and sizes if they are strings
  if (typeof productData.colors === 'string') {
    try {
      productData.colors = JSON.parse(productData.colors);
    } catch (e) {
      productData.colors = productData.colors ? [productData.colors] : [];
    }
  }
  if (typeof productData.sizes === 'string') {
    try {
      productData.sizes = JSON.parse(productData.sizes);
    } catch (e) {
      productData.sizes = productData.sizes ? [productData.sizes] : [];
    }
  }

  // Parse price to number
  if (productData.price) {
    productData.price = parseFloat(productData.price);
  }

  const product = await Product.create(productData);

  return ApiResponse.success(
    res,
    'Product created successfully',
    { product },
    null,
    201
  );
});

/**
 * @route   PATCH /product/:id
 * @desc    Update product
 * @access  Private (admin, superAdmin)
 */
exports.updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  const userRole = req.user.role;


  if (!product) {
    return ApiResponse.error(res, 'Product not found', null, 404);
  }
  if (userRole === 'customer') {
    if (product.admin.toString() !== req.user.managerId.toString()) {
      return ApiResponse.error(res, 'You are not authorized to update this product', null, 403);
    }
  } else {
    if (product.admin.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'You are not authorized to update this product', null, 403);
    }
  }

  const updateData = { ...req.body };

  // If file is uploaded, use the file path, otherwise keep existing image or use URL from body
  if (req.file) {
    updateData.image = `/uploads/${req.file.filename}`;
  }

  // Parse colors and sizes if they are strings
  if (typeof updateData.colors === 'string') {
    try {
      updateData.colors = JSON.parse(updateData.colors);
    } catch (e) {
      if (updateData.colors) {
        updateData.colors = [updateData.colors];
      }
    }
  }
  if (typeof updateData.sizes === 'string') {
    try {
      updateData.sizes = JSON.parse(updateData.sizes);
    } catch (e) {
      if (updateData.sizes) {
        updateData.sizes = [updateData.sizes];
      }
    }
  }

  // Parse price to number if provided
  if (updateData.price) {
    updateData.price = parseFloat(updateData.price);
  }

  Object.assign(product, updateData);
  await product.save();

  return ApiResponse.success(res, 'Product updated successfully', { product });
});

/**
 * @route   PATCH /product/:id/status
 * @desc    Update product status
 * @access  Private (admin, superAdmin)
 */
exports.updateProductStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const product = await Product.findById(id);

  if (!product) {
    return ApiResponse.error(res, 'Product not found', null, 404);
  }

  product.status = status;
  await product.save();

  return ApiResponse.success(res, 'Product status updated successfully', { product });
});

/**
 * @route   DELETE /product/:id
 * @desc    Delete product (soft delete)
 * @access  Private (admin, superAdmin)
 */
exports.deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return ApiResponse.error(res, 'Product not found', null, 404);
  }

  // Soft delete
  product.status = 'deleted';
  await product.save();

  return ApiResponse.success(res, 'Product deleted successfully', null, null, 200);
});
