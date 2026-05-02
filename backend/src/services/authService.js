/**
 * Authentication Service
 * Core business logic for authentication flows
 * Implements exact workflows from specification document
 */

const bcrypt = require('bcrypt');
const pool = require('../config/database');
const config = require('../config/environment');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');
const { generateSecureToken, generateJWT, validatePasswordStrength } = require('../utils/helpers');
const { AuthenticationError, ConflictError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const CONSTANTS = require('../utils/constants');

class AuthService {
    /**
     * Signup - Create new user account
     * Implements exact signup flow from specification
     * @param {object} userData - { fullName, email, password, confirmPassword }
     * @returns {Promise<object>} { user, token }
     */
    async signup(userData) {
        const { fullName, email, password, confirmPassword } = userData;

        // Check if passwords match (exact message from spec)
        if (password !== confirmPassword) {
            throw new ValidationError('Passwords do not match');
        }

        // Validate password strength (exact rules from spec)
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            throw new ValidationError('Password validation failed', passwordValidation.errors.map(msg => ({
                field: 'password',
                message: msg,
            })));
        }

        // Check if email already exists (exact message from spec)
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new ConflictError('This email is already registered');
        }

        // Hash password (12 rounds as per spec)
        const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

        // Create user (default role: Account Manager from spec)
        const user = await userRepository.create({
            fullName,
            email,
            passwordHash,
            role: CONSTANTS.USER_ROLES.ACCOUNT_MANAGER,
        });

        // Create default notification preferences
        await this.createDefaultNotificationPreferences(user.id);

        // Generate JWT token
        const token = generateJWT({ userId: user.id, email: user.email });

        // Create session
        const session = await this.createSession(user.id, token);

        // Return user without sensitive data
        const { password_hash, ...userWithoutPassword } = user;

        logger.info(`User signup successful: ${email}`);

        return {
            user: userWithoutPassword,
            token,
            session,
        };
    }

    /**
     * Login - Authenticate user
     * Implements exact login flow with 5-attempt lockout from specification
     * @param {object} credentials - { email, password }
     * @param {object} metadata - { ipAddress, userAgent }
     * @returns {Promise<object>} { user, token }
     */
    async login(credentials, metadata = {}) {
        const { email, password } = credentials;

        // Find user by email
        const user = await userRepository.findByEmail(email);

        // If user doesn't exist, return generic error (security best practice from spec)
        if (!user) {
            throw new AuthenticationError('The email or password you entered is incorrect. Please try again.');
        }

        // Check if account is locked (exact from spec: 15 minutes after 5th failure)
        if (userRepository.isAccountLocked(user)) {
            const lockUntil = new Date(user.account_locked_until);
            const minutesRemaining = Math.ceil((lockUntil - new Date()) / 1000 / 60);

            throw new AuthenticationError(
                `Your account has been temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minutes or reset your password.`
            );
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            // Increment failed login attempts
            const failedAttempts = await userRepository.incrementFailedLoginAttempts(user.id);

            logger.warn(`Failed login attempt for ${email}. Attempts: ${failedAttempts}`);

            // Lock account after 5 failures (exact from spec)
            if (failedAttempts >= CONSTANTS.SECURITY.MAX_LOGIN_ATTEMPTS) {
                await userRepository.lockAccount(user.id, CONSTANTS.SECURITY.LOCKOUT_DURATION_MINUTES);

                throw new AuthenticationError(
                    'Your account has been temporarily locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.'
                );
            }

            // Generic error message (exact from spec)
            throw new AuthenticationError('The email or password you entered is incorrect. Please try again.');
        }

        // Check if user account is active
        if (user.status !== CONSTANTS.USER_STATUS.ACTIVE) {
            throw new AuthenticationError('Your account has been suspended. Please contact support.');
        }

        // Successful login - reset failed attempts
        await userRepository.resetFailedLoginAttempts(user.id);
        await userRepository.updateLastLogin(user.id);

        // Generate JWT token
        const token = generateJWT({ userId: user.id, email: user.email });

        // Create session with 30-minute timeout (exact from spec)
        const session = await this.createSession(user.id, token, metadata);

        // Return user without sensitive data
        const { password_hash, failed_login_attempts, account_locked_until, ...userWithoutPassword } = user;

        logger.info(`User login successful: ${email}`);

        return {
            user: userWithoutPassword,
            token,
            session,
        };
    }

    /**
     * Logout - Destroy user session
     * @param {string} token - Session token
     */
    async logout(token) {
        const query = 'DELETE FROM sessions WHERE token = $1';
        await pool.query(query, [token]);
        logger.info('User logged out');
    }

    /**
     * Forgot Password - Send reset link
     * Implements exact forgot password flow from specification
     * @param {string} email
     * @returns {Promise<object>} Success message (same for security)
     */
    async forgotPassword(email) {
        // Find user
        const user = await userRepository.findByEmail(email);

        // For security: always show success message (exact from spec)
        const successMessage = {
            message: 'Password reset link has been sent to your email',
            subMessage: 'Please check your inbox and spam folder',
        };

        // If user doesn't exist, still return success (prevents email enumeration)
        if (!user) {
            logger.info(`Password reset requested for non-existent email: ${email}`);
            return successMessage;
        }

        // Generate secure token (1-hour expiry from spec)
        const token = generateSecureToken();
        const expiresAt = new Date(Date.now() + CONSTANTS.SECURITY.PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        // Invalidate any existing tokens for this user
        await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL', [user.id]);

        // Store token
        const query = `
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES ($1, $2, $3)
        `;
        await pool.query(query, [user.id, token, expiresAt]);

        // Send email (exact format from spec)
        await emailService.sendPasswordResetEmail(user, token);

        logger.info(`Password reset token generated for: ${email}`);

        return successMessage;
    }

    /**
     * Reset Password - Update password with token
     * Implements exact reset password flow from specification
     * @param {string} token - Reset token from email
     * @param {string} newPassword
     * @param {string} confirmPassword
     */
    async resetPassword(token, newPassword, confirmPassword) {
        // Check if passwords match (exact message from spec)
        if (newPassword !== confirmPassword) {
            throw new ValidationError('Passwords do not match');
        }

        // Validate password strength (exact rules from spec)
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            throw new ValidationError('Password validation failed', passwordValidation.errors.map(msg => ({
                field: 'password',
                message: msg,
            })));
        }

        // Find token
        const query = `
            SELECT * FROM password_reset_tokens
            WHERE token = $1
        `;
        const { rows } = await pool.query(query, [token]);
        const resetToken = rows[0];

        // Check if token exists (exact message from spec)
        if (!resetToken) {
            throw new AuthenticationError('This password reset link has expired or is invalid');
        }

        // Check if token already used (exact message from spec)
        if (resetToken.used_at) {
            throw new AuthenticationError('This password reset link has already been used');
        }

        // Check if token expired (1 hour from spec)
        if (new Date(resetToken.expires_at) < new Date()) {
            throw new AuthenticationError('This password reset link has expired or is invalid');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

        // Update password
        await userRepository.updatePassword(resetToken.user_id, passwordHash);

        // Mark token as used (single-use from spec)
        await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [resetToken.id]);

        // Reset failed login attempts and unlock account
        await userRepository.resetFailedLoginAttempts(resetToken.user_id);

        // Invalidate all existing sessions (force re-login)
        await pool.query('DELETE FROM sessions WHERE user_id = $1', [resetToken.user_id]);

        logger.info(`Password reset successful for user ID: ${resetToken.user_id}`);

        return {
            message: 'Password reset successful!',
            subMessage: 'You can now log in with your new password',
        };
    }

    /**
     * Verify Session - Check if session is valid
     * @param {string} token
     * @returns {Promise<object>} User data
     */
    async verifySession(token) {
        const query = `
            SELECT s.*, u.id, u.email, u.full_name, u.role, u.status
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = $1
            AND s.expires_at > NOW()
            AND u.deleted_at IS NULL
        `;

        const { rows } = await pool.query(query, [token]);

        if (rows.length === 0) {
            throw new AuthenticationError('Your session has expired. Please log in again.');
        }

        const session = rows[0];

        return {
            id: session.id,
            email: session.email,
            fullName: session.full_name,
            role: session.role,
            status: session.status,
        };
    }

    /**
     * Create Session
     * @param {number} userId
     * @param {string} token
     * @param {object} metadata - { ipAddress, userAgent }
     * @returns {Promise<object>} Session data
     */
    async createSession(userId, token, metadata = {}) {
        const expiresAt = new Date(Date.now() + config.SESSION_TIMEOUT_MINUTES * 60 * 1000);

        const query = `
            INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, user_id, expires_at, created_at
        `;

        const { rows } = await pool.query(query, [
            userId,
            token,
            expiresAt,
            metadata.ipAddress || null,
            metadata.userAgent || null,
        ]);

        return rows[0];
    }

    /**
     * Create default notification preferences for new user
     * @param {number} userId
     */
    async createDefaultNotificationPreferences(userId) {
        const query = `
            INSERT INTO notification_preferences (user_id)
            VALUES ($1)
        `;
        await pool.query(query, [userId]);
    }

    /**
     * Change Password (for authenticated users)
     * @param {number} userId
     * @param {string} currentPassword
     * @param {string} newPassword
     * @param {string} confirmNewPassword
     */
    async changePassword(userId, currentPassword, newPassword, confirmNewPassword) {
        // Get user
        const user = await userRepository.findById(userId);

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            throw new AuthenticationError('Current password is incorrect');
        }

        // Check if new passwords match
        if (newPassword !== confirmNewPassword) {
            throw new ValidationError('Passwords do not match');
        }

        // Validate new password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            throw new ValidationError('Password validation failed', passwordValidation.errors.map(msg => ({
                field: 'password',
                message: msg,
            })));
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

        // Update password
        await userRepository.updatePassword(userId, passwordHash);

        // Invalidate all other sessions (keep current session)
        // This is implied from spec: "User logged out from all devices except current"
        const currentTokenQuery = 'SELECT token FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1';
        const { rows: currentTokenRows } = await pool.query(currentTokenQuery, [userId]);
        const currentToken = currentTokenRows[0]?.token;

        if (currentToken) {
            await pool.query('DELETE FROM sessions WHERE user_id = $1 AND token != $2', [userId, currentToken]);
        }

        logger.info(`Password changed for user ID: ${userId}`);

        return {
            message: 'Password updated successfully',
        };
    }
}

module.exports = new AuthService();
