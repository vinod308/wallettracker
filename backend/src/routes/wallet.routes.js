/**
 * Wallet Routes
 * API endpoints for wallet intelligence
 */

const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

// All wallet routes require authentication
router.use(authenticate);

/**
 * GET /api/wallet/summary
 * Get total wallet summary
 */
router.get('/summary', walletController.getTotalWalletSummary);

/**
 * GET /api/wallet/distribution
 * Get wallet distribution by client
 */
router.get('/distribution', walletController.getWalletDistribution);

/**
 * GET /api/wallet/industry-breakdown
 * Get industry-wise breakdown
 */
router.get('/industry-breakdown', walletController.getIndustryBreakdown);

/**
 * GET /api/wallet/expansion-ready
 * Get top expansion-ready clients
 */
router.get('/expansion-ready', walletController.getExpansionReadyClients);

/**
 * GET /api/wallet/upsell-success
 * Get services with highest upsell success
 */
router.get('/upsell-success', walletController.getServicesUpsellSuccess);

/**
 * GET /api/wallet/detailed-analysis
 * Get detailed wallet analysis with filters
 */
router.get('/detailed-analysis', walletController.getDetailedWalletAnalysis);

module.exports = router;
