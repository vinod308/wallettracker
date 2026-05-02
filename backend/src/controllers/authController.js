/**
 * Authentication Controller
 * HTTP request handlers for authentication endpoints
 */

const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Signup - POST /api/auth/signup
 * Section 2.2 of specification
 */
const signup = asyncHandler(async (req, res) => {
    const { fullName, email, password, confirmPassword, agreedToTerms } = req.body;

    const result = await authService.signup({
        fullName,
        email,
        password,
        confirmPassword,
    });

    // Set HTTP-only cookie (exact from spec: Section 2.1.4)
    res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000, // 30 minutes
    });

    // Success response (exact from spec: Section 2.2.5)
    res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        data: {
            user: result.user,
        },
    });
});

/**
 * Login - POST /api/auth/login
 * Section 2.1 of specification
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const metadata = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
    };

    const result = await authService.login({ email, password }, metadata);

    // Set HTTP-only cookie (exact from spec)
    res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000, // 30 minutes
    });

    // Success response (exact from spec: Section 2.1.8)
    res.status(200).json({
        success: true,
        message: 'Welcome back!',
        data: {
            user: result.user,
        },
    });
});

/**
 * Logout - POST /api/auth/logout
 * Section 9 of specification
 */
const logout = asyncHandler(async (req, res) => {
    const token = req.cookies?.auth_token || req.session?.token;

    if (token) {
        await authService.logout(token);
    }

    // Clear cookie
    res.clearCookie('auth_token');

    res.status(200).json({
        success: true,
        message: 'You have been logged out successfully',
    });
});

/**
 * Forgot Password - POST /api/auth/forgot-password
 * Section 2.3 of specification
 */
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    // Always return success (exact from spec: Section 2.3.3)
    res.status(200).json({
        success: true,
        message: result.message,
        subMessage: result.subMessage,
    });
});

/**
 * Reset Password - POST /api/auth/reset-password/:token
 * Section 2.3.5 of specification
 */
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    const result = await authService.resetPassword(token, newPassword, confirmPassword);

    // Success response (exact from spec: Section 2.3.5)
    res.status(200).json({
        success: true,
        message: result.message,
        subMessage: result.subMessage,
    });
});

/**
 * Verify Session - GET /api/auth/verify-session
 * Check if current session is valid
 */
const verifySession = asyncHandler(async (req, res) => {
    const token = req.cookies?.auth_token;

    if (!token) {
        return res.status(401).json({
            success: false,
            authenticated: false,
        });
    }

    const user = await authService.verifySession(token);

    res.status(200).json({
        success: true,
        authenticated: true,
        data: { user },
    });
});

/**
 * Get Current User - GET /api/auth/me
 * Get currently authenticated user
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    // User already attached by auth middleware
    res.status(200).json({
        success: true,
        data: {
            user: req.user,
        },
    });
});

/**
 * Change Password - PUT /api/auth/change-password
 * Section 8.1.2 of specification
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    const result = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
        confirmNewPassword
    );

    // Success response (exact from spec: Section 8.1.2)
    res.status(200).json({
        success: true,
        message: result.message,
    });
});

module.exports = {
    signup,
    login,
    logout,
    forgotPassword,
    resetPassword,
    verifySession,
    getCurrentUser,
    changePassword,
};
