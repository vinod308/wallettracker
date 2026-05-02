/**
 * Revenue Repository
 * Data access layer for revenue analytics
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class RevenueRepository {
    /**
     * Get total MRR (Monthly Recurring Revenue)
     */
    async getTotalMRR(dateRange = {}) {
        let query = `
            SELECT COALESCE(SUM(cs.monthly_amount), 0) as total_mrr
            FROM client_services cs
            INNER JOIN clients c ON cs.client_id = c.id
            WHERE c.status = 'Active' AND c.deleted_at IS NULL
        `;
        const values = [];

        if (dateRange.startDate && dateRange.endDate) {
            values.push(dateRange.startDate, dateRange.endDate);
            query += ` AND cs.created_at BETWEEN $1 AND $2`;
        }

        const { rows } = await pool.query(query, values);
        return parseFloat(rows[0].total_mrr) || 0;
    }

    /**
     * Get total revenue for a date range
     */
    async getTotalRevenue(startDate, endDate) {
        const query = `
            SELECT COALESCE(SUM(amount), 0) as total_revenue
            FROM revenue_records
            WHERE record_date BETWEEN $1 AND $2
        `;

        const { rows } = await pool.query(query, [startDate, endDate]);
        return parseFloat(rows[0].total_revenue) || 0;
    }

    /**
     * Get revenue by client with growth trend
     */
    async getRevenueByClient(filters = {}) {
        const values = [];
        let paramCount = 1;

        // Build date range JOIN condition
        let dateJoinCondition = '';
        if (filters.startDate && filters.endDate) {
            values.push(filters.startDate, filters.endDate);
            dateJoinCondition = ` AND rr.record_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
            paramCount += 2;
        }

        let query = `
            WITH current_period AS (
                SELECT
                    c.id,
                    c.client_name,
                    c.project_name,
                    c.status,
                    COALESCE(SUM(rr.amount), 0) as revenue,
                    COALESCE(SUM(cs.monthly_amount), 0) as mrr,
                    COUNT(DISTINCT cs.service_id) as service_count
                FROM clients c
                LEFT JOIN revenue_records rr ON c.id = rr.client_id${dateJoinCondition}
                LEFT JOIN client_services cs ON c.id = cs.client_id
                WHERE c.deleted_at IS NULL
        `;

        // Apply status filter
        if (filters.status) {
            values.push(filters.status);
            query += ` AND c.status = $${paramCount}`;
            paramCount++;
        }

        // Apply search filter
        if (filters.search) {
            values.push(`%${filters.search}%`);
            query += ` AND (c.client_name ILIKE $${paramCount} OR c.project_name ILIKE $${paramCount})`;
            paramCount++;
        }

        query += ` GROUP BY c.id, c.client_name, c.project_name, c.status`;

        // Get previous period for growth calculation
        query += `
            ),
            previous_period AS (
                SELECT
                    c.id,
                    COALESCE(SUM(rr.amount), 0) as prev_revenue
                FROM clients c
                LEFT JOIN revenue_records rr ON c.id = rr.client_id
                WHERE c.deleted_at IS NULL
        `;

        if (filters.previousStartDate && filters.previousEndDate) {
            values.push(filters.previousStartDate, filters.previousEndDate);
            query += ` AND rr.record_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
            paramCount += 2;
        }

        query += ` GROUP BY c.id
            )
            SELECT
                cp.*,
                pp.prev_revenue,
                CASE
                    WHEN pp.prev_revenue = 0 THEN 0
                    ELSE ROUND(((cp.revenue - pp.prev_revenue) / pp.prev_revenue * 100)::numeric, 2)
                END as growth_percentage,
                CASE
                    WHEN pp.prev_revenue = 0 THEN 'New'
                    WHEN cp.revenue > pp.prev_revenue THEN 'Growing'
                    WHEN cp.revenue = pp.prev_revenue THEN 'Flat'
                    ELSE 'Declining'
                END as trend
            FROM current_period cp
            LEFT JOIN previous_period pp ON cp.id = pp.id
        `;

        // Apply sorting
        const sortColumn = filters.sortBy || 'revenue';
        const sortOrder = filters.sortOrder || 'DESC';
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
     * Get service revenue mix
     */
    async getServiceRevenueMix(startDate, endDate) {
        const query = `
            SELECT
                s.name as service_name,
                s.category,
                COALESCE(SUM(cs.monthly_amount), 0) as revenue,
                COUNT(DISTINCT cs.client_id) as client_count,
                ROUND((COALESCE(SUM(cs.monthly_amount), 0) / NULLIF(
                    (SELECT SUM(cs2.monthly_amount)
                     FROM client_services cs2
                     INNER JOIN clients c2 ON cs2.client_id = c2.id
                     WHERE c2.deleted_at IS NULL AND c2.status = 'Active'), 0
                ) * 100)::numeric, 2) as percentage
            FROM services s
            LEFT JOIN client_services cs ON s.id = cs.service_id
            LEFT JOIN clients c ON cs.client_id = c.id AND c.deleted_at IS NULL AND c.status = 'Active'
            GROUP BY s.id, s.name, s.category
            ORDER BY revenue DESC
        `;

        const { rows } = await pool.query(query, []);
        return rows;
    }

    /**
     * Get at-risk revenue
     */
    async getAtRiskRevenue() {
        const query = `
            SELECT COALESCE(SUM(cs.monthly_amount), 0) as at_risk_revenue
            FROM client_services cs
            INNER JOIN clients c ON cs.client_id = c.id
            WHERE c.status = 'At Risk' AND c.deleted_at IS NULL
        `;

        const { rows } = await pool.query(query);
        return parseFloat(rows[0].at_risk_revenue) || 0;
    }

    /**
     * Get revenue trend over time
     */
    async getRevenueTrend(startDate, endDate, groupBy = 'month') {
        const dateFormat = groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';

        const query = `
            SELECT
                TO_CHAR(record_date, $3) as period,
                COALESCE(SUM(amount), 0) as revenue,
                COUNT(DISTINCT client_id) as client_count
            FROM revenue_records
            WHERE record_date BETWEEN $1 AND $2
            GROUP BY period
            ORDER BY period ASC
        `;

        const { rows } = await pool.query(query, [startDate, endDate, dateFormat]);
        return rows;
    }

    /**
     * Get top revenue clients
     */
    async getTopRevenueClients(limit = 5, startDate, endDate) {
        const query = `
            SELECT
                c.id,
                c.client_name,
                c.project_name,
                COALESCE(SUM(rr.amount), 0) as total_revenue,
                COALESCE(SUM(cs.monthly_amount), 0) as mrr
            FROM clients c
            LEFT JOIN revenue_records rr ON c.id = rr.client_id
                AND rr.record_date BETWEEN $2 AND $3
            LEFT JOIN client_services cs ON c.id = cs.client_id
            WHERE c.deleted_at IS NULL
            GROUP BY c.id, c.client_name, c.project_name
            ORDER BY total_revenue DESC
            LIMIT $1
        `;

        const { rows } = await pool.query(query, [limit, startDate, endDate]);
        return rows;
    }

    /**
     * Create revenue record
     */
    async createRevenueRecord(data) {
        const query = `
            INSERT INTO revenue_records (
                client_id, service_id, amount, record_date, record_type
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [
            data.clientId,
            data.serviceId || null,
            data.amount,
            data.recordDate,
            data.recordType || 'Recurring',
        ];

        const { rows } = await pool.query(query, values);
        logger.info(`Revenue record created: ${data.amount} for client ${data.clientId}`);
        return rows[0];
    }

    /**
     * Get revenue by period comparison
     */
    async getRevenueComparison(currentStart, currentEnd, previousStart, previousEnd) {
        const query = `
            WITH current_revenue AS (
                SELECT COALESCE(SUM(amount), 0) as revenue
                FROM revenue_records
                WHERE record_date BETWEEN $1 AND $2
            ),
            previous_revenue AS (
                SELECT COALESCE(SUM(amount), 0) as revenue
                FROM revenue_records
                WHERE record_date BETWEEN $3 AND $4
            )
            SELECT
                cr.revenue as current_revenue,
                pr.revenue as previous_revenue,
                CASE
                    WHEN pr.revenue = 0 THEN 0
                    ELSE ROUND(((cr.revenue - pr.revenue) / pr.revenue * 100)::numeric, 2)
                END as growth_percentage
            FROM current_revenue cr, previous_revenue pr
        `;

        const { rows } = await pool.query(query, [currentStart, currentEnd, previousStart, previousEnd]);
        return rows[0];
    }
}

module.exports = new RevenueRepository();
