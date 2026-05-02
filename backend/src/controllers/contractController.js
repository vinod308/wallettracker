/**
 * Contract Controller
 * HTTP handlers for contract endpoints
 */

const contractService = require('../services/contractService');
const logger = require('../utils/logger');
const { successResponse } = require('../utils/helpers');

class ContractController {
    /**
     * GET /api/contracts
     * Get all contracts with filters
     */
    async getAllContracts(req, res, next) {
        try {
            const { days, status, renewalStatus, assignedTo } = req.query;
            const filters = {
                daysUntilExpiry: days ? parseInt(days) : undefined,
                status,
                renewalStatus,
                assignedTo: assignedTo ? parseInt(assignedTo) : undefined,
            };

            const contracts = await contractService.getAllContracts(filters);
            logger.info(`Contracts fetched by user ${req.user.id}`);
            return res.json(successResponse('Contracts fetched successfully', { contracts }));
        } catch (error) {
            logger.error('Error in getAllContracts:', error);
            next(error);
        }
    }

    /**
     * GET /api/contracts/:id
     * Get contract by ID
     */
    async getContractById(req, res, next) {
        try {
            const { id } = req.params;
            const contract = await contractService.getContractById(parseInt(id));
            logger.info(`Contract ${id} fetched by user ${req.user.id}`);
            return res.json(successResponse('Contract fetched successfully', { contract }));
        } catch (error) {
            logger.error(`Error in getContractById:`, error);
            next(error);
        }
    }

    /**
     * GET /api/contracts/expiring
     * Get contracts expiring soon
     */
    async getContractsExpiring(req, res, next) {
        try {
            const { days = 30 } = req.query;
            const contracts = await contractService.getContractsExpiring(parseInt(days));
            logger.info(`Expiring contracts fetched by user ${req.user.id}`);
            return res.json(successResponse('Expiring contracts fetched successfully', { contracts }));
        } catch (error) {
            logger.error('Error in getContractsExpiring:', error);
            next(error);
        }
    }

    /**
     * GET /api/contracts/statistics
     * Get contract statistics
     */
    async getContractStatistics(req, res, next) {
        try {
            const stats = await contractService.getContractStatistics();
            logger.info(`Contract statistics fetched by user ${req.user.id}`);
            return res.json(successResponse('Statistics fetched successfully', stats));
        } catch (error) {
            logger.error('Error in getContractStatistics:', error);
            next(error);
        }
    }

    /**
     * PATCH /api/contracts/:id/renewal-status
     * Update renewal status
     */
    async updateRenewalStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user.id;

            const contract = await contractService.updateRenewalStatus(parseInt(id), status, userId);
            logger.info(`Contract ${id} renewal status updated by user ${userId}`);
            return res.json(successResponse('Renewal status updated successfully', { contract }));
        } catch (error) {
            logger.error('Error in updateRenewalStatus:', error);
            next(error);
        }
    }

    /**
     * PATCH /api/contracts/:id/auto-renew
     * Toggle auto-renew
     */
    async toggleAutoRenew(req, res, next) {
        try {
            const { id } = req.params;
            const { autoRenew } = req.body;
            const userId = req.user.id;

            const contract = await contractService.toggleAutoRenew(parseInt(id), autoRenew, userId);
            logger.info(`Contract ${id} auto-renew toggled by user ${userId}`);
            return res.json(successResponse('Auto-renew updated successfully', { contract }));
        } catch (error) {
            logger.error('Error in toggleAutoRenew:', error);
            next(error);
        }
    }

    /**
     * POST /api/contracts/:id/renew
     * Renew contract
     */
    async renewContract(req, res, next) {
        try {
            const { id } = req.params;
            const newContractData = req.body;
            const userId = req.user.id;

            const newContract = await contractService.renewContract(parseInt(id), newContractData, userId);
            logger.info(`Contract ${id} renewed by user ${userId}`);
            return res.json(successResponse('Contract renewed successfully', { contract: newContract }));
        } catch (error) {
            logger.error('Error in renewContract:', error);
            next(error);
        }
    }

    /**
     * GET /api/contracts/requiring-action
     * Get contracts requiring action
     */
    async getContractsRequiringAction(req, res, next) {
        try {
            const userId = req.query.myTasks ? req.user.id : null;
            const contracts = await contractService.getContractsRequiringAction(userId);
            logger.info(`Contracts requiring action fetched by user ${req.user.id}`);
            return res.json(successResponse('Contracts fetched successfully', { contracts }));
        } catch (error) {
            logger.error('Error in getContractsRequiringAction:', error);
            next(error);
        }
    }

    /**
     * POST /api/contracts/renewal-tasks
     * Create renewal task
     */
    async createRenewalTask(req, res, next) {
        try {
            const taskData = req.body;
            const userId = req.user.id;

            const task = await contractService.createRenewalTask(taskData, userId);
            logger.info(`Renewal task created by user ${userId}`);
            return res.json(successResponse('Renewal task created successfully', { task }));
        } catch (error) {
            logger.error('Error in createRenewalTask:', error);
            next(error);
        }
    }

    /**
     * POST /api/contracts/churn
     * Record churn reason
     */
    async recordChurnReason(req, res, next) {
        try {
            const data = req.body;
            const userId = req.user.id;

            const churnRecord = await contractService.recordChurnReason(data, userId);
            logger.info(`Churn reason recorded by user ${userId}`);
            return res.json(successResponse('Churn reason recorded successfully', { churnRecord }));
        } catch (error) {
            logger.error('Error in recordChurnReason:', error);
            next(error);
        }
    }
}

module.exports = new ContractController();
