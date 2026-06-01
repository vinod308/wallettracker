/**
 * Settings Service
 * Business logic for user settings and profile management
 */

const pool = require('../config/database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class SettingsService {
    /**
     * Get user profile
     */
    async getUserProfile(userId) {
        try {
            const query = `
                SELECT id, full_name, email, role, phone_number, department,
                       time_zone, profile_picture_url, status, created_at
                FROM users
                WHERE id = $1 AND deleted_at IS NULL
            `;

            const { rows } = await pool.query(query, [userId]);

            if (rows.length === 0) {
                throw new NotFoundError('User not found');
            }

            return rows[0];
        } catch (error) {
            logger.error(`Error getting user profile ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updates) {
        try {
            const allowedFields = ['full_name', 'phone_number', 'department', 'time_zone'];
            const fields = [];
            const values = [];
            let paramCount = 1;

            Object.entries(updates).forEach(([key, value]) => {
                if (allowedFields.includes(key)) {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                throw new ValidationError('No valid fields to update');
            }

            fields.push('updated_at = NOW()');
            values.push(userId);

            const query = `
                UPDATE users
                SET ${fields.join(', ')}
                WHERE id = $${paramCount} AND deleted_at IS NULL
                RETURNING id, full_name, email, role, phone_number, department, time_zone
            `;

            const { rows } = await pool.query(query, values);

            if (rows.length === 0) {
                throw new NotFoundError('User not found');
            }

            logger.info(`User profile updated: ${userId}`);

            return rows[0];
        } catch (error) {
            logger.error(`Error updating user profile ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            // Get current password hash
            const query = 'SELECT password_hash FROM users WHERE id = $1';
            const { rows } = await pool.query(query, [userId]);

            if (rows.length === 0) {
                throw new NotFoundError('User not found');
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
            if (!isValid) {
                throw new ValidationError('Current password is incorrect');
            }

            // Hash new password
            const newPasswordHash = await bcrypt.hash(newPassword, 12);

            // Update password
            const updateQuery = `
                UPDATE users
                SET password_hash = $1, updated_at = NOW()
                WHERE id = $2
            `;

            await pool.query(updateQuery, [newPasswordHash, userId]);

            logger.info(`Password changed for user ${userId}`);

            return { message: 'Password changed successfully' };
        } catch (error) {
            logger.error(`Error changing password for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get notification preferences
     */
    async getNotificationPreferences(userId) {
        try {
            const query = `
                SELECT * FROM notification_preferences
                WHERE user_id = $1
            `;

            const { rows } = await pool.query(query, [userId]);

            // Create default preferences if not exists
            if (rows.length === 0) {
                const insertQuery = `
                    INSERT INTO notification_preferences (user_id)
                    VALUES ($1)
                    RETURNING *
                `;
                const { rows: newRows } = await pool.query(insertQuery, [userId]);
                return newRows[0];
            }

            return rows[0];
        } catch (error) {
            logger.error(`Error getting notification preferences for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(userId, preferences) {
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            const allowedFields = [
                'email_contract_expiring',
                'email_at_risk_client',
                'email_upsell_opportunity',
                'email_frequency',
                'in_app_enabled',
                'desktop_notifications',
                'notification_sound',
            ];

            Object.entries(preferences).forEach(([key, value]) => {
                if (allowedFields.includes(key)) {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            });

            if (fields.length === 0) {
                throw new ValidationError('No valid fields to update');
            }

            fields.push('updated_at = NOW()');
            values.push(userId);

            const query = `
                UPDATE notification_preferences
                SET ${fields.join(', ')}
                WHERE user_id = $${paramCount}
                RETURNING *
            `;

            const { rows } = await pool.query(query, values);

            logger.info(`Notification preferences updated for user ${userId}`);

            return rows[0];
        } catch (error) {
            logger.error(`Error updating notification preferences for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get all users (Admin only)
     */
    async getAllUsers() {
        try {
            const query = `
                SELECT id, full_name, email, role, status, created_at, last_login_at
                FROM users
                WHERE deleted_at IS NULL
                ORDER BY created_at DESC
            `;

            const { rows } = await pool.query(query);
            return rows;
        } catch (error) {
            logger.error('Error getting all users:', error);
            throw error;
        }
    }

    /**
     * Update user role (Admin only)
     */
    async updateUserRole(userId, role) {
        try {
            const validRoles = ['Admin', 'Account Manager', 'Finance'];
            if (!validRoles.includes(role)) {
                throw new ValidationError('Invalid role');
            }

            const query = `
                UPDATE users
                SET role = $1, updated_at = NOW()
                WHERE id = $2 AND deleted_at IS NULL
                RETURNING id, full_name, email, role
            `;

            const { rows } = await pool.query(query, [role, userId]);

            if (rows.length === 0) {
                throw new NotFoundError('User not found');
            }

            logger.info(`User ${userId} role updated to ${role}`);

            return rows[0];
        } catch (error) {
            logger.error(`Error updating user role ${userId}:`, error);
            throw error;
        }
    }
    /**
     * Get company settings for a user
     */
    async getCompanySettings(userId) {
        try {
            const { rows } = await pool.query(
                `SELECT settings, is_draft, updated_at FROM company_settings WHERE user_id = $1`,
                [userId]
            );
            if (rows.length === 0) return null;
            return { ...rows[0].settings, isDraft: rows[0].is_draft, updatedAt: rows[0].updated_at };
        } catch (error) {
            logger.error(`Error getting company settings for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Save (upsert) company settings for a user
     */
    async saveCompanySettings(userId, settings, isDraft = false) {
        try {
            const { rows } = await pool.query(
                `INSERT INTO company_settings (user_id, settings, is_draft, updated_at)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (user_id) DO UPDATE
                   SET settings = $2, is_draft = $3, updated_at = NOW()
                 RETURNING settings, is_draft, updated_at`,
                [userId, JSON.stringify(settings), isDraft]
            );
            logger.info(`Company settings saved for user ${userId} (draft=${isDraft})`);
            return { ...rows[0].settings, isDraft: rows[0].is_draft, updatedAt: rows[0].updated_at };
        } catch (error) {
            logger.error(`Error saving company settings for user ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = new SettingsService();
