/**
 * Settings Routes
 * API endpoints for user settings and profile management
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All settings routes require authentication
router.use(authenticate);

/**
 * GET /api/settings/profile
 * Get user profile
 */
router.get('/profile', settingsController.getUserProfile);

/**
 * PUT /api/settings/profile
 * Update user profile
 */
router.put('/profile', settingsController.updateUserProfile);

/**
 * PUT /api/settings/password
 * Change password
 */
router.put('/password', settingsController.changePassword);

/**
 * GET /api/settings/notifications
 * Get notification preferences
 */
router.get('/notifications', settingsController.getNotificationPreferences);

/**
 * PUT /api/settings/notifications
 * Update notification preferences
 */
router.put('/notifications', settingsController.updateNotificationPreferences);

/**
 * GET /api/settings/users
 * Get all users (Admin only)
 */
router.get('/users', requireRole(['Admin']), settingsController.getAllUsers);

/**
 * PUT /api/settings/users/:id/role
 * Update user role (Admin only)
 */
router.put('/users/:id/role', requireRole(['Admin']), settingsController.updateUserRole);

module.exports = router;
