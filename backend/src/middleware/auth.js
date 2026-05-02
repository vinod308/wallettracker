/**
 * Authentication Middleware
 * JWT validation and session management with 30-minute inactivity timeout
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const config = require('../config/environment');
const { AuthenticationError } = require('./errorHandler');
const logger = require('../utils/logger');
const CONSTANTS = require('../utils/constants');

/**
 * Verify JWT token and validate session
 * Implements 30-minute inactivity timeout from spec
 */
const authenticate = async (req, res, next) => {
    try {
        // Extract token from cookie or Authorization header
        const token = req.cookies?.auth_token ||
                     req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            throw new AuthenticationError('Authentication required');
        }

        // Verify JWT
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Check if session exists and is valid
        const sessionQuery = `
            SELECT s.*, u.id, u.email, u.full_name, u.role, u.status
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = $1
            AND s.expires_at > NOW()
            AND u.deleted_at IS NULL
        `;

        const { rows } = await pool.query(sessionQuery, [token]);

        if (rows.length === 0) {
            throw new AuthenticationError('Your session has expired. Please log in again.');
        }

        const session = rows[0];
        const user = {
            id: session.id,
            email: session.email,
            fullName: session.full_name,
            role: session.role,
            status: session.status,
        };

        // Check if user is active
        if (user.status !== CONSTANTS.USER_STATUS.ACTIVE) {
            throw new AuthenticationError('Your account has been suspended. Please contact support.');
        }

        // Check inactivity timeout (30 minutes from spec)
        const lastActivity = new Date(session.last_activity);
        const now = new Date();
        const inactiveMinutes = (now - lastActivity) / 1000 / 60;

        if (inactiveMinutes > config.SESSION_TIMEOUT_MINUTES) {
            // Session expired due to inactivity
            await pool.query('DELETE FROM sessions WHERE id = $1', [session.id]);
            throw new AuthenticationError('Your session has expired. Please log in again.');
        }

        // Update last_activity and expires_at
        const newExpiresAt = new Date(Date.now() + config.SESSION_TIMEOUT_MINUTES * 60 * 1000);
        await pool.query(
            'UPDATE sessions SET last_activity = NOW(), expires_at = $1 WHERE id = $2',
            [newExpiresAt, session.id]
        );

        // Attach user to request
        req.user = user;
        req.session = { id: session.id, token };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AuthenticationError('Invalid token. Please log in again.'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new AuthenticationError('Your session has expired. Please log in again.'));
        } else {
            next(error);
        }
    }
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        await authenticate(req, res, () => {});
    } catch (error) {
        // Silently continue without authentication
    }
    next();
};

module.exports = {
    authenticate,
    optionalAuth,
};
