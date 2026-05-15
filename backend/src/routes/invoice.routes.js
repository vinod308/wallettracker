const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const emailService      = require('../services/emailService');
const gstService        = require('../services/gstService');
const pool              = require('../config/database');
const logger            = require('../utils/logger');

// All routes require login
router.use(authenticate);

// ─── Existing email routes ─────────────────────────────────────────────────────

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
        res.status(500).json({ success: false, message: error.message || 'Failed to send email', code: error.code });
    }
});

// ─── GST e-Invoice routes ──────────────────────────────────────────────────────

/**
 * GET /api/invoices/gst/status
 * Check if NIC IRP credentials are configured and reachable
 */
router.get('/gst/status', async (req, res) => {
    try {
        const status = await gstService.verifyConnection();
        res.json({ success: true, data: status });
    } catch (error) {
        logger.error(`GST status check failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/invoices/gst/fetch-irn
 * Body: { irn: "64-char IRN string" }
 * Fetches invoice details from the NIC IRP portal and returns parsed data.
 * Does NOT save — the caller reviews and confirms first.
 */
router.post('/gst/fetch-irn', async (req, res) => {
    try {
        const { irn } = req.body;
        if (!irn || typeof irn !== 'string' || irn.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'IRN is required' });
        }

        const invoiceData = await gstService.fetchByIRN(irn.trim());
        res.json({ success: true, data: invoiceData });
    } catch (error) {
        logger.error(`GST fetch IRN failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch from GST portal' });
    }
});

/**
 * POST /api/invoices/gst/save
 * Save a GST invoice (fetched from portal or entered manually)
 * Body: { clientId, invoice_number, invoice_date, ... all gst_invoices fields }
 */
router.post('/gst/save', async (req, res) => {
    try {
        const {
            clientId,
            invoice_number,
            invoice_date,
            invoice_type    = 'TAX INVOICE',
            irn             = null,
            ack_no          = null,
            ack_date        = null,
            buyer_name      = null,
            buyer_gstin     = null,
            buyer_address   = null,
            description     = null,
            taxable_amount  = 0,
            cgst_rate       = 0,
            cgst_amount     = 0,
            sgst_rate       = 0,
            sgst_amount     = 0,
            igst_rate       = 0,
            igst_amount     = 0,
            total_amount    = 0,
            payment_status  = 'Unpaid',
            source          = 'Manual',
        } = req.body;

        if (!clientId)       return res.status(400).json({ success: false, message: 'clientId is required' });
        if (!invoice_number) return res.status(400).json({ success: false, message: 'invoice_number is required' });
        if (!invoice_date)   return res.status(400).json({ success: false, message: 'invoice_date is required' });

        const query = `
            INSERT INTO gst_invoices (
                client_id, invoice_number, invoice_date, invoice_type,
                irn, ack_no, ack_date,
                buyer_name, buyer_gstin, buyer_address, description,
                taxable_amount, cgst_rate, cgst_amount, sgst_rate, sgst_amount,
                igst_rate, igst_amount, total_amount,
                payment_status, source, created_by
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7,
                $8, $9, $10, $11,
                $12, $13, $14, $15, $16,
                $17, $18, $19,
                $20, $21, $22
            )
            ON CONFLICT (irn) DO UPDATE SET
                payment_status = EXCLUDED.payment_status,
                updated_at     = NOW()
            RETURNING *
        `;

        const values = [
            clientId, invoice_number, invoice_date, invoice_type,
            irn || null, ack_no || null, ack_date || null,
            buyer_name, buyer_gstin, buyer_address, description,
            taxable_amount, cgst_rate, cgst_amount, sgst_rate, sgst_amount,
            igst_rate, igst_amount, total_amount,
            payment_status, source, req.user.id,
        ];

        const { rows } = await pool.query(query, values);
        res.json({ success: true, data: rows[0], message: 'GST invoice saved successfully' });
    } catch (error) {
        logger.error(`GST save invoice failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message || 'Failed to save GST invoice' });
    }
});

/**
 * GET /api/invoices/gst/client/:clientId
 * List all GST invoices for a client, newest first
 */
router.get('/gst/client/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        const { rows } = await pool.query(
            `SELECT * FROM gst_invoices WHERE client_id = $1 ORDER BY invoice_date DESC`,
            [clientId]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        logger.error(`Get GST invoices failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PATCH /api/invoices/gst/:id/payment-status
 * Update payment status for a GST invoice
 */
router.patch('/gst/:id/payment-status', async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        if (!['Paid', 'Unpaid', 'Partial'].includes(payment_status)) {
            return res.status(400).json({ success: false, message: 'Invalid payment_status' });
        }

        const { rows } = await pool.query(
            `UPDATE gst_invoices SET payment_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [payment_status, id]
        );

        if (!rows[0]) return res.status(404).json({ success: false, message: 'Invoice not found' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        logger.error(`Update payment status failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/invoices/gst/:id
 * Delete a GST invoice record
 */
router.delete('/gst/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM gst_invoices WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: 'Invoice deleted' });
    } catch (error) {
        logger.error(`Delete GST invoice failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
