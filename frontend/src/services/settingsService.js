/**
 * Settings Service
 * API client for settings endpoints
 */

import api from './api';

const settingsService = {
    /**
     * Get user profile
     */
    async getUserProfile() {
        const response = await api.get('/settings/profile');
        return response.data;
    },

    /**
     * Update user profile
     */
    async updateUserProfile(profileData) {
        const response = await api.put('/settings/profile', profileData);
        return response.data;
    },

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        const response = await api.put('/settings/password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },

    /**
     * Get notification preferences
     */
    async getNotificationPreferences() {
        const response = await api.get('/settings/notifications');
        return response.data;
    },

    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(preferences) {
        const response = await api.put('/settings/notifications', preferences);
        return response.data;
    },

    /**
     * Get all users (Admin only)
     */
    async getAllUsers() {
        const response = await api.get('/settings/users');
        return response.data;
    },

    /**
     * Update user role (Admin only)
     */
    async updateUserRole(userId, role) {
        const response = await api.put(`/settings/users/${userId}/role`, { role });
        return response.data;
    },
};

export default settingsService;
