/**
 * Report Routes
 * API endpoints for reports and scheduling
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// All report routes require authentication
router.use(authenticate);

/**
 * POST /api/reports/generate
 * Generate report
 */
router.post('/generate', reportController.generateReport);

/**
 * POST /api/reports/schedule
 * Schedule report
 */
router.post('/schedule', reportController.scheduleReport);

/**
 * GET /api/reports/scheduled
 * Get scheduled reports
 */
router.get('/scheduled', reportController.getScheduledReports);

/**
 * DELETE /api/reports/scheduled/:id
 * Delete scheduled report
 */
router.delete('/scheduled/:id', reportController.deleteScheduledReport);

module.exports = router;
