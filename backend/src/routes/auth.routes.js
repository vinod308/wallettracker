/**
 * Authentication Routes
 * API endpoints for authentication (Section 2 of specification)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidators = require('../validators/authValidators');
const validate = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, passwordResetLimiter, signupLimiter } = require('../middleware/rateLimiter');

/**
 * Public Routes (no authentication required)
 */

// POST /api/auth/signup
// Section 2.2 - Signup Flow
router.post(
    '/signup',
    signupLimiter,
    authValidators.signupValidation,
    validate,
    authController.signup
);

// POST /api/auth/login
// Section 2.1 - Login Flow
// Rate limited: 5 attempts per 15 minutes (exact from spec)
router.post(
    '/login',
    loginLimiter,
    authValidators.loginValidation,
    validate,
    authController.login
);

// POST /api/auth/forgot-password
// Section 2.3 - Forgot Password Flow
// Rate limited: 3 attempts per hour
router.post(
    '/forgot-password',
    passwordResetLimiter,
    authValidators.forgotPasswordValidation,
    validate,
    authController.forgotPassword
);

// POST /api/auth/reset-password/:token
// Section 2.3.5 - Reset Password Flow
router.post(
    '/reset-password/:token',
    authValidators.resetPasswordValidation,
    validate,
    authController.resetPassword
);

// GET /api/auth/verify-session
// Verify if current session is valid
router.get('/verify-session', authController.verifySession);

/**
 * Protected Routes (authentication required)
 */

// POST /api/auth/logout
// Section 9 - Logout Workflow
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me
// Get current authenticated user
router.get('/me', authenticate, authController.getCurrentUser);

// PUT /api/auth/change-password
// Section 8.1.2 - Change Password Flow
router.put(
    '/change-password',
    authenticate,
    authValidators.changePasswordValidation,
    validate,
    authController.changePassword
);

module.exports = router;
