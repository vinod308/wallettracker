/**
 * Contract Repository
 * Data access layer for contracts and renewal management
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class ContractRepository {
    /**
     * Find all contracts with filters
     */
    async findAll(filters = {}) {
        let query = `
            SELECT
                co.*,
                c.client_name,
                c.project_name,
                c.status as client_status,
                u.full_name as assigned_to_name,
                CASE
                    WHEN co.end_date < CURRENT_DATE THEN 'Expired'
                    WHEN co.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
                    ELSE 'Active'
                END as urgency_status,
                (co.end_date - CURRENT_DATE) as days_until_expiry
            FROM contracts co
            INNER JOIN clients c ON co.client_id = c.id
            LEFT JOIN users u ON co.assigned_to = u.id
            WHERE c.deleted_at IS NULL
        `;
        const values = [];
        let paramCount = 1;

        // Filter by days until expiry
        if (filters.daysUntilExpiry) {
            values.push(filters.daysUntilExpiry);
            query += ` AND co.end_date <= CURRENT_DATE + INTERVAL '1 day' * $${paramCount}
                       AND co.end_date >= CURRENT_DATE`;
            paramCount++;
        }

        // Filter by status
        if (filters.status) {
            values.push(filters.status);
            query += ` AND co.status = $${paramCount}`;
            paramCount++;
        }

        // Filter by renewal status
        if (filters.renewalStatus) {
            values.push(filters.renewalStatus);
            query += ` AND co.renewal_status = $${paramCount}`;
            paramCount++;
        }

        // Filter by assigned user
        if (filters.assignedTo) {
            values.push(filters.assignedTo);
            query += ` AND co.assigned_to = $${paramCount}`;
            paramCount++;
        }

        // Apply sorting
        const sortColumn = filters.sortBy || 'end_date';
        const sortOrder = filters.sortOrder || 'ASC';
        query += ` ORDER BY ${sortColumn} ${sortOrder}`;

        // Apply pagination
        const limit = filters.limit || 25;
        const offset = filters.offset || 0;
        values.push(limit, offset);
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;

        const { rows } = await pool.query(query, values);
        return rows;
    }

    /**
     * Find contract by ID
     */
    async findById(id) {
        const query = `
            SELECT
                co.*,
                c.client_name,
                c.project_name,
                c.status as client_status,
                u.full_name as assigned_to_name,
                u.email as assigned_to_email,
                (co.end_date - CURRENT_DATE) as days_until_expiry
            FROM contracts co
            INNER JOIN clients c ON co.client_id = c.id
            LEFT JOIN users u ON co.assigned_to = u.id
            WHERE co.id = $1
        `;

        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    }

    /**
     * Get contracts expiring soon
     */
    async getExpiringContracts(days = 30) {
        const query = `
            SELECT
                co.*,
                c.client_name,
                c.project_name,
                c.status as client_status,
                u.full_name as assigned_to_name,
                (co.end_date - CURRENT_DATE) as days_until_expiry,
                CASE
                    WHEN co.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'High'
                    WHEN co.end_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'Medium'
                    ELSE 'Low'
                END as priority
            FROM contracts co
            INNER JOIN clients c ON co.client_id = c.id
            LEFT JOIN users u ON co.assigned_to = u.id
            WHERE co.status = 'Active'
                AND co.end_date <= CURRENT_DATE + INTERVAL '1 day' * $1
                AND co.end_date >= CURRENT_DATE
                AND c.deleted_at IS NULL
            ORDER BY co.end_date ASC
        `;

        const { rows } = await pool.query(query, [days]);
        return rows;
    }

    /**
     * Count contracts by status
     */
    async getContractCounts() {
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE co.status = 'Active') as active_count,
                COUNT(*) FILTER (WHERE co.end_date <= CURRENT_DATE + INTERVAL '30 days'
                    AND co.end_date >= CURRENT_DATE AND co.status = 'Active') as expiring_this_month,
                COUNT(*) FILTER (WHERE co.end_date <= CURRENT_DATE + INTERVAL '60 days'
                    AND co.end_date >= CURRENT_DATE AND co.status = 'Active') as expiring_60_days,
                COUNT(*) FILTER (WHERE co.end_date <= CURRENT_DATE + INTERVAL '90 days'
                    AND co.end_date >= CURRENT_DATE AND co.status = 'Active') as expiring_90_days,
                COUNT(*) FILTER (WHERE co.status = 'Renewed') as renewed_count,
                COUNT(*) FILTER (WHERE co.status = 'Expired') as expired_count
            FROM contracts co
            INNER JOIN clients c ON co.client_id = c.id
            WHERE c.deleted_at IS NULL
        `;

        const { rows } = await pool.query(query);
        return rows[0];
    }

    /**
     * Calculate renewal rate
     */
    async getRenewalRate(startDate, endDate) {
        const query = `
            WITH expiring_contracts AS (
                SELECT COUNT(*) as total
                FROM contracts
                WHERE end_date BETWEEN $1 AND $2
            ),
            renewed_contracts AS (
                SELECT COUNT(*) as total
                FROM contracts
                WHERE end_date BETWEEN $1 AND $2
                    AND status = 'Renewed'
            )
            SELECT
                ec.total as total_expiring,
                rc.total as total_renewed,
                CASE
                    WHEN ec.total = 0 THEN 0
                    ELSE ROUND((rc.total::numeric / ec.total * 100), 2)
                END as renewal_rate
            FROM expiring_contracts ec, renewed_contracts rc
        `;

        const { rows } = await pool.query(query, [startDate, endDate]);
        return rows[0];
    }

    /**
     * Create new contract
     */
    async create(contractData) {
        const query = `
            INSERT INTO contracts (
                client_id, start_date, end_date, mrr,
                auto_renew, assigned_to, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            contractData.clientId,
            contractData.startDate,
            contractData.endDate,
            contractData.mrr,
            contractData.autoRenew || false,
            contractData.assignedTo || null,
            'Active',
        ];

        const { rows } = await pool.query(query, values);
        logger.info(`Contract created for client ${contractData.clientId}: ${rows[0].id}`);
        return rows[0];
    }

    /**
     * Update contract
     */
    async update(id, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.entries(updates).forEach(([key, value]) => {
            fields.push(`${key} = $${paramCount}`);
            values.push(value);
            paramCount++;
        });

        fields.push('updated_at = NOW()');
        values.push(id);

        const query = `
            UPDATE contracts
            SET ${fields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const { rows } = await pool.query(query, values);
        logger.info(`Contract updated: ${id}`);
        return rows[0];
    }

    /**
     * Update renewal status
     */
    async updateRenewalStatus(id, status, notes = null) {
        const query = `
            UPDATE contracts
            SET
                renewal_status = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const { rows } = await pool.query(query, [id, status]);
        logger.info(`Contract ${id} renewal status updated to: ${status}`);
        return rows[0];
    }

    /**
     * Toggle auto-renew
     */
    async toggleAutoRenew(id, autoRenew) {
        const query = `
            UPDATE contracts
            SET
                auto_renew = $2,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;

        const { rows } = await pool.query(query, [id, autoRenew]);
        logger.info(`Contract ${id} auto-renew set to: ${autoRenew}`);
        return rows[0];
    }

    /**
     * Renew contract (create new contract linked to old one)
     */
    async renewContract(oldContractId, newContractData) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Update old contract status
            await client.query(
                'UPDATE contracts SET status = $1, updated_at = NOW() WHERE id = $2',
                ['Renewed', oldContractId]
            );

            // Create new contract
            const insertQuery = `
                INSERT INTO contracts (
                    client_id, start_date, end_date, mrr,
                    auto_renew, assigned_to, previous_contract_id, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const { rows } = await client.query(insertQuery, [
                newContractData.clientId,
                newContractData.startDate,
                newContractData.endDate,
                newContractData.mrr,
                newContractData.autoRenew || false,
                newContractData.assignedTo,
                oldContractId,
                'Active',
            ]);

            await client.query('COMMIT');
            logger.info(`Contract ${oldContractId} renewed. New contract: ${rows[0].id}`);

            return rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get contracts by client ID
     */
    async getByClientId(clientId) {
        const query = `
            SELECT
                co.*,
                u.full_name as assigned_to_name,
                (co.end_date - CURRENT_DATE) as days_until_expiry
            FROM contracts co
            LEFT JOIN users u ON co.assigned_to = u.id
            WHERE co.client_id = $1
            ORDER BY co.created_at DESC
        `;

        const { rows } = await pool.query(query, [clientId]);
        return rows;
    }

    /**
     * Get contracts requiring action
     */
    async getContractsRequiringAction(userId = null) {
        let query = `
            SELECT
                co.*,
                c.client_name,
                c.project_name,
                u.full_name as assigned_to_name,
                (co.end_date - CURRENT_DATE) as days_until_expiry
            FROM contracts co
            INNER JOIN clients c ON co.client_id = c.id
            LEFT JOIN users u ON co.assigned_to = u.id
            WHERE co.status = 'Active'
                AND co.end_date <= CURRENT_DATE + INTERVAL '60 days'
                AND co.renewal_status IN ('Not Started', 'Client Contacted', 'Proposal Sent')
                AND c.deleted_at IS NULL
        `;

        const values = [];
        if (userId) {
            values.push(userId);
            query += ` AND co.assigned_to = $1`;
        }

        query += ` ORDER BY co.end_date ASC`;

        const { rows } = await pool.query(query, values);
        return rows;
    }
}

module.exports = new ContractRepository();
