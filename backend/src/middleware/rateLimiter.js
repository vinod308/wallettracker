/**
 * Rate Limiting Middleware
 * Implements exact rate limiting rules from specification
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/environment');

// Login Rate Limiter (exact from spec: 5 attempts per 15 minutes)
const loginLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
    max: config.RATE_LIMIT_MAX_REQUESTS, // 5 requests
    message: {
        success: false,
        error: {
            message: 'Too many login attempts. Please try again in 15 minutes',
            code: 'RATE_LIMIT_EXCEEDED',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Only count failed attempts
    keyGenerator: (req) => {
        // Rate limit by IP + email combination
        return `${req.ip}-${req.body.email || ''}`;
    },
});

// Password Reset Rate Limiter (max 3 requests per hour per email)
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
        success: false,
        error: {
            message: 'Too many password reset attempts. Please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        },
    },
    keyGenerator: (req) => {
        return `password-reset-${req.body.email || req.ip}`;
    },
});

// General API Rate Limiter (prevent abuse)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
        success: false,
        error: {
            message: 'Too many requests. Please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        },
    },
});

// Signup Rate Limiter
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 signup attempts per hour per IP
    message: {
        success: false,
        error: {
            message: 'Too many signup attempts. Please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        },
    },
});

module.exports = {
    loginLimiter,
    passwordResetLimiter,
    apiLimiter,
    signupLimiter,
};
