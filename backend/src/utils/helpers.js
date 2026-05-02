/**
 * Helper Utility Functions
 * Reusable functions across the application
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');

/**
 * Generate secure random token (for password reset)
 */
const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate JWT token
 * @param {object} payload - Data to encode in token
 * @param {string} expiresIn - Token expiration (default from config)
 */
const generateJWT = (payload, expiresIn = config.JWT_EXPIRES_IN) => {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

/**
 * Format currency in Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount (e.g., ₹50,000)
 */
const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
};

/**
 * Calculate days remaining until date
 * @param {Date} endDate - Target date
 * @returns {number} Days remaining (negative if past)
 */
const daysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Validate password strength (exact rules from spec)
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, errors: string[], strength: string }
 */
const validatePasswordStrength = (password) => {
    const errors = [];
    let strength = 'Weak';

    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    // Calculate strength
    const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const characterTypes = [hasUpperLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (password.length >= 12 && characterTypes === 3) {
        strength = 'Very Strong';
    } else if (password.length >= 8 && characterTypes === 3) {
        strength = 'Strong';
    } else if (password.length >= 8 && characterTypes >= 2) {
        strength = 'Medium';
    }

    return {
        valid: errors.length === 0,
        errors,
        strength,
    };
};

/**
 * Sanitize string (remove extra whitespace, trim)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
    if (!str) return '';
    return str.trim().replace(/\s+/g, ' ');
};

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalizeWords = (str) => {
    if (!str) return '';
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Check if email is a business email (warn for personal emails)
 * @param {string} email - Email to check
 * @returns {boolean} True if business email
 */
const isBusinessEmail = (email) => {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    return !personalDomains.includes(domain);
};

/**
 * Calculate Share of Wallet percentage
 * @param {number} currentSpend - Current spend
 * @param {number} totalBudget - Estimated total budget
 * @returns {number} Percentage (0-100)
 */
const calculateShareOfWallet = (currentSpend, totalBudget) => {
    if (!totalBudget || totalBudget === 0) return 0;
    return Math.min(100, Math.round((currentSpend / totalBudget) * 100));
};

/**
 * Determine priority based on opportunity and share
 * @param {number} opportunity - Remaining opportunity amount
 * @param {number} sharePercentage - Current share of wallet percentage
 * @returns {string} 'High', 'Medium', or 'Low'
 */
const calculateUpsellPriority = (opportunity, sharePercentage) => {
    if (opportunity > 100000 && sharePercentage < 40) return 'High';
    if (opportunity >= 50000 && opportunity <= 100000) return 'Medium';
    return 'Low';
};

/**
 * Generate pagination metadata
 * @param {number} total - Total records
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 * @returns {object} Pagination metadata
 */
const getPaginationMetadata = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

/**
 * Parse date range parameter
 * @param {string} dateRange - 'This Month', 'Last 3 Months', 'YTD', or custom
 * @returns {object} { startDate, endDate }
 */
const parseDateRange = (dateRange) => {
    const now = new Date();
    let startDate, endDate = now;

    switch (dateRange) {
        case 'This Month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'Last 3 Months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
        case 'Year to Date':
        case 'YTD':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            // Default to current month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
};

/**
 * Standard success response format
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @returns {object} Formatted success response
 */
const successResponse = (message, data = {}) => {
    return {
        success: true,
        message,
        data,
    };
};

/**
 * Standard error response format
 * @param {string} message - Error message
 * @param {object} errors - Error details
 * @returns {object} Formatted error response
 */
const errorResponse = (message, errors = null) => {
    return {
        success: false,
        message,
        errors,
    };
};

module.exports = {
    generateSecureToken,
    generateJWT,
    formatCurrency,
    daysRemaining,
    validatePasswordStrength,
    sanitizeString,
    capitalizeWords,
    isBusinessEmail,
    calculateShareOfWallet,
    calculateUpsellPriority,
    getPaginationMetadata,
    parseDateRange,
    successResponse,
    errorResponse,
};
