/**
 * Dashboard Service
 * Business logic for dashboard KPIs and analytics
 */

const clientRepository = require('../repositories/clientRepository');
const revenueRepository = require('../repositories/revenueRepository');
const contractRepository = require('../repositories/contractRepository');
const invoiceRepository = require('../repositories/invoiceRepository');
const logger = require('../utils/logger');

class DashboardService {
    /**
     * Get all KPIs for dashboard
     */
    async getKPIs(dateRange = {}) {
        try {
            const { startDate, endDate } = this._normalizeDateRange(dateRange);

            // Calculate previous period for comparison
            const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
            const previousStartDate = new Date(startDate);
            previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
            const previousEndDate = new Date(startDate);
            previousEndDate.setDate(previousEndDate.getDate() - 1);

            // Fetch all KPIs in parallel
            const [
                totalMRR,
                totalRevenue,
                activeClientsCount,
                atRiskRevenue,
                revenueComparison,
            ] = await Promise.all([
                revenueRepository.getTotalMRR(),
                revenueRepository.getTotalRevenue(startDate, endDate),
                clientRepository.getActiveCount(),
                revenueRepository.getAtRiskRevenue(),
                revenueRepository.getRevenueComparison(
                    startDate,
                    endDate,
                    previousStartDate.toISOString().split('T')[0],
                    previousEndDate.toISOString().split('T')[0]
                ),
            ]);

            // Calculate growth percentages
            const mrrGrowth = await this._calculateMRRGrowth();

            return {
                totalMRR: {
                    value: totalMRR,
                    growth: mrrGrowth,
                    label: 'Total MRR',
                    trend: mrrGrowth >= 0 ? 'up' : 'down',
                },
                totalRevenue: {
                    value: totalRevenue,
                    growth: parseFloat(revenueComparison.growth_percentage),
                    label: 'Total Revenue YTD',
                    trend: revenueComparison.growth_percentage >= 0 ? 'up' : 'down',
                },
                activeClients: {
                    value: activeClientsCount,
                    growth: 0, // TODO: Calculate client growth
                    label: 'Active Clients',
                    trend: 'neutral',
                },
                atRiskRevenue: {
                    value: atRiskRevenue,
                    percentage: totalMRR > 0 ? (atRiskRevenue / totalMRR * 100).toFixed(2) : 0,
                    label: 'At Risk Revenue',
                    trend: 'warning',
                },
            };
        } catch (error) {
            logger.error('Error fetching KPIs:', error);
            throw error;
        }
    }

    /**
     * Get client revenue overview with sorting and filtering
     */
    async getClientRevenueOverview(filters = {}) {
        try {
            const { startDate, endDate } = this._normalizeDateRange(filters);

            // Calculate previous period
            const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
            const previousStartDate = new Date(startDate);
            previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
            const previousEndDate = new Date(startDate);
            previousEndDate.setDate(previousEndDate.getDate() - 1);

            const clientData = await revenueRepository.getRevenueByClient({
                ...filters,
                startDate,
                endDate,
                previousStartDate: previousStartDate.toISOString().split('T')[0],
                previousEndDate: previousEndDate.toISOString().split('T')[0],
            });

            // Get total count for pagination
            const totalCount = await clientRepository.count({
                status: filters.status,
            });

            return {
                clients: clientData.map(client => ({
                    id: client.id,
                    clientName: client.client_name,
                    projectName: client.project_name,
                    status: client.status,
                    mrr: parseFloat(client.mrr),
                    revenue: parseFloat(client.revenue),
                    previousRevenue: parseFloat(client.prev_revenue),
                    growthPercentage: parseFloat(client.growth_percentage),
                    trend: client.trend,
                    serviceCount: parseInt(client.service_count),
                })),
                pagination: {
                    total: totalCount,
                    limit: filters.limit || 25,
                    offset: filters.offset || 0,
                },
            };
        } catch (error) {
            logger.error('Error fetching client revenue overview:', error);
            throw error;
        }
    }

    /**
     * Get service revenue mix
     */
    async getServiceRevenueMix(dateRange = {}) {
        try {
            const { startDate, endDate } = this._normalizeDateRange(dateRange);

            const serviceMix = await revenueRepository.getServiceRevenueMix(startDate, endDate);

            return serviceMix.map(service => ({
                serviceName: service.service_name,
                category: service.category,
                revenue: parseFloat(service.revenue),
                clientCount: parseInt(service.client_count),
                percentage: parseFloat(service.percentage) || 0,
            }));
        } catch (error) {
            logger.error('Error fetching service revenue mix:', error);
            throw error;
        }
    }

    /**
     * Get contracts expiring soon
     */
    async getContractsExpiring(days = 30) {
        try {
            const contracts = await contractRepository.getExpiringContracts(days);

            return contracts.map(contract => ({
                id: contract.id,
                clientName: contract.client_name,
                projectName: contract.project_name,
                endDate: contract.end_date,
                mrr: parseFloat(contract.mrr),
                daysUntilExpiry: parseInt(contract.days_until_expiry),
                renewalStatus: contract.renewal_status,
                assignedToName: contract.assigned_to_name,
                priority: contract.priority,
                autoRenew: contract.auto_renew,
            }));
        } catch (error) {
            logger.error('Error fetching expiring contracts:', error);
            throw error;
        }
    }

    /**
     * Get upsell opportunities
     */
    async getUpsellOpportunities(limit = 5) {
        try {
            const query = `
                SELECT
                    uo.*,
                    c.client_name,
                    c.project_name
                FROM upsell_opportunities uo
                INNER JOIN clients c ON uo.client_id = c.id
                WHERE uo.status IN ('Identified', 'In Progress')
                    AND c.deleted_at IS NULL
                ORDER BY
                    CASE uo.priority
                        WHEN 'High' THEN 1
                        WHEN 'Medium' THEN 2
                        WHEN 'Low' THEN 3
                    END,
                    uo.potential_gain DESC
                LIMIT $1
            `;

            const pool = require('../config/database');
            const { rows } = await pool.query(query, [limit]);

            return rows.map(opp => ({
                id: opp.id,
                clientId: opp.client_id,
                clientName: opp.client_name,
                projectName: opp.project_name,
                recommendedServices: opp.recommended_services,
                potentialGain: parseFloat(opp.potential_gain),
                probability: parseInt(opp.probability),
                priority: opp.priority,
                status: opp.status,
            }));
        } catch (error) {
            logger.error('Error fetching upsell opportunities:', error);
            throw error;
        }
    }

    /**
     * Get share of wallet analysis
     */
    async getShareOfWallet(clientId = null) {
        try {
            let query = `
                SELECT
                    c.id,
                    c.client_name,
                    c.project_name,
                    c.estimated_total_budget,
                    COALESCE(SUM(cs.monthly_amount), 0) as current_spend,
                    CASE
                        WHEN c.estimated_total_budget > 0
                        THEN ROUND((COALESCE(SUM(cs.monthly_amount), 0) / c.estimated_total_budget * 100)::numeric, 2)
                        ELSE 0
                    END as wallet_share_percentage,
                    COUNT(DISTINCT cs.service_id) as services_subscribed,
                    (SELECT COUNT(*) FROM services) as total_services_available
                FROM clients c
                LEFT JOIN client_services cs ON c.id = cs.client_id
                WHERE c.deleted_at IS NULL
                    AND c.estimated_total_budget > 0
            `;

            const values = [];
            if (clientId) {
                values.push(clientId);
                query += ` AND c.id = $1`;
            }

            query += ` GROUP BY c.id, c.client_name, c.project_name, c.estimated_total_budget
                       ORDER BY wallet_share_percentage ASC`;

            const pool = require('../config/database');
            const { rows } = await pool.query(query, values);

            return rows.map(client => ({
                id: client.id,
                clientName: client.client_name,
                projectName: client.project_name,
                estimatedTotalBudget: parseFloat(client.estimated_total_budget),
                currentSpend: parseFloat(client.current_spend),
                walletSharePercentage: parseFloat(client.wallet_share_percentage),
                servicesSubscribed: parseInt(client.services_subscribed),
                totalServicesAvailable: parseInt(client.total_services_available),
                expansionPotential: parseFloat(client.estimated_total_budget) - parseFloat(client.current_spend),
            }));
        } catch (error) {
            logger.error('Error fetching share of wallet:', error);
            throw error;
        }
    }

    /**
     * Get revenue trend over time
     */
    async getRevenueTrend(dateRange = {}, groupBy = 'month') {
        try {
            const { startDate, endDate } = this._normalizeDateRange(dateRange);

            const trend = await revenueRepository.getRevenueTrend(startDate, endDate, groupBy);

            return trend.map(point => ({
                period: point.period,
                revenue: parseFloat(point.revenue),
                clientCount: parseInt(point.client_count),
            }));
        } catch (error) {
            logger.error('Error fetching revenue trend:', error);
            throw error;
        }
    }

    /**
     * Get top revenue clients
     */
    async getTopRevenueClients(limit = 5, dateRange = {}) {
        try {
            const { startDate, endDate } = this._normalizeDateRange(dateRange);

            const clients = await revenueRepository.getTopRevenueClients(limit, startDate, endDate);

            return clients.map(client => ({
                id: client.id,
                clientName: client.client_name,
                projectName: client.project_name,
                totalRevenue: parseFloat(client.total_revenue),
                mrr: parseFloat(client.mrr),
            }));
        } catch (error) {
            logger.error('Error fetching top revenue clients:', error);
            throw error;
        }
    }

    /**
     * Get dashboard summary
     */
    async getDashboardSummary(filters = {}) {
        try {
            const [
                kpis,
                topClients,
                serviceMix,
                expiringContracts,
                upsellOpportunities,
            ] = await Promise.all([
                this.getKPIs(filters),
                this.getTopRevenueClients(5, filters),
                this.getServiceRevenueMix(filters),
                this.getContractsExpiring(30),
                this.getUpsellOpportunities(5),
            ]);

            return {
                kpis,
                topClients,
                serviceMix,
                expiringContracts,
                upsellOpportunities,
            };
        } catch (error) {
            logger.error('Error fetching dashboard summary:', error);
            throw error;
        }
    }

    /**
     * Get invoice overview for current month (from Excel CSV data)
     */
    async getInvoiceOverview(month = 'July 2025') {
        try {
            const [invoices, summary] = await Promise.all([
                invoiceRepository.getClientInvoiceRevenue(month),
                invoiceRepository.getMonthSummary(month),
            ]);

            return {
                month,
                summary: {
                    totalInvoices: parseInt(summary.total_invoices),
                    totalServiceMRR: parseFloat(summary.total_service_mrr),
                    totalAddonsMRR: parseFloat(summary.total_addons_mrr),
                    totalMRR: parseFloat(summary.total_mrr),
                    paidCount: parseInt(summary.paid_count),
                    unpaidCount: parseInt(summary.unpaid_count),
                    overdueCount: parseInt(summary.overdue_count),
                },
                clients: invoices.map(inv => ({
                    id: inv.id,
                    clientName: inv.client_name,
                    projectName: inv.project_name,
                    clientType: inv.client_type,
                    clientStatus: inv.client_status,
                    industry: inv.industry,
                    invoiceNumber: inv.invoice_number,
                    invoiceDate: inv.invoice_date,
                    contractStart: inv.contract_start,
                    servicesDescription: inv.services_description,
                    addonsDescription: inv.addons_description,
                    serviceMRR: parseFloat(inv.service_mrr || 0),
                    addonsMRR: parseFloat(inv.addons_mrr || 0),
                    totalMRR: parseFloat(inv.total_mrr || 0),
                    paymentStatus: inv.payment_status || 'No Invoice',
                    serviceCount: parseInt(inv.service_count || 0),
                })),
            };
        } catch (error) {
            logger.error('Error fetching invoice overview:', error);
            throw error;
        }
    }

    /**
     * Get multi-month overview for dashboard (April-July 2025)
     * Returns all data in one call for client-side filtering
     */
    async getMonthlyOverview() {
        try {
            const [revenueData, invoiceData] = await Promise.all([
                invoiceRepository.getMultiMonthOverview(),
                invoiceRepository.getAllInvoices(),
            ]);

            // Build invoice lookup by client_id + month
            const invoiceLookup = {};
            invoiceData.forEach(inv => {
                const key = `${inv.client_id}_${inv.invoice_month}`;
                invoiceLookup[key] = {
                    invoiceNumber: inv.invoice_number,
                    paymentStatus: inv.payment_status,
                    servicesDescription: inv.services_description,
                    addonsDescription: inv.addons_description,
                };
            });

            // Organize data by client and month
            const clientMap = {};
            const monthSet = new Set();

            revenueData.forEach(row => {
                const month = row.month;
                monthSet.add(month);

                if (!clientMap[row.id]) {
                    clientMap[row.id] = {
                        id: row.id,
                        clientName: row.client_name,
                        projectName: row.project_name,
                        clientType: row.client_type,
                        industry: row.industry,
                        status: row.client_status,
                        serviceCount: parseInt(row.service_count || 0),
                        monthlyData: {},
                    };
                }

                const invoiceKey = `${row.id}_${month}`;
                const invoiceInfo = invoiceLookup[invoiceKey] || null;

                clientMap[row.id].monthlyData[month] = {
                    serviceMRR: parseFloat(row.service_mrr || 0),
                    addonsMRR: parseFloat(row.addons_mrr || 0),
                    totalMRR: parseFloat(row.total_mrr || 0),
                    invoiceNumber: invoiceInfo?.invoiceNumber || null,
                    paymentStatus: invoiceInfo?.paymentStatus || null,
                };
            });

            // Sort months chronologically
            const monthOrder = ['April 2025', 'May 2025', 'June 2025', 'July 2025'];
            const months = monthOrder.filter(m => monthSet.has(m));

            // Build per-month summary
            const summary = {};
            months.forEach(month => {
                let totalServiceMRR = 0;
                let totalAddonsMRR = 0;
                let totalMRR = 0;
                let activeClients = 0;
                let atRiskClients = 0;
                let paidCount = 0;
                let totalInvoices = 0;

                Object.values(clientMap).forEach(client => {
                    const md = client.monthlyData[month];
                    if (md) {
                        totalServiceMRR += md.serviceMRR;
                        totalAddonsMRR += md.addonsMRR;
                        totalMRR += md.totalMRR;
                        if (client.status === 'Active') activeClients++;
                        if (client.status === 'At Risk') atRiskClients++;
                        if (md.invoiceNumber) totalInvoices++;
                        if (md.paymentStatus === 'Paid') paidCount++;
                    }
                });

                summary[month] = {
                    totalServiceMRR,
                    totalAddonsMRR,
                    totalMRR,
                    activeClients,
                    atRiskClients,
                    totalInvoices,
                    paidCount,
                };
            });

            return {
                months,
                clients: Object.values(clientMap),
                summary,
            };
        } catch (error) {
            logger.error('Error fetching monthly overview:', error);
            throw error;
        }
    }

    /**
     * Private: Normalize date range
     */
    _normalizeDateRange(dateRange) {
        const today = new Date();
        let startDate, endDate;

        if (dateRange.startDate && dateRange.endDate) {
            // Custom range
            startDate = dateRange.startDate;
            endDate = dateRange.endDate;
        } else if (dateRange.period === 'this_month') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
        } else if (dateRange.period === 'last_3_months') {
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            startDate = threeMonthsAgo.toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
        } else if (dateRange.period === 'ytd') {
            startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
        } else {
            // Default: current year
            startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
            endDate = today.toISOString().split('T')[0];
        }

        return { startDate, endDate };
    }

    /**
     * Private: Calculate MRR growth
     */
    async _calculateMRRGrowth() {
        try {
            // Get current month MRR
            const today = new Date();
            const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const currentMonthEnd = today.toISOString().split('T')[0];

            // Get previous month MRR
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const previousMonthStart = lastMonth.toISOString().split('T')[0];
            const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];

            const currentMRR = await revenueRepository.getTotalMRR({
                startDate: currentMonthStart,
                endDate: currentMonthEnd,
            });

            const previousMRR = await revenueRepository.getTotalMRR({
                startDate: previousMonthStart,
                endDate: previousMonthEnd,
            });

            if (previousMRR === 0) return 0;

            return parseFloat(((currentMRR - previousMRR) / previousMRR * 100).toFixed(2));
        } catch (error) {
            logger.error('Error calculating MRR growth:', error);
            return 0;
        }
    }
}

module.exports = new DashboardService();
