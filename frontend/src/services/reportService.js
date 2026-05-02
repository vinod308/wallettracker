/**
 * Report Service
 * API calls for report generation and scheduling
 */

import api from './api';

const reportService = {
    /**
     * Generate report
     */
    async generateReport(reportData) {
        const response = await api.post('/reports/generate', reportData);
        return response.data;
    },

    /**
     * Schedule report
     */
    async scheduleReport(scheduleData) {
        const response = await api.post('/reports/schedule', scheduleData);
        return response.data;
    },

    /**
     * Get scheduled reports
     */
    async getScheduledReports(myReports = false) {
        const response = await api.get('/reports/scheduled', {
            params: myReports ? { myReports: true } : {},
        });
        return response.data;
    },

    /**
     * Delete scheduled report
     */
    async deleteScheduledReport(id) {
        const response = await api.delete(`/reports/scheduled/${id}`);
        return response.data;
    },
};

export default reportService;
