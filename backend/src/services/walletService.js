/**
 * Wallet Service
 * Business logic for wallet intelligence and share of wallet analysis
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class WalletService {
    /**
     * Get total wallet summary
     */
    async getTotalWalletSummary() {
        try {
            const query = `
                WITH wallet_data AS (
                    SELECT
                        c.id,
                        c.estimated_total_budget,
                        COALESCE(SUM(cs.monthly_amount), 0) as current_spend
                    FROM clients c
                    LEFT JOIN client_services cs ON c.id = cs.client_id
                    WHERE c.deleted_at IS NULL
                        AND c.estimated_total_budget > 0
                    GROUP BY c.id, c.estimated_total_budget
                )
                SELECT
                    COALESCE(SUM(estimated_total_budget), 0) as total_addressable_market,
                    COALESCE(SUM(current_spend), 0) as current_captured_revenue,
                    COALESCE(SUM(estimated_total_budget - current_spend), 0) as expansion_opportunity
                FROM wallet_data
            `;

            const { rows } = await pool.query(query);
            return {
                totalAddressableMarket: parseFloat(rows[0].total_addressable_market),
                currentCapturedRevenue: parseFloat(rows[0].current_captured_revenue),
                expansionOpportunity: parseFloat(rows[0].expansion_opportunity),
                captureRate: rows[0].total_addressable_market > 0
                    ? (parseFloat(rows[0].current_captured_revenue) / parseFloat(rows[0].total_addressable_market) * 100).toFixed(2)
                    : 0,
            };
        } catch (error) {
            logger.error('Error in getTotalWalletSummary:', error);
            throw error;
        }
    }

    /**
     * Get wallet distribution by client
     */
    async getWalletDistribution() {
        try {
            const query = `
                SELECT
                    c.id,
                    c.client_name,
                    c.project_name,
                    c.industry,
                    c.estimated_total_budget,
                    COALESCE(SUM(cs.monthly_amount), 0) as current_spend,
                    CASE
                        WHEN c.estimated_total_budget > 0
                        THEN ROUND((COALESCE(SUM(cs.monthly_amount), 0) / c.estimated_total_budget * 100)::numeric, 2)
                        ELSE 0
                    END as wallet_share_percentage,
                    c.estimated_total_budget - COALESCE(SUM(cs.monthly_amount), 0) as expansion_potential,
                    COUNT(DISTINCT cs.service_id) as services_subscribed,
                    (SELECT COUNT(*) FROM services) as total_services
                FROM clients c
                LEFT JOIN client_services cs ON c.id = cs.client_id
                WHERE c.deleted_at IS NULL
                    AND c.estimated_total_budget > 0
                GROUP BY c.id, c.client_name, c.project_name, c.industry, c.estimated_total_budget
                ORDER BY expansion_potential DESC
            `;

            const { rows } = await pool.query(query);
            return rows.map(row => ({
                id: row.id,
                clientName: row.client_name,
                projectName: row.project_name,
                industry: row.industry,
                estimatedTotalBudget: parseFloat(row.estimated_total_budget),
                currentSpend: parseFloat(row.current_spend),
                walletSharePercentage: parseFloat(row.wallet_share_percentage),
                expansionPotential: parseFloat(row.expansion_potential),
                servicesSubscribed: parseInt(row.services_subscribed),
                totalServices: parseInt(row.total_services),
                priority: this._calculatePriority(parseFloat(row.expansion_potential), parseFloat(row.wallet_share_percentage)),
            }));
        } catch (error) {
            logger.error('Error in getWalletDistribution:', error);
            throw error;
        }
    }

    /**
     * Get industry-wise breakdown
     */
    async getIndustryBreakdown() {
        try {
            const query = `
                SELECT
                    COALESCE(c.industry, 'Not Specified') as industry,
                    COUNT(c.id) as client_count,
                    COALESCE(SUM(c.estimated_total_budget), 0) as total_budget,
                    COALESCE(SUM(cs.monthly_amount), 0) as current_revenue,
                    COALESCE(SUM(c.estimated_total_budget - cs.monthly_amount), 0) as expansion_opportunity
                FROM clients c
                LEFT JOIN (
                    SELECT client_id, SUM(monthly_amount) as monthly_amount
                    FROM client_services
                    GROUP BY client_id
                ) cs ON c.id = cs.client_id
                WHERE c.deleted_at IS NULL
                    AND c.estimated_total_budget > 0
                GROUP BY industry
                ORDER BY expansion_opportunity DESC
            `;

            const { rows } = await pool.query(query);
            return rows.map(row => ({
                industry: row.industry,
                clientCount: parseInt(row.client_count),
                totalBudget: parseFloat(row.total_budget),
                currentRevenue: parseFloat(row.current_revenue),
                expansionOpportunity: parseFloat(row.expansion_opportunity),
                penetrationRate: row.total_budget > 0
                    ? (parseFloat(row.current_revenue) / parseFloat(row.total_budget) * 100).toFixed(2)
                    : 0,
            }));
        } catch (error) {
            logger.error('Error in getIndustryBreakdown:', error);
            throw error;
        }
    }

    /**
     * Get top expansion-ready clients
     */
    async getExpansionReadyClients(limit = 5) {
        try {
            const query = `
                SELECT
                    c.id,
                    c.client_name,
                    c.project_name,
                    c.estimated_total_budget,
                    COALESCE(SUM(cs.monthly_amount), 0) as current_spend,
                    c.estimated_total_budget - COALESCE(SUM(cs.monthly_amount), 0) as expansion_potential,
                    ROUND((COALESCE(SUM(cs.monthly_amount), 0) / c.estimated_total_budget * 100)::numeric, 2) as wallet_share,
                    COUNT(DISTINCT cs.service_id) as services_count
                FROM clients c
                LEFT JOIN client_services cs ON c.id = cs.client_id
                WHERE c.deleted_at IS NULL
                    AND c.status = 'Active'
                    AND c.estimated_total_budget > 0
                GROUP BY c.id, c.client_name, c.project_name, c.estimated_total_budget
                HAVING c.estimated_total_budget - COALESCE(SUM(cs.monthly_amount), 0) > 0
                ORDER BY expansion_potential DESC
                LIMIT $1
            `;

            const { rows } = await pool.query(query, [limit]);
            return rows.map(row => ({
                id: row.id,
                clientName: row.client_name,
                projectName: row.project_name,
                estimatedTotalBudget: parseFloat(row.estimated_total_budget),
                currentSpend: parseFloat(row.current_spend),
                expansionPotential: parseFloat(row.expansion_potential),
                walletShare: parseFloat(row.wallet_share),
                servicesCount: parseInt(row.services_count),
                priority: this._calculatePriority(parseFloat(row.expansion_potential), parseFloat(row.wallet_share)),
            }));
        } catch (error) {
            logger.error('Error in getExpansionReadyClients:', error);
            throw error;
        }
    }

    /**
     * Get services with highest upsell success
     */
    async getServicesUpsellSuccess() {
        try {
            const query = `
                SELECT
                    s.id,
                    s.name,
                    s.category,
                    COUNT(DISTINCT cs.client_id) as client_count,
                    COALESCE(SUM(cs.monthly_amount), 0) as total_revenue,
                    ROUND(AVG(cs.monthly_amount)::numeric, 2) as avg_revenue_per_client
                FROM services s
                LEFT JOIN client_services cs ON s.id = cs.service_id
                GROUP BY s.id, s.name, s.category
                ORDER BY client_count DESC, total_revenue DESC
            `;

            const { rows } = await pool.query(query);
            return rows.map(row => ({
                serviceId: row.id,
                serviceName: row.name,
                category: row.category,
                clientCount: parseInt(row.client_count),
                totalRevenue: parseFloat(row.total_revenue),
                avgRevenuePerClient: parseFloat(row.avg_revenue_per_client),
            }));
        } catch (error) {
            logger.error('Error in getServicesUpsellSuccess:', error);
            throw error;
        }
    }

    /**
     * Get detailed wallet analysis with filters
     */
    async getDetailedWalletAnalysis(filters = {}) {
        try {
            let query = `
                SELECT
                    c.id,
                    c.client_name,
                    c.project_name,
                    c.industry,
                    c.status,
                    c.estimated_total_budget,
                    COALESCE(SUM(cs.monthly_amount), 0) as current_spend,
                    ROUND((COALESCE(SUM(cs.monthly_amount), 0) / c.estimated_total_budget * 100)::numeric, 2) as wallet_share,
                    c.estimated_total_budget - COALESCE(SUM(cs.monthly_amount), 0) as expansion_potential,
                    COUNT(DISTINCT cs.service_id) as services_count
                FROM clients c
                LEFT JOIN client_services cs ON c.id = cs.client_id
                WHERE c.deleted_at IS NULL
                    AND c.estimated_total_budget > 0
            `;

            const values = [];
            let paramCount = 1;

            // Apply filters
            if (filters.industry) {
                values.push(filters.industry);
                query += ` AND c.industry = $${paramCount}`;
                paramCount++;
            }

            if (filters.minWalletShare !== undefined) {
                values.push(filters.minWalletShare);
                query += ` AND (COALESCE(SUM(cs.monthly_amount), 0) / c.estimated_total_budget * 100) >= $${paramCount}`;
                paramCount++;
            }

            if (filters.maxWalletShare !== undefined) {
                values.push(filters.maxWalletShare);
                query += ` AND (COALESCE(SUM(cs.monthly_amount), 0) / c.estimated_total_budget * 100) <= $${paramCount}`;
                paramCount++;
            }

            query += ` GROUP BY c.id, c.client_name, c.project_name, c.industry, c.status, c.estimated_total_budget`;

            if (filters.priority) {
                // Filter by priority after calculation
                query += ` HAVING c.estimated_total_budget - COALESCE(SUM(cs.monthly_amount), 0) > 0`;
            }

            query += ` ORDER BY expansion_potential DESC`;

            const { rows } = await pool.query(query, values);
            return rows.map(row => ({
                id: row.id,
                clientName: row.client_name,
                projectName: row.project_name,
                industry: row.industry,
                status: row.status,
                estimatedTotalBudget: parseFloat(row.estimated_total_budget),
                currentSpend: parseFloat(row.current_spend),
                walletShare: parseFloat(row.wallet_share),
                expansionPotential: parseFloat(row.expansion_potential),
                servicesCount: parseInt(row.services_count),
                priority: this._calculatePriority(parseFloat(row.expansion_potential), parseFloat(row.wallet_share)),
            }));
        } catch (error) {
            logger.error('Error in getDetailedWalletAnalysis:', error);
            throw error;
        }
    }

    /**
     * Private: Calculate priority based on expansion potential and wallet share
     */
    _calculatePriority(expansionPotential, walletShare) {
        if (expansionPotential > 100000 && walletShare < 50) return 'High';
        if (expansionPotential > 50000 && walletShare < 70) return 'Medium';
        return 'Low';
    }
}

module.exports = new WalletService();
