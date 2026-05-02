/**
 * Authentication Validators
 * Input validation rules matching EXACT error messages from specification
 */

const { body } = require('express-validator');
const CONSTANTS = require('../utils/constants');

/**
 * Signup Validation Rules (Section 2.2.5 of spec)
 * Every error message is EXACTLY as specified
 */
const signupValidation = [
    // Full Name validation
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: CONSTANTS.VALIDATION.NAME_MIN_LENGTH })
        .withMessage('Name must be at least 2 characters')
        .isLength({ max: CONSTANTS.VALIDATION.NAME_MAX_LENGTH })
        .withMessage('Name must not exceed 50 characters')
        .matches(CONSTANTS.VALIDATION.NAME_REGEX)
        .withMessage('Name can only contain letters and spaces'),

    // Email validation
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .isLength({ max: CONSTANTS.VALIDATION.EMAIL_MAX_LENGTH })
        .withMessage('Email must not exceed 255 characters')
        .normalizeEmail(),

    // Password validation (exact rules from spec)
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*]/)
        .withMessage('Password must contain at least one special character (!@#$%^&*)'),

    // Confirm Password validation
    body('confirmPassword')
        .notEmpty()
        .withMessage('Please confirm your password')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match'),

    // Terms checkbox validation
    body('agreedToTerms')
        .equals('true')
        .withMessage('You must agree to Terms of Service to continue'),
];

/**
 * Login Validation Rules (Section 2.1.6 of spec)
 * Exact error messages from specification
 */
const loginValidation = [
    // Email validation
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail(),

    // Password validation (no min length check on frontend - backend handles)
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
];

/**
 * Forgot Password Validation
 */
const forgotPasswordValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail(),
];

/**
 * Reset Password Validation (Section 2.3.6 of spec)
 * Same password rules as signup
 */
const resetPasswordValidation = [
    // Token validation (in URL param)
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),

    // New password validation (exact same rules as signup)
    body('newPassword')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*]/)
        .withMessage('Password must contain at least one special character (!@#$%^&*)'),

    // Confirm password validation
    body('confirmPassword')
        .notEmpty()
        .withMessage('Please confirm your password')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),
];

/**
 * Change Password Validation (Section 8.1.2 of spec)
 */
const changePasswordValidation = [
    // Current password
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),

    // New password (same rules as signup)
    body('newPassword')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*]/)
        .withMessage('Password must contain at least one special character (!@#$%^&*)'),

    // Confirm new password
    body('confirmNewPassword')
        .notEmpty()
        .withMessage('Please confirm your password')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),
];

module.exports = {
    signupValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    changePasswordValidation,
};
