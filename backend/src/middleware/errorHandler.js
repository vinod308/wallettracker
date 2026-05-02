/**
 * Centralized Error Handling Middleware
 * Production-grade error handling with exact error messages from spec
 */

const logger = require('../utils/logger');

// Custom Error Classes
class AppError extends Error {
    constructor(message, statusCode, code = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT');
    }
}

// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    // Log error
    logger.error(`Error: ${error.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
    });

    // PostgreSQL errors
    if (err.code === '23505') {
        // Unique constraint violation
        const field = err.detail?.match(/Key \((.+?)\)/)?.[1] || 'field';
        error = new ConflictError(`A record with this ${field} already exists`);
    }

    if (err.code === '23503') {
        // Foreign key violation
        error = new ValidationError('Invalid reference to related record');
    }

    if (err.code === '22P02') {
        // Invalid input syntax
        error = new ValidationError('Invalid data format');
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AuthenticationError('Invalid token. Please log in again.');
    }

    if (err.name === 'TokenExpiredError') {
        error = new AuthenticationError('Your session has expired. Please log in again.');
    }

    // Validation errors (express-validator)
    if (err.errors && Array.isArray(err.errors)) {
        error = new ValidationError('Validation failed', err.errors);
    }

    // Development vs Production response
    const response = {
        success: false,
        error: {
            message: error.message,
            code: error.code,
        },
    };

    // Include validation errors
    if (error.errors) {
        response.error.errors = error.errors;
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.error.stack = err.stack;
    }

    res.status(error.statusCode).json(response);
};

// 404 Handler
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};

// Async Handler Wrapper (eliminates try-catch in controllers)
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
};
