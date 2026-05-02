/**
 * Contract Service
 * Business logic for contract and renewal management
 */

const contractRepository = require('../repositories/contractRepository');
const clientRepository = require('../repositories/clientRepository');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class ContractService {
    /**
     * Get all contracts with filters
     */
    async getAllContracts(filters = {}) {
        try {
            const contracts = await contractRepository.findAll(filters);
            return contracts;
        } catch (error) {
            logger.error('Error in getAllContracts:', error);
            throw error;
        }
    }

    /**
     * Get contract by ID
     */
    async getContractById(id) {
        try {
            const contract = await contractRepository.findById(id);
            if (!contract) {
                throw new NotFoundError('Contract not found');
            }
            return contract;
        } catch (error) {
            logger.error(`Error in getContractById (${id}):`, error);
            throw error;
        }
    }

    /**
     * Get contracts expiring soon
     */
    async getContractsExpiring(days = 30) {
        try {
            const contracts = await contractRepository.getExpiringContracts(days);
            return contracts;
        } catch (error) {
            logger.error('Error in getContractsExpiring:', error);
            throw error;
        }
    }

    /**
     * Get contract statistics
     */
    async getContractStatistics() {
        try {
            const counts = await contractRepository.getContractCounts();
            const renewalRate = await contractRepository.getRenewalRate(
                new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0],
                new Date().toISOString().split('T')[0]
            );

            return {
                totalActive: parseInt(counts.active_count),
                expiringThisMonth: parseInt(counts.expiring_this_month),
                expiring60Days: parseInt(counts.expiring_60_days),
                expiring90Days: parseInt(counts.expiring_90_days),
                renewed: parseInt(counts.renewed_count),
                expired: parseInt(counts.expired_count),
                renewalRate: parseFloat(renewalRate.renewal_rate),
            };
        } catch (error) {
            logger.error('Error in getContractStatistics:', error);
            throw error;
        }
    }

    /**
     * Update renewal status
     */
    async updateRenewalStatus(id, status, userId) {
        try {
            const contract = await contractRepository.findById(id);
            if (!contract) {
                throw new NotFoundError('Contract not found');
            }

            // Validate status transition
            const validStatuses = [
                'Not Started', 'Client Contacted', 'Proposal Sent',
                'Negotiating', 'Awaiting Signature', 'Renewed', 'Lost'
            ];

            if (!validStatuses.includes(status)) {
                throw new ValidationError('Invalid renewal status');
            }

            const updatedContract = await contractRepository.updateRenewalStatus(id, status);

            logger.info(`Contract ${id} renewal status updated to ${status} by user ${userId}`);

            return updatedContract;
        } catch (error) {
            logger.error(`Error in updateRenewalStatus (${id}):`, error);
            throw error;
        }
    }

    /**
     * Toggle auto-renew
     */
    async toggleAutoRenew(id, autoRenew, userId) {
        try {
            const contract = await contractRepository.findById(id);
            if (!contract) {
                throw new NotFoundError('Contract not found');
            }

            const updatedContract = await contractRepository.toggleAutoRenew(id, autoRenew);

            logger.info(`Contract ${id} auto-renew set to ${autoRenew} by user ${userId}`);

            return updatedContract;
        } catch (error) {
            logger.error(`Error in toggleAutoRenew (${id}):`, error);
            throw error;
        }
    }

    /**
     * Renew contract
     */
    async renewContract(oldContractId, newContractData, userId) {
        try {
            const oldContract = await contractRepository.findById(oldContractId);
            if (!oldContract) {
                throw new NotFoundError('Contract not found');
            }

            // Create new contract linked to old one
            const newContract = await contractRepository.renewContract(oldContractId, {
                clientId: oldContract.client_id,
                startDate: newContractData.startDate || new Date(oldContract.end_date).toISOString().split('T')[0],
                endDate: newContractData.endDate,
                mrr: newContractData.mrr || oldContract.mrr,
                autoRenew: newContractData.autoRenew !== undefined ? newContractData.autoRenew : oldContract.auto_renew,
                assignedTo: newContractData.assignedTo || oldContract.assigned_to,
            });

            logger.info(`Contract ${oldContractId} renewed as ${newContract.id} by user ${userId}`);

            return newContract;
        } catch (error) {
            logger.error(`Error in renewContract (${oldContractId}):`, error);
            throw error;
        }
    }

    /**
     * Get contracts requiring action
     */
    async getContractsRequiringAction(userId = null) {
        try {
            const contracts = await contractRepository.getContractsRequiringAction(userId);
            return contracts;
        } catch (error) {
            logger.error('Error in getContractsRequiringAction:', error);
            throw error;
        }
    }

    /**
     * Create renewal task
     */
    async createRenewalTask(taskData, userId) {
        try {
            const query = `
                INSERT INTO renewal_tasks (
                    client_id, contract_id, assigned_to, priority,
                    due_date, proposed_terms, notes, created_by, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const pool = require('../config/database');
            const { rows } = await pool.query(query, [
                taskData.clientId,
                taskData.contractId,
                taskData.assignedTo,
                taskData.priority || 'Medium',
                taskData.dueDate,
                taskData.proposedTerms || null,
                taskData.notes || null,
                userId,
                'Pending',
            ]);

            logger.info(`Renewal task created for contract ${taskData.contractId} by user ${userId}`);

            return rows[0];
        } catch (error) {
            logger.error('Error in createRenewalTask:', error);
            throw error;
        }
    }

    /**
     * Record churn reason
     */
    async recordChurnReason(data, userId) {
        try {
            const query = `
                INSERT INTO churn_reasons (
                    client_id, contract_id, reason, notes, logged_by
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;

            const pool = require('../config/database');
            const { rows } = await pool.query(query, [
                data.clientId,
                data.contractId,
                data.reason,
                data.notes,
                userId,
            ]);

            // Update client status to Inactive
            await clientRepository.update(data.clientId, { status: 'Inactive' });

            logger.info(`Churn reason recorded for client ${data.clientId} by user ${userId}`);

            return rows[0];
        } catch (error) {
            logger.error('Error in recordChurnReason:', error);
            throw error;
        }
    }
}

module.exports = new ContractService();
