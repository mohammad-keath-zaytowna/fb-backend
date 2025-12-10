const express = require('express');
const productController = require('../controllers/productController');
const { auth, permitRoles } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const schemas = require('../validations/schemas');
const upload = require('../middlewares/upload');

const router = express.Router();

// Public routes
router.get(
  '/',
  auth,
  validate(schemas.pagination, 'query'),
  productController.getProducts
);

router.get(
  '/:id',
  validate(schemas.mongoId, 'params'),
  productController.getProductById
);

// Admin only routes
router.post(
  '/',
  auth,
  permitRoles('admin', 'user'),
  upload.single('image'),
  (req, res, next) => {
    // Skip image validation if file is uploaded
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }
    // Validate other fields
    const schema = schemas.createProduct;
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return require('../utils/apiResponse').error(res, 'Validation failed', errors, 400);
    }

    req.body = value;
    next();
  },
  productController.createProduct
);

router.patch(
  '/:id',
  auth,
  permitRoles('admin', 'superAdmin'),
  validate(schemas.mongoId, 'params'),
  upload.single('image'),
  (req, res, next) => {
    // Skip image validation if file is uploaded
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }
    // Validate other fields
    const schema = schemas.updateProduct;
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return require('../utils/apiResponse').error(res, 'Validation failed', errors, 400);
    }

    req.body = value;
    next();
  },
  productController.updateProduct
);

router.patch(
  '/:id/status',
  auth,
  permitRoles('admin', 'superAdmin'),
  validate(schemas.mongoId, 'params'),
  validate(schemas.updateProductStatus),
  productController.updateProductStatus
);

router.delete(
  '/product/:id',
  auth,
  permitRoles('admin', 'superAdmin'),
  validate(schemas.mongoId, 'params'),
  productController.deleteProduct
);

module.exports = router;
