/**
 * Validation Middleware
 * Processes express-validator results
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

/**
 * Check validation results and return formatted errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value,
        }));

        return next(new ValidationError('Validation failed', formattedErrors));
    }

    next();
};

module.exports = validate;
