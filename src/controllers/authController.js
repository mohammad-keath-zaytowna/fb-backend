const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
  });
};

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get OTP expiry time
 */
const getOTPExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 15;
  return new Date(Date.now() + minutes * 60000);
};

/**
 * Simulate sending email (replace with real email service)
 */
const sendEmail = async (email, otp) => {
  console.log(`[EMAIL SIMULATION] Sending OTP to ${email}: ${otp}`);
  // TODO: Integrate with SendGrid, AWS SES, or Nodemailer
  return true;
};

/**
 * @route   POST /signup
 * @desc    Register new customer (public)
 * @access  Public
 */
exports.signup = catchAsync(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return ApiResponse.error(res, 'Passwords do not match', null, 400);
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return ApiResponse.error(res, 'Email already exists', null, 400);
  }

  // Create customer user
  const user = await User.create({
    name,
    email,
    password,
    role: 'customer', // Always customer for public signup
    status: 'active'
  });

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Remove password from response
  user.password = undefined;

  return ApiResponse.success(
    res,
    'Account created successfully',
    {
      user,
      accessToken,
      refreshToken
    },
    null,
    201
  );
});

/**
 * @route   POST /login
 * @desc    Login user
 * @access  Public
 */
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return ApiResponse.error(res, 'Invalid email or password', null, 401);
  }

  // Check user status
  if (user.status === 'blocked') {
    return ApiResponse.error(res, 'Your account has been blocked', null, 403);
  }

  if (user.status === 'deleted') {
    return ApiResponse.error(res, 'Your account has been deleted', null, 403);
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return ApiResponse.error(res, 'Invalid email or password', null, 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Remove password from response
  user.password = undefined;

  return ApiResponse.success(
    res,
    'Login successful',
    {
      user,
      accessToken,
      refreshToken
    },
    null,
    200
  );
});

/**
 * @route   PATCH /forgetPassword
 * @desc    Request password reset OTP
 * @access  Public
 */
exports.forgetPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return ApiResponse.error(res, 'User not found', null, 404);
  }

  // Generate OTP
  const otp = generateOTP();
  const expiresAt = getOTPExpiry();

  // Save OTP to user
  user.passwordResetOtp = otp;
  user.passwordResetOtpExpiresAt = expiresAt;
  await user.save();

  // Send OTP via email
  await sendEmail(email, otp);

  // Return response (include OTP in development mode only)
  const responseData =
    process.env.NODE_ENV === 'development'
      ? { otp, expiresAt }
      : { expiresAt };

  return ApiResponse.success(
    res,
    'OTP sent to your email successfully',
    responseData,
    null,
    200
  );
});

/**
 * @route   PATCH /resetPassword
 * @desc    Reset password with OTP
 * @access  Public
 */
exports.resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select(
    '+passwordResetOtp +passwordResetOtpExpiresAt'
  );

  if (!user) {
    return ApiResponse.error(res, 'User not found', null, 404);
  }

  // Verify OTP
  if (user.passwordResetOtp !== otp) {
    return ApiResponse.error(res, 'Invalid OTP', null, 400);
  }

  // Check if OTP is expired
  if (new Date() > new Date(user.passwordResetOtpExpiresAt)) {
    return ApiResponse.error(res, 'OTP has expired', null, 400);
  }

  // Update password
  user.password = newPassword;
  user.passwordResetOtp = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  await user.save();

  return ApiResponse.success(res, 'Password reset successfully', null, null, 200);
});
