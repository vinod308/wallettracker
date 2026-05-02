/**
 * User Repository
 * Data access layer for users table
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class UserRepository {
    /**
     * Find user by email
     * @param {string} email
     * @returns {Promise<object|null>}
     */
    async findByEmail(email) {
        const query = `
            SELECT * FROM users
            WHERE email = $1 AND deleted_at IS NULL
        `;
        const { rows } = await pool.query(query, [email]);
        return rows[0] || null;
    }

    /**
     * Find user by ID
     * @param {number} id
     * @returns {Promise<object|null>}
     */
    async findById(id) {
        const query = `
            SELECT * FROM users
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    }

    /**
     * Create new user
     * @param {object} userData
     * @returns {Promise<object>}
     */
    async create(userData) {
        const query = `
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, full_name, email, role, status, created_at
        `;
        const values = [
            userData.fullName,
            userData.email,
            userData.passwordHash,
            userData.role || 'Account Manager',
        ];

        const { rows } = await pool.query(query, values);
        logger.info(`User created: ${rows[0].email} (ID: ${rows[0].id})`);
        return rows[0];
    }

    /**
     * Update user
     * @param {number} id
     * @param {object} updates
     * @returns {Promise<object>}
     */
    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updates).forEach(([key, value]) => {
            fields.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        });

        fields.push('updated_at = NOW()');
        values.push(id);

        const query = `
            UPDATE users
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    /**
     * Increment failed login attempts
     * @param {number} userId
     * @returns {Promise<number>} New failed_login_attempts count
     */
    async incrementFailedLoginAttempts(userId) {
        const query = `
            UPDATE users
            SET failed_login_attempts = failed_login_attempts + 1,
                updated_at = NOW()
            WHERE id = $1
            RETURNING failed_login_attempts
        `;
        const { rows } = await pool.query(query, [userId]);
        return rows[0].failed_login_attempts;
    }

    /**
     * Reset failed login attempts
     * @param {number} userId
     */
    async resetFailedLoginAttempts(userId) {
        const query = `
            UPDATE users
            SET failed_login_attempts = 0,
                account_locked_until = NULL,
                updated_at = NOW()
            WHERE id = $1
        `;
        await pool.query(query, [userId]);
    }

    /**
     * Lock user account
     * @param {number} userId
     * @param {number} minutes - Lockout duration in minutes
     */
    async lockAccount(userId, minutes = 15) {
        const lockUntil = new Date(Date.now() + minutes * 60 * 1000);
        const query = `
            UPDATE users
            SET account_locked_until = $1,
                updated_at = NOW()
            WHERE id = $2
        `;
        await pool.query(query, [lockUntil, userId]);
        logger.warn(`Account locked: User ID ${userId} until ${lockUntil}`);
    }

    /**
     * Update last login timestamp
     * @param {number} userId
     */
    async updateLastLogin(userId) {
        const query = `
            UPDATE users
            SET last_login_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
        `;
        await pool.query(query, [userId]);
    }

    /**
     * Update password
     * @param {number} userId
     * @param {string} passwordHash
     */
    async updatePassword(userId, passwordHash) {
        const query = `
            UPDATE users
            SET password_hash = $1,
                updated_at = NOW()
            WHERE id = $2
        `;
        await pool.query(query, [passwordHash, userId]);
        logger.info(`Password updated for user ID: ${userId}`);
    }

    /**
     * Check if account is locked
     * @param {object} user
     * @returns {boolean}
     */
    isAccountLocked(user) {
        if (!user.account_locked_until) return false;
        return new Date(user.account_locked_until) > new Date();
    }

    /**
     * Soft delete user
     * @param {number} userId
     */
    async softDelete(userId) {
        const query = `
            UPDATE users
            SET deleted_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
        `;
        await pool.query(query, [userId]);
        logger.info(`User soft deleted: ID ${userId}`);
    }

    /**
     * Get all users (for admin)
     * @param {object} filters
     * @returns {Promise<array>}
     */
    async findAll(filters = {}) {
        let query = `
            SELECT id, full_name, email, role, status, last_login_at, created_at
            FROM users
            WHERE deleted_at IS NULL
        `;
        const values = [];

        if (filters.role) {
            values.push(filters.role);
            query += ` AND role = $${values.length}`;
        }

        if (filters.status) {
            values.push(filters.status);
            query += ` AND status = $${values.length}`;
        }

        query += ' ORDER BY created_at DESC';

        const { rows } = await pool.query(query, values);
        return rows;
    }
}

module.exports = new UserRepository();
