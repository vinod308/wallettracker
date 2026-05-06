const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

router.use(authenticate);

router.post('/send-reminder', async (req, res) => {
    try {
        const { invoice, client, pdfBase64, daysPast } = req.body;
        if (!invoice || !pdfBase64 || !daysPast) {
            return res.status(400).json({ success: false, message: 'Invoice, PDF, and daysPast are required' });
        }
        await emailService.sendReminderEmail(invoice, client, pdfBase64, daysPast);
        res.json({ success: true, message: `${daysPast}-day reminder sent` });
    } catch (error) {
        logger.error(`Reminder email failed: ${error.message || error}`);
        res.status(500).json({ success: false, message: error.message || 'Failed to send reminder', code: error.code });
    }
});

router.post('/send-email', async (req, res) => {
    try {
        const { invoice, client, pdfBase64 } = req.body;

        if (!invoice || !pdfBase64) {
            return res.status(400).json({ success: false, message: 'Invoice data and PDF are required' });
        }

        await emailService.sendInvoiceEmail(invoice, client, pdfBase64);
        res.json({ success: true, message: 'Invoice email sent successfully' });
    } catch (error) {
        logger.error(`Invoice email send failed: ${error.message || error}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send email',
            code: error.code,
        });
    }
});

module.exports = router;
