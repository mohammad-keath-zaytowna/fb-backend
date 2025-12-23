const express = require("express");
const uploadController = require("../controllers/uploadController");
const { upload, compressImage, cloudinaryUpload } = require("../middlewares/upload");
const { auth, permitRoles } = require("../middlewares/auth");

const router = express.Router();

// POST /upload/image - Upload image file
router.post(
  "/image",
  auth,
  permitRoles("admin", "superAdmin"),
  upload.single("image"),
  compressImage,
  cloudinaryUpload,
  uploadController.uploadImage
);

module.exports = router;
