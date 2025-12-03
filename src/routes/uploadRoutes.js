const express = require('express');
const uploadController = require('../controllers/uploadController');
const upload = require('../middlewares/upload');
const { auth, permitRoles } = require('../middlewares/auth');

const router = express.Router();

// POST /upload/image - Upload image file
router.post(
  '/image',
  auth,
  permitRoles('admin', 'superAdmin'),
  upload.single('image'),
  uploadController.uploadImage
);

module.exports = router;

