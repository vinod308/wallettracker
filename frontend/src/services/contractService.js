/**
 * Contract Service
 * API calls for contract management
 */

import api from './api';

const contractService = {
    /**
     * Get all contracts
     */
    async getAllContracts(params = {}) {
        const response = await api.get('/contracts', { params });
        return response.data;
    },

    /**
     * Get contracts expiring soon
     */
    async getContractsExpiring(days = 30) {
        const response = await api.get('/contracts/expiring', { params: { days } });
        return response.data;
    },

    /**
     * Get contract statistics
     */
    async getContractStatistics() {
        const response = await api.get('/contracts/statistics');
        return response.data;
    },

    /**
     * Update renewal status
     */
    async updateRenewalStatus(id, status) {
        const response = await api.patch(`/contracts/${id}/renewal-status`, { status });
        return response.data;
    },

    /**
     * Toggle auto-renew
     */
    async toggleAutoRenew(id, autoRenew) {
        const response = await api.patch(`/contracts/${id}/auto-renew`, { autoRenew });
        return response.data;
    },

    /**
     * Renew contract
     */
    async renewContract(id, newContractData) {
        const response = await api.post(`/contracts/${id}/renew`, newContractData);
        return response.data;
    },

    /**
     * Create renewal task
     */
    async createRenewalTask(taskData) {
        const response = await api.post('/contracts/renewal-tasks', taskData);
        return response.data;
    },

    /**
     * Record churn reason
     */
    async recordChurnReason(data) {
        const response = await api.post('/contracts/churn', data);
        return response.data;
    },
};

export default contractService;
