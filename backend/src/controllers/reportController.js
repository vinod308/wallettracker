/**
 * Report Controller
 * HTTP handlers for report endpoints
 */

const reportService = require('../services/reportService');
const logger = require('../utils/logger');
const { successResponse } = require('../utils/helpers');

class ReportController {
    /**
     * POST /api/reports/generate
     * Generate report
     */
    async generateReport(req, res, next) {
        try {
            const { reportType, startDate, endDate } = req.body;

            let report;

            switch (reportType) {
                case 'Monthly Revenue':
                    report = await reportService.generateMonthlyRevenueReport(startDate, endDate);
                    break;
                case 'Client Expansion':
                    report = await reportService.generateClientExpansionReport();
                    break;
                case 'Service Performance':
                    report = await reportService.generateServicePerformanceReport(startDate, endDate);
                    break;
                case 'Risk & Churn':
                    report = await reportService.generateRiskChurnReport();
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid report type' });
            }

            logger.info(`Report generated: ${reportType} by user ${req.user.id}`);

            return res.json(successResponse('Report generated successfully', { report }));
        } catch (error) {
            logger.error('Error in generateReport:', error);
            next(error);
        }
    }

    /**
     * POST /api/reports/schedule
     * Schedule report
     */
    async scheduleReport(req, res, next) {
        try {
            const scheduleData = req.body;
            const userId = req.user.id;

            const scheduledReport = await reportService.scheduleReport(scheduleData, userId);

            logger.info(`Report scheduled by user ${userId}`);

            return res.json(successResponse('Report scheduled successfully', { scheduledReport }));
        } catch (error) {
            logger.error('Error in scheduleReport:', error);
            next(error);
        }
    }

    /**
     * GET /api/reports/scheduled
     * Get scheduled reports
     */
    async getScheduledReports(req, res, next) {
        try {
            const { myReports } = req.query;
            const userId = myReports ? req.user.id : null;

            const reports = await reportService.getScheduledReports(userId);

            logger.info(`Scheduled reports fetched by user ${req.user.id}`);

            return res.json(successResponse('Scheduled reports fetched successfully', { reports }));
        } catch (error) {
            logger.error('Error in getScheduledReports:', error);
            next(error);
        }
    }

    /**
     * DELETE /api/reports/scheduled/:id
     * Delete scheduled report
     */
    async deleteScheduledReport(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            await reportService.deleteScheduledReport(parseInt(id), userId);

            logger.info(`Scheduled report ${id} deleted by user ${userId}`);

            return res.json(successResponse('Scheduled report deleted successfully'));
        } catch (error) {
            logger.error('Error in deleteScheduledReport:', error);
            next(error);
        }
    }
}

module.exports = new ReportController();
