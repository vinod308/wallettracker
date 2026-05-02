/**
 * Contract Routes
 * API endpoints for contract management
 */

const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// All contract routes require authentication
router.use(authenticate);

/**
 * GET /api/contracts
 * Get all contracts with filters
 */
router.get('/', contractController.getAllContracts);

/**
 * GET /api/contracts/expiring
 * Get contracts expiring soon
 */
router.get('/expiring', contractController.getContractsExpiring);

/**
 * GET /api/contracts/statistics
 * Get contract statistics
 */
router.get('/statistics', contractController.getContractStatistics);

/**
 * GET /api/contracts/requiring-action
 * Get contracts requiring action
 */
router.get('/requiring-action', contractController.getContractsRequiringAction);

/**
 * GET /api/contracts/:id
 * Get contract by ID
 */
router.get('/:id', contractController.getContractById);

/**
 * PATCH /api/contracts/:id/renewal-status
 * Update renewal status
 * Requires Account Manager or Admin
 */
router.patch(
    '/:id/renewal-status',
    requireRole(['Admin', 'Account Manager']),
    contractController.updateRenewalStatus
);

/**
 * PATCH /api/contracts/:id/auto-renew
 * Toggle auto-renew
 * Requires Account Manager or Admin
 */
router.patch(
    '/:id/auto-renew',
    requireRole(['Admin', 'Account Manager']),
    contractController.toggleAutoRenew
);

/**
 * POST /api/contracts/:id/renew
 * Renew contract
 * Requires Account Manager or Admin
 */
router.post(
    '/:id/renew',
    requireRole(['Admin', 'Account Manager']),
    contractController.renewContract
);

/**
 * POST /api/contracts/renewal-tasks
 * Create renewal task
 * Requires Account Manager or Admin
 */
router.post(
    '/renewal-tasks',
    requireRole(['Admin', 'Account Manager']),
    contractController.createRenewalTask
);

/**
 * POST /api/contracts/churn
 * Record churn reason
 * Requires Account Manager or Admin
 */
router.post(
    '/churn',
    requireRole(['Admin', 'Account Manager']),
    contractController.recordChurnReason
);

module.exports = router;
