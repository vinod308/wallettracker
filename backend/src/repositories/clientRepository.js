/**
 * Client Repository
 * Data access layer for clients table
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class ClientRepository {
    /**
     * Find all clients with optional filters
     */
    async findAll(filters = {}) {
        let query = `
            SELECT c.*,
                   COUNT(DISTINCT cs.service_id) as service_count,
                   COALESCE(SUM(cs.monthly_amount), 0) as total_mrr
            FROM clients c
            LEFT JOIN client_services cs ON c.id = cs.client_id
            WHERE c.deleted_at IS NULL
        `;
        const values = [];

        // Apply filters
        if (filters.status) {
            values.push(filters.status);
            query += ` AND c.status = $${values.length}`;
        }

        if (filters.client_type) {
            values.push(filters.client_type);
            query += ` AND c.client_type = $${values.length}`;
        }

        if (filters.industry) {
            values.push(filters.industry);
            query += ` AND c.industry = $${values.length}`;
        }

        if (filters.search) {
            values.push(`%${filters.search}%`);
            query += ` AND (c.client_name ILIKE $${values.length} OR c.project_name ILIKE $${values.length})`;
        }

        query += ` GROUP BY c.id`;

        // Apply sorting
        const sortColumn = filters.sortBy || 'created_at';
        const sortOrder = filters.sortOrder || 'DESC';
        query += ` ORDER BY ${sortColumn} ${sortOrder}`;

        // Apply pagination
        const limit = filters.limit || 25;
        const offset = filters.offset || 0;
        values.push(limit, offset);
        query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;

        const { rows } = await pool.query(query, values);
        return rows;
    }

    /**
     * Count total clients
     */
    async count(filters = {}) {
        let query = 'SELECT COUNT(*) as total FROM clients WHERE deleted_at IS NULL';
        const values = [];

        if (filters.status) {
            values.push(filters.status);
            query += ` AND status = $${values.length}`;
        }

        const { rows } = await pool.query(query, values);
        return parseInt(rows[0].total);
    }

    /**
     * Find client by ID with services
     */
    async findById(id) {
        const query = `
            SELECT c.*,
                   json_agg(
                       json_build_object(
                           'service_id', cs.service_id,
                           'service_name', s.name,
                           'is_addon', cs.is_addon,
                           'monthly_amount', cs.monthly_amount,
                           'yearly_amount', cs.yearly_amount
                       )
                   ) FILTER (WHERE cs.id IS NOT NULL) as services
            FROM clients c
            LEFT JOIN client_services cs ON c.id = cs.client_id
            LEFT JOIN services s ON cs.service_id = s.id
            WHERE c.id = $1 AND c.deleted_at IS NULL
            GROUP BY c.id
        `;

        const { rows } = await pool.query(query, [id]);
        return rows[0] || null;
    }

    /**
     * Create new client
     */
    async create(clientData) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Insert client
            const clientQuery = `
                INSERT INTO clients (
                    project_name, client_name, client_type, industry,
                    estimated_total_budget, status, created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const clientValues = [
                clientData.projectName,
                clientData.clientName,
                clientData.clientType,
                clientData.industry || null,
                clientData.estimatedTotalBudget || null,
                'Active',
                clientData.createdBy,
            ];

            const { rows: [newClient] } = await client.query(clientQuery, clientValues);

            // Insert services if provided
            if (clientData.services && clientData.services.length > 0) {
                for (const service of clientData.services) {
                    const serviceQuery = `
                        INSERT INTO client_services (
                            client_id, service_id, is_addon,
                            monthly_amount, yearly_amount, billing_frequency
                        )
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `;

                    await client.query(serviceQuery, [
                        newClient.id,
                        service.serviceId,
                        service.isAddon || false,
                        service.monthlyAmount || null,
                        service.yearlyAmount || null,
                        service.billingFrequency || 'Monthly',
                    ]);
                }
            }

            await client.query('COMMIT');
            logger.info(`Client created: ${newClient.client_name} (ID: ${newClient.id})`);

            return await this.findById(newClient.id);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Update client
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
            UPDATE clients
            SET ${fields.join(', ')}
            WHERE id = $${paramCount} AND deleted_at IS NULL
            RETURNING *
        `;

        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    /**
     * Soft delete client
     */
    async softDelete(id) {
        const query = `
            UPDATE clients
            SET deleted_at = NOW(), updated_at = NOW()
            WHERE id = $1
        `;

        await pool.query(query, [id]);
        logger.info(`Client soft deleted: ID ${id}`);
    }

    /**
     * Get active clients count
     */
    async getActiveCount() {
        const query = `
            SELECT COUNT(*) as count
            FROM clients
            WHERE status = 'Active' AND deleted_at IS NULL
        `;

        const { rows } = await pool.query(query);
        return parseInt(rows[0].count);
    }

    /**
     * Get at-risk clients
     */
    async getAtRiskClients() {
        const query = `
            SELECT c.*,
                   COALESCE(SUM(cs.monthly_amount), 0) as mrr
            FROM clients c
            LEFT JOIN client_services cs ON c.id = cs.client_id
            WHERE c.status = 'At Risk' AND c.deleted_at IS NULL
            GROUP BY c.id
        `;

        const { rows } = await pool.query(query);
        return rows;
    }
}

module.exports = new ClientRepository();
