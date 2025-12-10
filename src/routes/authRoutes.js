const express = require("express");
const authController = require("../controllers/authController");
const validate = require("../middlewares/validate");
const schemas = require("../validations/schemas");

const router = express.Router();

// POST /signup - Register new user (PUBLIC)
router.post("/signup", validate(schemas.signup), authController.signup);

// POST /login - Login (PUBLIC)
router.post("/login", validate(schemas.login), authController.login);

// PATCH /forgetPassword - Request password reset OTP (PUBLIC)
router.patch(
  "/forgetPassword",
  validate(schemas.forgetPassword),
  authController.forgetPassword
);

// PATCH /resetPassword - Reset password with OTP (PUBLIC)
router.patch(
  "/resetPassword",
  validate(schemas.resetPassword),
  authController.resetPassword
);

module.exports = router;
