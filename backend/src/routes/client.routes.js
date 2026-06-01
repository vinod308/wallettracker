/**
 * Client Routes
 * API endpoints for client management
 */

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const clientValidators = require('../validators/clientValidators');
const { authenticate } = require('../middleware/auth');
const { requireRole }  = require('../middleware/rbac');
const planLimiter      = require('../middleware/planLimiter');

// All client routes require authentication
router.use(authenticate);

/**
 * GET /api/clients
 * Get all clients with filters and pagination
 */
router.get(
    '/',
    clientValidators.listClients,
    clientController.getAllClients
);

/**
 * POST /api/clients/onboard
 * Lightweight onboard from modal — no strict validation, idempotent.
 * Must be before /:id route to avoid conflict.
 */
router.post('/onboard', clientController.onboardClient);

/**
 * GET /api/clients/check-duplicate
 * Check if client name is duplicate
 * Must be before /:id route to avoid conflict
 */
router.get(
    '/check-duplicate',
    clientValidators.checkDuplicateClientName,
    clientController.checkDuplicateClientName
);

/**
 * GET /api/clients/statistics
 * Get client statistics
 */
router.get(
    '/statistics',
    clientController.getClientStatistics
);

/**
 * GET /api/clients/:id/monthly-analytics
 * Get client monthly analytics with per-service breakdown
 */
router.get(
    '/:id/monthly-analytics',
    clientController.getClientMonthlyAnalytics
);

/**
 * GET /api/clients/:id
 * Get single client by ID
 */
router.get(
    '/:id',
    clientValidators.getClient,
    clientController.getClientById
);

/**
 * POST /api/clients
 * Create new client
 * Requires Account Manager or Admin role
 */
router.post(
    '/',
    requireRole(['Admin', 'Account Manager']),
    planLimiter('client'),
    clientValidators.createClient,
    clientController.createClient
);

/**
 * PUT /api/clients/:id
 * Update client
 * Requires Account Manager or Admin role
 */
router.put(
    '/:id',
    requireRole(['Admin', 'Account Manager']),
    clientValidators.updateClient,
    clientController.updateClient
);

/**
 * PATCH /api/clients/:id/status
 * Update client status
 * Requires Account Manager or Admin role
 */
router.patch(
    '/:id/status',
    requireRole(['Admin', 'Account Manager']),
    clientController.updateClientStatus
);

/**
 * DELETE /api/clients/:id
 * Delete client (soft delete)
 * Requires Admin role only
 */
router.delete(
    '/:id',
    requireRole(['Admin']),
    clientValidators.deleteClient,
    clientController.deleteClient
);

module.exports = router;
