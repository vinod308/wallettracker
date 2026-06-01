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

    /**
     * Get company settings from the server (source of truth across all browsers/devices)
     */
    async getCompanySettings() {
        const response = await api.get('/settings/company');
        return response.data?.data?.settings || null;
    },

    /**
     * Save company settings to the server and update localStorage cache
     */
    async saveCompanySettings(settings, isDraft = false) {
        const response = await api.put('/settings/company', { settings, isDraft });
        const saved = response.data?.data?.settings || settings;
        localStorage.setItem('gw_settings', JSON.stringify(saved));
        return saved;
    },
};

export default settingsService;
