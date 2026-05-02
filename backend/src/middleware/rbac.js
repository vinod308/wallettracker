/**
 * Role-Based Access Control (RBAC) Middleware
 * Implements permission checks based on user roles
 */

const { AuthorizationError } = require('./errorHandler');
const CONSTANTS = require('../utils/constants');

/**
 * Require specific role(s) to access route
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthorizationError('Authentication required'));
        }

        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(req.user.role)) {
            return next(new AuthorizationError(
                'You don\'t have permission to access this resource'
            ));
        }

        next();
    };
};

/**
 * Require Admin role
 */
const requireAdmin = requireRole(CONSTANTS.USER_ROLES.ADMIN);

/**
 * Require Account Manager or Admin role
 */
const requireAccountManager = requireRole([
    CONSTANTS.USER_ROLES.ADMIN,
    CONSTANTS.USER_ROLES.ACCOUNT_MANAGER,
]);

/**
 * Require Finance or Admin role
 */
const requireFinance = requireRole([
    CONSTANTS.USER_ROLES.ADMIN,
    CONSTANTS.USER_ROLES.FINANCE,
]);

/**
 * Check if user owns the resource or is admin
 * @param {string} userIdField - Field name containing owner user ID (e.g., 'created_by', 'user_id')
 */
const requireOwnershipOrAdmin = (userIdField = 'user_id') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthorizationError('Authentication required'));
        }

        // Admins can access anything
        if (req.user.role === CONSTANTS.USER_ROLES.ADMIN) {
            return next();
        }

        // Check ownership based on resource
        const resourceUserId = req.resource?.[userIdField] ||
                              req.params[userIdField] ||
                              req.body[userIdField];

        if (resourceUserId && parseInt(resourceUserId) === req.user.id) {
            return next();
        }

        return next(new AuthorizationError(
            'You don\'t have permission to modify this resource'
        ));
    };
};

module.exports = {
    requireRole,
    requireAdmin,
    requireAccountManager,
    requireFinance,
    requireOwnershipOrAdmin,
};
