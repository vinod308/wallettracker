/**
 * Dashboard Routes
 * API endpoints for dashboard data
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All dashboard routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/kpis
 * Get dashboard KPIs
 * Query params: period (this_month, last_3_months, ytd), startDate, endDate
 */
router.get(
    '/kpis',
    dashboardController.getKPIs
);

/**
 * GET /api/dashboard/client-revenue
 * Get client revenue overview with sorting and filtering
 * Query params: period, startDate, endDate, status, search, sortBy, sortOrder, limit, offset
 */
router.get(
    '/client-revenue',
    dashboardController.getClientRevenueOverview
);

/**
 * GET /api/dashboard/service-revenue-mix
 * Get service revenue mix
 * Query params: period, startDate, endDate
 */
router.get(
    '/service-revenue-mix',
    dashboardController.getServiceRevenueMix
);

/**
 * GET /api/dashboard/contracts-expiring
 * Get contracts expiring soon
 * Query params: days (30, 60, 90)
 */
router.get(
    '/contracts-expiring',
    dashboardController.getContractsExpiring
);

/**
 * GET /api/dashboard/upsell-opportunities
 * Get upsell opportunities
 * Query params: limit (default 5)
 */
router.get(
    '/upsell-opportunities',
    dashboardController.getUpsellOpportunities
);

/**
 * GET /api/dashboard/share-of-wallet
 * Get share of wallet analysis
 * Query params: clientId (optional)
 */
router.get(
    '/share-of-wallet',
    dashboardController.getShareOfWallet
);

/**
 * GET /api/dashboard/revenue-trend
 * Get revenue trend over time
 * Query params: period, startDate, endDate, groupBy (month, day)
 */
router.get(
    '/revenue-trend',
    dashboardController.getRevenueTrend
);

/**
 * GET /api/dashboard/top-clients
 * Get top revenue clients
 * Query params: limit (default 5), period, startDate, endDate
 */
router.get(
    '/top-clients',
    dashboardController.getTopRevenueClients
);

/**
 * GET /api/dashboard/invoices
 * Get invoice overview for a month (from Excel CSV data)
 * Query params: month (e.g. "July 2025")
 */
router.get(
    '/invoices',
    dashboardController.getInvoiceOverview
);

/**
 * GET /api/dashboard/monthly-overview
 * Get multi-month data for all clients (April-July 2025)
 * Returns all data in one call for client-side filtering
 */
router.get(
    '/monthly-overview',
    dashboardController.getMonthlyOverview
);

/**
 * GET /api/dashboard/summary
 * Get complete dashboard summary
 * Query params: period, startDate, endDate
 */
router.get(
    '/summary',
    dashboardController.getDashboardSummary
);

module.exports = router;
