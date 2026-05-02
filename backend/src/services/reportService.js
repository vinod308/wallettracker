/**
 * Report Service
 * Business logic for report generation and scheduling
 */

const pool = require('../config/database');
const revenueRepository = require('../repositories/revenueRepository');
const clientRepository = require('../repositories/clientRepository');
const contractRepository = require('../repositories/contractRepository');
const logger = require('../utils/logger');

class ReportService {
    /**
     * Generate Monthly Revenue Report
     */
    async generateMonthlyRevenueReport(startDate, endDate) {
        try {
            const [totalRevenue, clientRevenue, serviceRevenue, revenueTrend] = await Promise.all([
                revenueRepository.getTotalRevenue(startDate, endDate),
                revenueRepository.getRevenueByClient({ startDate, endDate, limit: 10 }),
                revenueRepository.getServiceRevenueMix(startDate, endDate),
                revenueRepository.getRevenueTrend(startDate, endDate, 'month'),
            ]);

            return {
                reportType: 'Monthly Revenue',
                period: { startDate, endDate },
                summary: {
                    totalRevenue,
                    clientCount: clientRevenue.length,
                    avgRevenuePerClient: clientRevenue.length > 0 ? totalRevenue / clientRevenue.length : 0,
                },
                topClients: clientRevenue,
                serviceBreakdown: serviceRevenue,
                trend: revenueTrend,
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('Error generating monthly revenue report:', error);
            throw error;
        }
    }

    /**
     * Generate Client Expansion Report
     */
    async generateClientExpansionReport() {
        try {
            const query = `
                SELECT
                    c.id,
                    c.client_name,
                    c.project_name,
                    c.estimated_total_budget,
                    COALESCE(SUM(cs.monthly_amount), 0) as current_spend,
                    c.estimated_total_budget - COALESCE(SUM(cs.monthly_amount), 0) as expansion_potential,
                    COUNT(DISTINCT cs.service_id) as services_subscribed,
                    (SELECT COUNT(*) FROM services) as total_services,
                    ARRAY_AGG(DISTINCT s.name) as subscribed_services
                FROM clients c
                LEFT JOIN client_services cs ON c.id = cs.client_id
                LEFT JOIN services s ON cs.service_id = s.id
                WHERE c.deleted_at IS NULL
                    AND c.status = 'Active'
                    AND c.estimated_total_budget > 0
                GROUP BY c.id, c.client_name, c.project_name, c.estimated_total_budget
                HAVING c.estimated_total_budget - COALESCE(SUM(cs.monthly_amount), 0) > 0
                ORDER BY expansion_potential DESC
            `;

            const { rows } = await pool.query(query);

            const totalExpansionPotential = rows.reduce((sum, row) => sum + parseFloat(row.expansion_potential), 0);

            return {
                reportType: 'Client Expansion',
                summary: {
                    totalClients: rows.length,
                    totalExpansionPotential,
                    avgExpansionPerClient: rows.length > 0 ? totalExpansionPotential / rows.length : 0,
                },
                clients: rows.map(row => ({
                    id: row.id,
                    clientName: row.client_name,
                    projectName: row.project_name,
                    estimatedBudget: parseFloat(row.estimated_total_budget),
                    currentSpend: parseFloat(row.current_spend),
                    expansionPotential: parseFloat(row.expansion_potential),
                    servicesSubscribed: parseInt(row.services_subscribed),
                    totalServices: parseInt(row.total_services),
                    subscribedServicesList: row.subscribed_services,
                })),
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('Error generating client expansion report:', error);
            throw error;
        }
    }

    /**
     * Generate Service Performance Report
     */
    async generateServicePerformanceReport(startDate, endDate) {
        try {
            const serviceMix = await revenueRepository.getServiceRevenueMix(startDate, endDate);

            const totalRevenue = serviceMix.reduce((sum, service) => sum + parseFloat(service.revenue || 0), 0);

            return {
                reportType: 'Service Performance',
                period: { startDate, endDate },
                summary: {
                    totalRevenue,
                    totalServices: serviceMix.length,
                    avgRevenuePerService: serviceMix.length > 0 ? totalRevenue / serviceMix.length : 0,
                },
                services: serviceMix.map(service => ({
                    serviceName: service.service_name,
                    category: service.category,
                    revenue: parseFloat(service.revenue || 0),
                    clientCount: parseInt(service.client_count || 0),
                    percentage: parseFloat(service.percentage || 0),
                    avgRevenuePerClient: parseInt(service.client_count || 0) > 0 ? parseFloat(service.revenue || 0) / parseInt(service.client_count || 0) : 0,
                })),
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('Error generating service performance report:', error);
            throw error;
        }
    }

    /**
     * Generate Risk & Churn Report
     */
    async generateRiskChurnReport() {
        try {
            const atRiskClients = await clientRepository.getAtRiskClients();

            const churnQuery = `
                SELECT
                    cr.*,
                    c.client_name,
                    c.project_name
                FROM churn_reasons cr
                INNER JOIN clients c ON cr.client_id = c.id
                WHERE cr.churned_at >= NOW() - INTERVAL '90 days'
                ORDER BY cr.churned_at DESC
            `;

            const { rows: churnData } = await pool.query(churnQuery);

            const atRiskRevenue = atRiskClients.reduce((sum, client) => sum + parseFloat(client.mrr || 0), 0);

            // Count churn reasons
            const churnReasons = churnData.reduce((acc, row) => {
                acc[row.reason] = (acc[row.reason] || 0) + 1;
                return acc;
            }, {});

            return {
                reportType: 'Risk & Churn',
                summary: {
                    atRiskClients: atRiskClients.length,
                    atRiskRevenue,
                    churnedLast90Days: churnData.length,
                },
                atRiskClients: atRiskClients.map(client => ({
                    id: client.id,
                    clientName: client.client_name,
                    projectName: client.project_name,
                    mrr: parseFloat(client.mrr || 0),
                })),
                churnReasons: Object.entries(churnReasons).map(([reason, count]) => ({
                    reason,
                    count,
                })),
                recentChurns: churnData.slice(0, 10).map(row => ({
                    clientName: row.client_name,
                    reason: row.reason,
                    notes: row.notes,
                    churnedAt: row.churned_at,
                })),
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('Error generating risk & churn report:', error);
            throw error;
        }
    }

    /**
     * Schedule report
     */
    async scheduleReport(scheduleData, userId) {
        try {
            const query = `
                INSERT INTO scheduled_reports (
                    report_type, configuration, frequency,
                    schedule_time, schedule_day_of_week, schedule_day_of_month,
                    recipients, format, include_note, created_by, active
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

            const { rows } = await pool.query(query, [
                scheduleData.reportType,
                JSON.stringify(scheduleData.configuration || {}),
                scheduleData.frequency,
                scheduleData.scheduleTime,
                scheduleData.scheduleDayOfWeek || null,
                scheduleData.scheduleDayOfMonth || null,
                scheduleData.recipients,
                scheduleData.format || 'PDF',
                scheduleData.includeNote || null,
                userId,
                true,
            ]);

            logger.info(`Report scheduled: ${scheduleData.reportType} by user ${userId}`);

            return rows[0];
        } catch (error) {
            logger.error('Error scheduling report:', error);
            throw error;
        }
    }

    /**
     * Get scheduled reports
     */
    async getScheduledReports(userId = null) {
        try {
            let query = `
                SELECT sr.*, u.full_name as created_by_name
                FROM scheduled_reports sr
                LEFT JOIN users u ON sr.created_by = u.id
                WHERE sr.active = true
            `;

            const values = [];
            if (userId) {
                values.push(userId);
                query += ` AND sr.created_by = $1`;
            }

            query += ` ORDER BY sr.created_at DESC`;

            const { rows } = await pool.query(query, values);
            return rows;
        } catch (error) {
            logger.error('Error getting scheduled reports:', error);
            throw error;
        }
    }

    /**
     * Delete scheduled report
     */
    async deleteScheduledReport(id, userId) {
        try {
            const query = `
                UPDATE scheduled_reports
                SET active = false, updated_at = NOW()
                WHERE id = $1
                RETURNING *
            `;

            const { rows } = await pool.query(query, [id]);

            logger.info(`Scheduled report ${id} deleted by user ${userId}`);

            return rows[0];
        } catch (error) {
            logger.error('Error deleting scheduled report:', error);
            throw error;
        }
    }
}

module.exports = new ReportService();
