/**
 * Wallet Service
 * API calls for wallet intelligence
 */

import api from './api';

const walletService = {
    /**
     * Get total wallet summary
     */
    async getTotalWalletSummary() {
        const response = await api.get('/wallet/summary');
        return response.data;
    },

    /**
     * Get wallet distribution
     */
    async getWalletDistribution() {
        const response = await api.get('/wallet/distribution');
        return response.data;
    },

    /**
     * Get industry breakdown
     */
    async getIndustryBreakdown() {
        const response = await api.get('/wallet/industry-breakdown');
        return response.data;
    },

    /**
     * Get expansion-ready clients
     */
    async getExpansionReadyClients(limit = 5) {
        const response = await api.get('/wallet/expansion-ready', { params: { limit } });
        return response.data;
    },

    /**
     * Get services upsell success
     */
    async getServicesUpsellSuccess() {
        const response = await api.get('/wallet/upsell-success');
        return response.data;
    },

    /**
     * Get detailed wallet analysis
     */
    async getDetailedWalletAnalysis(filters = {}) {
        const response = await api.get('/wallet/detailed-analysis', { params: filters });
        return response.data;
    },
};

export default walletService;
