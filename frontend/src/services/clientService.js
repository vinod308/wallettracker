/**
 * Client Service
 * API calls for client management
 */

import api from './api';

const clientService = {
    /**
     * Get all clients with filters
     */
    async getAllClients(params = {}) {
        const response = await api.get('/clients', { params });
        return response.data;
    },

    /**
     * Get single client by ID
     */
    async getClientById(id) {
        const response = await api.get(`/clients/${id}`);
        return response.data;
    },

    /**
     * Get client monthly analytics (per-month, per-service breakdown)
     */
    async getClientMonthlyAnalytics(id) {
        const response = await api.get(`/clients/${id}/monthly-analytics`);
        return response.data;
    },

    /**
     * Create new client
     */
    async createClient(clientData) {
        const response = await api.post('/clients', clientData);
        return response.data;
    },

    /**
     * Update client
     */
    async updateClient(id, updates) {
        const response = await api.put(`/clients/${id}`, updates);
        return response.data;
    },

    /**
     * Delete client
     */
    async deleteClient(id) {
        const response = await api.delete(`/clients/${id}`);
        return response.data;
    },

    /**
     * Check if client name is duplicate
     */
    async checkDuplicateClientName(clientName, excludeId = null) {
        const params = { clientName };
        if (excludeId) params.excludeId = excludeId;

        const response = await api.get('/clients/check-duplicate', { params });
        return response.data;
    },

    /**
     * Get client statistics
     */
    async getClientStatistics() {
        const response = await api.get('/clients/statistics');
        return response.data;
    },

    /**
     * Update client status
     */
    async updateClientStatus(id, status) {
        const response = await api.patch(`/clients/${id}/status`, { status });
        return response.data;
    },

    /**
     * Get all services (for dropdown)
     */
    async getAllServices() {
        // This will need to be implemented in Phase D
        // For now, return mock data matching the seeded services
        return {
            success: true,
            data: {
                services: [
                    { id: 1, name: 'Social Media', category: 'Marketing' },
                    { id: 2, name: 'Performance Marketing', category: 'Marketing' },
                    { id: 3, name: 'SEO', category: 'Marketing' },
                    { id: 4, name: 'Design', category: 'Creative' },
                    { id: 5, name: 'Web Development', category: 'Technology' },
                    { id: 6, name: 'Analytics', category: 'Data' },
                    { id: 7, name: 'Content Marketing', category: 'Marketing' },
                    { id: 8, name: 'Paid Ads', category: 'Marketing' },
                    { id: 9, name: 'Maintenance', category: 'Technology' },
                ],
            },
        };
    },
};

export default clientService;
