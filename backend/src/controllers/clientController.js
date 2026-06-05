/**
 * Client Controller
 * HTTP handlers for client endpoints
 */

const clientService = require('../services/clientService');
const logger = require('../utils/logger');
const { successResponse, errorResponse } = require('../utils/helpers');
const { validationResult } = require('express-validator');

class ClientController {
    /**
     * GET /api/clients
     * Get all clients with filters and pagination
     */
    async getAllClients(req, res, next) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(
                    errorResponse('Validation failed', errors.array())
                );
            }

            const {
                page = 1,
                limit = 25,
                status,
                clientType,
                industry,
                search,
                sortBy = 'created_at',
                sortOrder = 'DESC',
            } = req.query;

            const filters = {
                status,
                client_type: clientType,
                industry,
                search,
                sortBy,
                sortOrder,
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
            };

            const result = await clientService.getAllClients(filters);

            logger.info(`Clients list fetched by user ${req.user.id}`);

            return res.json(
                successResponse('Clients fetched successfully', result)
            );
        } catch (error) {
            logger.error('Error in getAllClients:', error);
            next(error);
        }
    }

    /**
     * GET /api/clients/:id
     * Get single client by ID
     */
    async getClientById(req, res, next) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(
                    errorResponse('Validation failed', errors.array())
                );
            }

            const { id } = req.params;

            const client = await clientService.getClientById(parseInt(id));

            logger.info(`Client ${id} fetched by user ${req.user.id}`);

            return res.json(
                successResponse('Client fetched successfully', { client })
            );
        } catch (error) {
            logger.error(`Error in getClientById (${req.params.id}):`, error);
            next(error);
        }
    }

    /**
     * POST /api/clients
     * Create new client
     */
    async createClient(req, res, next) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(
                    errorResponse('Validation failed', errors.array())
                );
            }

            const clientData = req.body;
            const userId = req.user.id;

            const newClient = await clientService.createClient(clientData, userId);

            logger.info(`Client created by user ${userId}: ${newClient.client_name}`);

            return res.status(201).json(
                successResponse('Client created successfully!', { client: newClient })
            );
        } catch (error) {
            logger.error('Error in createClient:', error);
            next(error);
        }
    }

    /**
     * PUT /api/clients/:id
     * Update client
     */
    async updateClient(req, res, next) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(
                    errorResponse('Validation failed', errors.array())
                );
            }

            const { id } = req.params;
            const updates = req.body;
            const userId = req.user.id;

            const updatedClient = await clientService.updateClient(
                parseInt(id),
                updates,
                userId
            );

            logger.info(`Client ${id} updated by user ${userId}`);

            return res.json(
                successResponse('Client updated successfully!', { client: updatedClient })
            );
        } catch (error) {
            logger.error(`Error in updateClient (${req.params.id}):`, error);
            next(error);
        }
    }

    /**
     * DELETE /api/clients/:id
     * Delete client (soft delete)
     */
    async deleteClient(req, res, next) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(
                    errorResponse('Validation failed', errors.array())
                );
            }

            const { id } = req.params;
            const userId = req.user.id;

            const result = await clientService.deleteClient(parseInt(id), userId);

            logger.info(`Client ${id} deleted by user ${userId}`);

            return res.json(successResponse(result.message));
        } catch (error) {
            logger.error(`Error in deleteClient (${req.params.id}):`, error);
            next(error);
        }
    }

    /**
     * GET /api/clients/check-duplicate
     * Check if client name is duplicate
     */
    async checkDuplicateClientName(req, res, next) {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json(
                    errorResponse('Validation failed', errors.array())
                );
            }

            const { clientName, excludeId } = req.query;

            const result = await clientService.checkDuplicateClientName(
                clientName,
                excludeId
            );

            return res.json(
                successResponse('Duplicate check completed', result)
            );
        } catch (error) {
            logger.error('Error in checkDuplicateClientName:', error);
            next(error);
        }
    }

    /**
     * GET /api/clients/statistics
     * Get client statistics
     */
    async getClientStatistics(req, res, next) {
        try {
            const stats = await clientService.getClientStatistics();

            logger.info(`Client statistics fetched by user ${req.user.id}`);

            return res.json(
                successResponse('Statistics fetched successfully', stats)
            );
        } catch (error) {
            logger.error('Error in getClientStatistics:', error);
            next(error);
        }
    }

    /**
     * GET /api/clients/:id/monthly-analytics
     * Get client monthly analytics with per-service breakdown
     */
    async getClientMonthlyAnalytics(req, res, next) {
        try {
            const { id } = req.params;
            const result = await clientService.getClientMonthlyAnalytics(parseInt(id));

            logger.info(`Client ${id} monthly analytics fetched by user ${req.user.id}`);

            return res.json(
                successResponse('Client monthly analytics fetched successfully', result)
            );
        } catch (error) {
            logger.error(`Error in getClientMonthlyAnalytics (${req.params.id}):`, error);
            next(error);
        }
    }

    /**
     * POST /api/clients/onboard
     * Lightweight client onboard — saves basic client info from the onboarding modal.
     * Skips strict validation; idempotent (returns existing record if name matches).
     */
    async onboardClient(req, res, next) {
        try {
            const {
                clientName, clientType = 'Retainer',
                gstNumber, address, state, stateCode,
                bankName, accountNumber, ifscCode,
                contactPerson, contactEmail, mobileNumber, altContactEmail,
            } = req.body;
            if (!clientName || clientName.trim().length < 2) {
                return res.status(400).json(errorResponse('clientName is required'));
            }
            const client = await clientService.onboardClient({
                clientName: clientName.trim(), clientType,
                gstNumber, address, state, stateCode,
                bankName, accountNumber, ifscCode,
                contactPerson, contactEmail, mobileNumber, altContactEmail,
            }, req.user.id);
            return res.status(201).json(successResponse('Client onboarded', { client }));
        } catch (error) {
            logger.error('Error in onboardClient:', error);
            next(error);
        }
    }

    /**
     * PATCH /api/clients/:id/status
     * Update client status
     */
    async updateClientStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user.id;

            if (!status || !['Active', 'Inactive', 'At Risk'].includes(status)) {
                return res.status(400).json(
                    errorResponse('Invalid status. Must be Active, Inactive, or At Risk')
                );
            }

            const updatedClient = await clientService.updateClientStatus(
                parseInt(id),
                status,
                userId
            );

            logger.info(`Client ${id} status updated to ${status} by user ${userId}`);

            return res.json(
                successResponse('Client status updated successfully', { client: updatedClient })
            );
        } catch (error) {
            logger.error(`Error in updateClientStatus (${req.params.id}):`, error);
            next(error);
        }
    }
}

module.exports = new ClientController();
