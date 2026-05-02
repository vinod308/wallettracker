/**
 * Dashboard Controller
 * HTTP handlers for dashboard endpoints
 */

const dashboardService = require('../services/dashboardService');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/helpers');

class DashboardController {
    /**
     * GET /api/dashboard/kpis
     * Get dashboard KPIs (Total MRR, Revenue YTD, Active Clients, At-Risk Revenue)
     */
    async getKPIs(req, res, next) {
        try {
            const { period, startDate, endDate } = req.query;

            const dateRange = { period, startDate, endDate };
            const kpis = await dashboardService.getKPIs(dateRange);

            logger.info(`KPIs fetched for user ${req.user.id}`);

            return res.json(successResponse('KPIs fetched successfully', { kpis }));
        } catch (error) {
            logger.error('Error in getKPIs:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/client-revenue
     * Get client revenue overview with sorting and filtering
     */
    async getClientRevenueOverview(req, res, next) {
        try {
            const {
                period,
                startDate,
                endDate,
                status,
                search,
                sortBy,
                sortOrder,
                limit,
                offset,
            } = req.query;

            const filters = {
                period,
                startDate,
                endDate,
                status,
                search,
                sortBy: sortBy || 'revenue',
                sortOrder: sortOrder || 'DESC',
                limit: parseInt(limit) || 25,
                offset: parseInt(offset) || 0,
            };

            const result = await dashboardService.getClientRevenueOverview(filters);

            logger.info(`Client revenue overview fetched for user ${req.user.id}`);

            return res.json(successResponse('Client revenue data fetched successfully', result));
        } catch (error) {
            logger.error('Error in getClientRevenueOverview:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/service-revenue-mix
     * Get service revenue mix with percentages
     */
    async getServiceRevenueMix(req, res, next) {
        try {
            const { period, startDate, endDate } = req.query;

            const dateRange = { period, startDate, endDate };
            const serviceMix = await dashboardService.getServiceRevenueMix(dateRange);

            logger.info(`Service revenue mix fetched for user ${req.user.id}`);

            return res.json(successResponse('Service revenue mix fetched successfully', {
                services: serviceMix,
            }));
        } catch (error) {
            logger.error('Error in getServiceRevenueMix:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/contracts-expiring
     * Get contracts expiring soon (30/60/90 days)
     */
    async getContractsExpiring(req, res, next) {
        try {
            const { days } = req.query;

            const daysNumber = parseInt(days) || 30;
            const contracts = await dashboardService.getContractsExpiring(daysNumber);

            logger.info(`Contracts expiring in ${daysNumber} days fetched for user ${req.user.id}`);

            return res.json(successResponse('Expiring contracts fetched successfully', {
                contracts,
                count: contracts.length,
            }));
        } catch (error) {
            logger.error('Error in getContractsExpiring:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/upsell-opportunities
     * Get top upsell opportunities
     */
    async getUpsellOpportunities(req, res, next) {
        try {
            const { limit } = req.query;

            const limitNumber = parseInt(limit) || 5;
            const opportunities = await dashboardService.getUpsellOpportunities(limitNumber);

            logger.info(`Upsell opportunities fetched for user ${req.user.id}`);

            return res.json(successResponse('Upsell opportunities fetched successfully', {
                opportunities,
                count: opportunities.length,
            }));
        } catch (error) {
            logger.error('Error in getUpsellOpportunities:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/share-of-wallet
     * Get share of wallet analysis
     */
    async getShareOfWallet(req, res, next) {
        try {
            const { clientId } = req.query;

            const walletData = await dashboardService.getShareOfWallet(clientId || null);

            logger.info(`Share of wallet fetched for user ${req.user.id}`);

            return res.json(successResponse('Share of wallet data fetched successfully', {
                clients: walletData,
            }));
        } catch (error) {
            logger.error('Error in getShareOfWallet:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/revenue-trend
     * Get revenue trend over time
     */
    async getRevenueTrend(req, res, next) {
        try {
            const { period, startDate, endDate, groupBy } = req.query;

            const dateRange = { period, startDate, endDate };
            const groupByValue = groupBy || 'month';

            const trend = await dashboardService.getRevenueTrend(dateRange, groupByValue);

            logger.info(`Revenue trend fetched for user ${req.user.id}`);

            return res.json(successResponse('Revenue trend fetched successfully', {
                trend,
            }));
        } catch (error) {
            logger.error('Error in getRevenueTrend:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/top-clients
     * Get top revenue clients
     */
    async getTopRevenueClients(req, res, next) {
        try {
            const { limit, period, startDate, endDate } = req.query;

            const limitNumber = parseInt(limit) || 5;
            const dateRange = { period, startDate, endDate };

            const clients = await dashboardService.getTopRevenueClients(limitNumber, dateRange);

            logger.info(`Top revenue clients fetched for user ${req.user.id}`);

            return res.json(successResponse('Top clients fetched successfully', {
                clients,
            }));
        } catch (error) {
            logger.error('Error in getTopRevenueClients:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/invoices
     * Get invoice overview for a specific month (from Excel CSV data)
     */
    async getInvoiceOverview(req, res, next) {
        try {
            const { month } = req.query;

            const invoiceMonth = month || 'July 2025';
            const result = await dashboardService.getInvoiceOverview(invoiceMonth);

            logger.info(`Invoice overview for ${invoiceMonth} fetched for user ${req.user.id}`);

            return res.json(successResponse('Invoice overview fetched successfully', result));
        } catch (error) {
            logger.error('Error in getInvoiceOverview:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/monthly-overview
     * Get multi-month data for all clients (April-July 2025)
     * Single call returns everything for client-side filtering
     */
    async getMonthlyOverview(req, res, next) {
        try {
            const result = await dashboardService.getMonthlyOverview();

            logger.info(`Monthly overview fetched for user ${req.user.id}`);

            return res.json(successResponse('Monthly overview fetched successfully', result));
        } catch (error) {
            logger.error('Error in getMonthlyOverview:', error);
            next(error);
        }
    }

    /**
     * GET /api/dashboard/summary
     * Get complete dashboard summary (all widgets)
     */
    async getDashboardSummary(req, res, next) {
        try {
            const { period, startDate, endDate } = req.query;

            const filters = { period, startDate, endDate };
            const summary = await dashboardService.getDashboardSummary(filters);

            logger.info(`Dashboard summary fetched for user ${req.user.id}`);

            return res.json(successResponse('Dashboard summary fetched successfully', summary));
        } catch (error) {
            logger.error('Error in getDashboardSummary:', error);
            next(error);
        }
    }
}

module.exports = new DashboardController();
