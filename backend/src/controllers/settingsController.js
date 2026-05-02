/**
 * Settings Controller
 * HTTP handlers for settings endpoints
 */

const settingsService = require('../services/settingsService');
const logger = require('../utils/logger');
const { successResponse } = require('../utils/helpers');

class SettingsController {
    /**
     * GET /api/settings/profile
     * Get user profile
     */
    async getUserProfile(req, res, next) {
        try {
            const profile = await settingsService.getUserProfile(req.user.id);
            return res.json(successResponse('Profile fetched successfully', { profile }));
        } catch (error) {
            logger.error('Error in getUserProfile:', error);
            next(error);
        }
    }

    /**
     * PUT /api/settings/profile
     * Update user profile
     */
    async updateUserProfile(req, res, next) {
        try {
            const updates = req.body;
            const profile = await settingsService.updateUserProfile(req.user.id, updates);
            return res.json(successResponse('Profile updated successfully', { profile }));
        } catch (error) {
            logger.error('Error in updateUserProfile:', error);
            next(error);
        }
    }

    /**
     * PUT /api/settings/password
     * Change password
     */
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Current password and new password are required' });
            }

            const result = await settingsService.changePassword(req.user.id, currentPassword, newPassword);
            return res.json(successResponse(result.message));
        } catch (error) {
            logger.error('Error in changePassword:', error);
            next(error);
        }
    }

    /**
     * GET /api/settings/notifications
     * Get notification preferences
     */
    async getNotificationPreferences(req, res, next) {
        try {
            const preferences = await settingsService.getNotificationPreferences(req.user.id);
            return res.json(successResponse('Notification preferences fetched successfully', { preferences }));
        } catch (error) {
            logger.error('Error in getNotificationPreferences:', error);
            next(error);
        }
    }

    /**
     * PUT /api/settings/notifications
     * Update notification preferences
     */
    async updateNotificationPreferences(req, res, next) {
        try {
            const preferences = req.body;
            const updated = await settingsService.updateNotificationPreferences(req.user.id, preferences);
            return res.json(successResponse('Notification preferences updated successfully', { preferences: updated }));
        } catch (error) {
            logger.error('Error in updateNotificationPreferences:', error);
            next(error);
        }
    }

    /**
     * GET /api/settings/users
     * Get all users (Admin only)
     */
    async getAllUsers(req, res, next) {
        try {
            const users = await settingsService.getAllUsers();
            return res.json(successResponse('Users fetched successfully', { users }));
        } catch (error) {
            logger.error('Error in getAllUsers:', error);
            next(error);
        }
    }

    /**
     * PUT /api/settings/users/:id/role
     * Update user role (Admin only)
     */
    async updateUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            const user = await settingsService.updateUserRole(parseInt(id), role);
            return res.json(successResponse('User role updated successfully', { user }));
        } catch (error) {
            logger.error('Error in updateUserRole:', error);
            next(error);
        }
    }
}

module.exports = new SettingsController();
