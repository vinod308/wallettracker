/**
 * Dashboard Service
 * API calls for dashboard data
 */

import api from './api';

const dashboardService = {
    /**
     * Get dashboard KPIs
     */
    async getKPIs(params = {}) {
        const response = await api.get('/dashboard/kpis', { params });
        return response.data;
    },

    /**
     * Get client revenue overview
     */
    async getClientRevenueOverview(params = {}) {
        const response = await api.get('/dashboard/client-revenue', { params });
        return response.data;
    },

    /**
     * Get service revenue mix
     */
    async getServiceRevenueMix(params = {}) {
        const response = await api.get('/dashboard/service-revenue-mix', { params });
        return response.data;
    },

    /**
     * Get contracts expiring soon
     */
    async getContractsExpiring(days = 30) {
        const response = await api.get('/dashboard/contracts-expiring', {
            params: { days },
        });
        return response.data;
    },

    /**
     * Get upsell opportunities
     */
    async getUpsellOpportunities(limit = 5) {
        const response = await api.get('/dashboard/upsell-opportunities', {
            params: { limit },
        });
        return response.data;
    },

    /**
     * Get share of wallet
     */
    async getShareOfWallet(clientId = null) {
        const params = clientId ? { clientId } : {};
        const response = await api.get('/dashboard/share-of-wallet', { params });
        return response.data;
    },

    /**
     * Get revenue trend
     */
    async getRevenueTrend(params = {}) {
        const response = await api.get('/dashboard/revenue-trend', { params });
        return response.data;
    },

    /**
     * Get top revenue clients
     */
    async getTopRevenueClients(params = {}) {
        const response = await api.get('/dashboard/top-clients', { params });
        return response.data;
    },

    /**
     * Get invoice overview for a month
     */
    async getInvoiceOverview(month = 'July 2025') {
        const response = await api.get('/dashboard/invoices', {
            params: { month },
        });
        return response.data;
    },

    /**
     * Get multi-month overview (April-July 2025)
     * Single call returns all data for client-side filtering
     */
    async getMonthlyOverview() {
        const response = await api.get('/dashboard/monthly-overview');
        return response.data;
    },

    /**
     * Get complete dashboard summary
     */
    async getDashboardSummary(params = {}) {
        const response = await api.get('/dashboard/summary', { params });
        return response.data;
    },
};

export default dashboardService;
