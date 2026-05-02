/**
 * Invoice Repository
 * Data access layer for invoices table
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class InvoiceRepository {
    /**
     * Get all invoices with optional filters
     */
    async findAll({ month, clientId, paymentStatus, limit = 25, offset = 0 } = {}) {
        let query = `
            SELECT
                i.*,
                c.client_name,
                c.project_name,
                c.client_type,
                c.status as client_status,
                c.industry
            FROM invoices i
            INNER JOIN clients c ON i.client_id = c.id
            WHERE c.deleted_at IS NULL
        `;
        const values = [];
        let paramCount = 0;

        if (month) {
            paramCount++;
            query += ` AND i.invoice_month = $${paramCount}`;
            values.push(month);
        }

        if (clientId) {
            paramCount++;
            query += ` AND i.client_id = $${paramCount}`;
            values.push(clientId);
        }

        if (paymentStatus) {
            paramCount++;
            query += ` AND i.payment_status = $${paramCount}`;
            values.push(paymentStatus);
        }

        query += ` ORDER BY i.total_mrr DESC`;

        paramCount++;
        query += ` LIMIT $${paramCount}`;
        values.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        values.push(offset);

        const { rows } = await pool.query(query, values);
        return rows;
    }

    /**
     * Get invoice summary for a given month
     */
    async getMonthSummary(month = 'July 2025') {
        const query = `
            SELECT
                COUNT(*) as total_invoices,
                COALESCE(SUM(service_mrr), 0) as total_service_mrr,
                COALESCE(SUM(addons_mrr), 0) as total_addons_mrr,
                COALESCE(SUM(total_mrr), 0) as total_mrr,
                COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN payment_status = 'Unpaid' THEN 1 END) as unpaid_count,
                COUNT(CASE WHEN payment_status = 'Overdue' THEN 1 END) as overdue_count
            FROM invoices
            WHERE invoice_month = $1
        `;
        const { rows } = await pool.query(query, [month]);
        return rows[0];
    }

    /**
     * Get client revenue from invoices (for dashboard table)
     */
    async getClientInvoiceRevenue(month = 'July 2025') {
        const query = `
            SELECT
                c.id,
                c.client_name,
                c.project_name,
                c.client_type,
                c.status as client_status,
                c.industry,
                i.invoice_number,
                i.invoice_date,
                i.services_description,
                i.addons_description,
                i.service_mrr,
                i.addons_mrr,
                i.total_mrr,
                i.payment_status,
                i.contract_start,
                (SELECT COUNT(DISTINCT cs.service_id) FROM client_services cs WHERE cs.client_id = c.id) as service_count
            FROM clients c
            LEFT JOIN invoices i ON c.id = i.client_id AND i.invoice_month = $1
            WHERE c.deleted_at IS NULL
                AND c.status = 'Active'
            ORDER BY i.total_mrr DESC NULLS LAST
        `;
        const { rows } = await pool.query(query, [month]);
        return rows;
    }

    /**
     * Create a new invoice
     */
    async create(invoiceData) {
        const query = `
            INSERT INTO invoices (
                client_id, invoice_number, invoice_date, invoice_month,
                contract_start, services_description, addons_description,
                service_mrr, addons_mrr, total_mrr, payment_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        const values = [
            invoiceData.client_id,
            invoiceData.invoice_number,
            invoiceData.invoice_date,
            invoiceData.invoice_month,
            invoiceData.contract_start,
            invoiceData.services_description,
            invoiceData.addons_description,
            invoiceData.service_mrr || 0,
            invoiceData.addons_mrr || 0,
            invoiceData.total_mrr || 0,
            invoiceData.payment_status || 'Unpaid',
        ];
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    /**
     * Update invoice payment status
     */
    async updatePaymentStatus(id, paymentStatus) {
        const query = `
            UPDATE invoices SET payment_status = $1, updated_at = NOW()
            WHERE id = $2 RETURNING *
        `;
        const { rows } = await pool.query(query, [paymentStatus, id]);
        return rows[0];
    }

    /**
     * Get multi-month revenue overview from revenue_records + invoices
     * Returns per-client, per-month data for the full April-July 2025 period
     */
    async getMultiMonthOverview() {
        const query = `
            SELECT
                c.id,
                c.client_name,
                c.project_name,
                c.client_type,
                c.industry,
                c.status as client_status,
                TO_CHAR(rr.record_date, 'FMMonth YYYY') as month,
                rr.record_date,
                SUM(CASE WHEN cs.is_addon = false THEN rr.amount ELSE 0 END) as service_mrr,
                SUM(CASE WHEN cs.is_addon = true THEN rr.amount ELSE 0 END) as addons_mrr,
                SUM(rr.amount) as total_mrr,
                COUNT(DISTINCT cs.service_id) as service_count
            FROM clients c
            INNER JOIN revenue_records rr ON c.id = rr.client_id
            LEFT JOIN client_services cs ON c.id = cs.client_id AND rr.service_id = cs.service_id
            WHERE c.deleted_at IS NULL
                AND rr.record_date BETWEEN '2025-04-01' AND '2025-07-31'
            GROUP BY c.id, c.client_name, c.project_name, c.client_type, c.industry, c.status, rr.record_date
            ORDER BY rr.record_date ASC, total_mrr DESC
        `;
        const { rows } = await pool.query(query);
        return rows;
    }

    /**
     * Get monthly analytics for a single client
     * Returns per-month, per-service breakdown with addon detection
     */
    async getClientMonthlyAnalytics(clientId) {
        const query = `
            SELECT
                rr.record_date,
                TO_CHAR(rr.record_date, 'FMMonth YYYY') as month_label,
                s.name as service_name,
                s.category as service_category,
                cs.is_addon,
                rr.amount,
                rr.record_type
            FROM revenue_records rr
            LEFT JOIN services s ON rr.service_id = s.id
            LEFT JOIN client_services cs ON rr.client_id = cs.client_id AND rr.service_id = cs.service_id
            WHERE rr.client_id = $1
                AND rr.record_date BETWEEN '2025-04-01' AND '2025-07-31'
            ORDER BY rr.record_date DESC, s.name ASC
        `;
        const { rows } = await pool.query(query, [clientId]);
        return rows;
    }

    /**
     * Get invoices for a specific client
     */
    async getClientInvoices(clientId) {
        const query = `
            SELECT *
            FROM invoices
            WHERE client_id = $1
            ORDER BY invoice_date DESC
        `;
        const { rows } = await pool.query(query, [clientId]);
        return rows;
    }

    /**
     * Get all invoices across all months (for invoice-specific columns)
     */
    async getAllInvoices() {
        const query = `
            SELECT
                i.*,
                c.client_name,
                c.client_type,
                c.industry,
                c.status as client_status
            FROM invoices i
            INNER JOIN clients c ON i.client_id = c.id
            WHERE c.deleted_at IS NULL
            ORDER BY i.invoice_date DESC
        `;
        const { rows } = await pool.query(query);
        return rows;
    }
}

module.exports = new InvoiceRepository();
