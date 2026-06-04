const express = require('express');
const router  = express.Router();
const { authenticate }   = require('../middleware/auth');
const emailService       = require('../services/emailService');
const gstService         = require('../services/gstService');
const mastersIndiaService = require('../services/mastersIndiaService');
const pool               = require('../config/database');
const logger             = require('../utils/logger');

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
        // Return a generic message — never leak raw SMTP errors to the client
        res.status(500).json({ success: false, message: 'Email delivery failed. The invoice was saved and PDF downloaded successfully.' });
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
            invoice_type       = 'TAX INVOICE',
            irn                = null,
            ack_no             = null,
            ack_date           = null,
            buyer_name         = null,
            buyer_gstin        = null,
            buyer_address      = null,
            description        = null,
            taxable_amount     = 0,
            cgst_rate          = 0,
            cgst_amount        = 0,
            sgst_rate          = 0,
            sgst_amount        = 0,
            igst_rate          = 0,
            igst_amount        = 0,
            total_amount       = 0,
            payment_status     = 'Unpaid',
            source             = 'Manual',
            hsn_code           = null,
            signed_qr          = null,
            supply_type        = 'B2B',
            buyer_state_code   = null,
            buyer_pin          = null,
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
                payment_status, source, created_by,
                hsn_code, signed_qr, supply_type, buyer_state_code, buyer_pin
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7,
                $8, $9, $10, $11,
                $12, $13, $14, $15, $16,
                $17, $18, $19,
                $20, $21, $22,
                $23, $24, $25, $26, $27
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
            hsn_code, signed_qr, supply_type, buyer_state_code, buyer_pin,
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

// ─── Masters India GSP — IRN Generation routes ────────────────────────────────

/**
 * GET /api/invoices/gst/mi/status
 * Test Masters India API connection with sandbox credentials
 */
router.get('/gst/mi/status', async (req, res) => {
    try {
        const status = await mastersIndiaService.verifyConnection();
        res.json({ success: true, data: status });
    } catch (error) {
        logger.error(`Masters India status check failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/invoices/gst/mi/generate
 * Generate IRN via Masters India API and save to DB
 * Body: { clientId, invoiceNumber, invoiceDate, invoiceType, supplyType,
 *         sellerGstin, sellerName, sellerAddr1, sellerCity, sellerStateCode, sellerPin,
 *         buyerGstin, buyerName, buyerAddr1, buyerCity, buyerStateCode, buyerPin,
 *         description, hsnCode, taxableAmount, gstRate }
 */
router.post('/gst/mi/generate', async (req, res) => {
    try {
        const {
            clientId,
            invoiceNumber,
            invoiceDate,
            invoiceType      = 'INV',
            supplyType       = 'B2B',
            sellerGstin,
            sellerName,
            sellerAddr1,
            sellerCity,
            sellerStateCode,
            sellerPin,
            buyerGstin,
            buyerName,
            buyerAddr1,
            buyerCity,
            buyerStateCode,
            buyerPin,
            description      = 'Digital Marketing Services',
            hsnCode          = '998361',
            taxableAmount,
            gstRate          = 18,
            // E-Way Bill fields (optional)
            generateEwb        = false,
            ewbDistance        = 0,
            ewbTransMode       = '1',
            ewbTransporterId   = '',
            ewbTransporterName = '',
            ewbVehNo           = '',
            ewbVehType         = 'R',
            ewbTransDocNo      = '',
            ewbTransDocDate    = '',
        } = req.body;

        if (!clientId)        return res.status(400).json({ success: false, message: 'clientId is required' });
        if (!invoiceNumber)   return res.status(400).json({ success: false, message: 'invoiceNumber is required' });
        if (!invoiceDate)     return res.status(400).json({ success: false, message: 'invoiceDate is required' });
        if (!taxableAmount)   return res.status(400).json({ success: false, message: 'taxableAmount is required' });
        if (!buyerGstin)      return res.status(400).json({ success: false, message: 'buyerGstin is required' });

        // Generate IRN via Masters India (EWB embedded in same request when generateEwb=true)
        const ewbPayload = generateEwb ? {
            distance:        ewbDistance,
            transMode:       ewbTransMode,
            transporterId:   ewbTransporterId,
            transporterName: ewbTransporterName,
            vehNo:           ewbVehNo,
            vehType:         ewbVehType,
            transDocNo:      ewbTransDocNo,
            transDocDate:    ewbTransDocDate,
        } : null;

        const irnResult = await mastersIndiaService.generateIRN({
            invoiceNumber, invoiceDate, invoiceType, supplyType,
            sellerGstin, sellerName, sellerAddr1, sellerCity, sellerStateCode, sellerPin,
            buyerGstin, buyerName, buyerAddr1, buyerCity, buyerStateCode, buyerPin,
            description, hsnCode, taxableAmount, gstRate,
        }, ewbPayload);

        // EWB data comes back in irnResult when ewaybill_details were included in the IRN payload
        const ewbResult = irnResult.ewb_no ? {
            ewb_no:         irnResult.ewb_no,
            ewb_date:       irnResult.ewb_date,
            ewb_valid_upto: irnResult.ewb_valid_upto,
        } : null;

        if (generateEwb && !ewbResult) {
            logger.warn(`EWB was requested but not returned for invoice ${invoiceNumber}`);
        }

        // Compute tax amounts for DB storage
        const sameState = sellerStateCode === buyerStateCode;
        const taxable   = parseFloat(taxableAmount);
        const halfRate  = gstRate / 2;
        const cgstAmt   = sameState ? parseFloat(((taxable * halfRate) / 100).toFixed(2)) : 0;
        const sgstAmt   = sameState ? parseFloat(((taxable * halfRate) / 100).toFixed(2)) : 0;
        const igstAmt   = sameState ? 0 : parseFloat(((taxable * gstRate) / 100).toFixed(2));
        const totalAmt  = parseFloat((taxable + cgstAmt + sgstAmt + igstAmt).toFixed(2));

        // Save to DB
        const { rows } = await pool.query(`
            INSERT INTO gst_invoices (
                client_id, invoice_number, invoice_date, invoice_type,
                irn, ack_no, ack_date,
                buyer_name, buyer_gstin, buyer_address, description,
                taxable_amount, cgst_rate, cgst_amount, sgst_rate, sgst_amount,
                igst_rate, igst_amount, total_amount,
                payment_status, source, created_by,
                hsn_code, signed_qr, supply_type, buyer_state_code, buyer_pin,
                ewb_no, ewb_date, ewb_valid_upto,
                ewb_trans_mode, ewb_veh_no, ewb_veh_type, ewb_transporter_name, ewb_distance
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7,
                $8, $9, $10, $11,
                $12, $13, $14, $15, $16,
                $17, $18, $19,
                $20, $21, $22,
                $23, $24, $25, $26, $27,
                $28, $29, $30,
                $31, $32, $33, $34, $35
            )
            ON CONFLICT (invoice_number) DO UPDATE SET
                irn                  = EXCLUDED.irn,
                ack_no               = EXCLUDED.ack_no,
                ack_date             = EXCLUDED.ack_date,
                signed_qr            = EXCLUDED.signed_qr,
                ewb_no               = EXCLUDED.ewb_no,
                ewb_date             = EXCLUDED.ewb_date,
                ewb_valid_upto       = EXCLUDED.ewb_valid_upto,
                ewb_trans_mode       = EXCLUDED.ewb_trans_mode,
                ewb_veh_no           = EXCLUDED.ewb_veh_no,
                ewb_veh_type         = EXCLUDED.ewb_veh_type,
                ewb_transporter_name = EXCLUDED.ewb_transporter_name,
                ewb_distance         = EXCLUDED.ewb_distance,
                source               = EXCLUDED.source,
                updated_at           = NOW()
            RETURNING *
        `, [
            clientId, invoiceNumber, invoiceDate, invoiceType === 'INV' ? 'TAX INVOICE' : invoiceType,
            irnResult.irn, irnResult.ack_no, irnResult.ack_date,
            buyerName, buyerGstin, buyerAddr1, description,
            taxable, sameState ? halfRate : 0, cgstAmt,
            sameState ? halfRate : 0, sgstAmt,
            sameState ? 0 : gstRate, igstAmt, totalAmt,
            'Unpaid', 'Masters India', req.user.id,
            hsnCode, irnResult.signed_qr, supplyType, buyerStateCode, buyerPin,
            ewbResult?.ewb_no || null, ewbResult?.ewb_date || null, ewbResult?.ewb_valid_upto || null,
            ewbResult ? ewbTransMode   : null,
            ewbResult ? ewbVehNo       : null,
            ewbResult ? ewbVehType     : null,
            ewbResult ? ewbTransporterName : null,
            ewbResult ? (parseInt(ewbDistance) || 0) : null,
        ]);

        logger.info(`IRN generated and saved: ${irnResult.irn} for invoice ${invoiceNumber}`);
        res.json({
            success: true,
            message: ewbResult ? 'IRN and E-Way Bill generated successfully' : 'IRN generated successfully',
            data: {
                ...rows[0],
                pdf_url: irnResult.pdf_url,
                qr_url:  irnResult.qr_url,
                ewb_no:         ewbResult?.ewb_no         || null,
                ewb_date:       ewbResult?.ewb_date        || null,
                ewb_valid_upto: ewbResult?.ewb_valid_upto  || null,
            },
        });
    } catch (error) {
        logger.error(`Masters India generate IRN failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/invoices/gst/mi/cancel
 * Cancel an IRN within 24 hours
 * Body: { irn, cancelReason, cancelRemarks }
 */
router.post('/gst/mi/cancel', async (req, res) => {
    try {
        const { irn, cancelReason = '4', cancelRemarks = 'Cancelled by user' } = req.body;
        if (!irn) return res.status(400).json({ success: false, message: 'irn is required' });

        const result = await mastersIndiaService.cancelIRN(irn, cancelReason, cancelRemarks);

        await pool.query(
            `UPDATE gst_invoices SET source = 'Cancelled', updated_at = NOW() WHERE irn = $1`,
            [irn]
        );

        res.json({ success: true, message: 'IRN cancelled successfully', data: result });
    } catch (error) {
        logger.error(`Masters India cancel IRN failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/invoices/gst/mi/generate-ewb
 * Generate an E-Way Bill for an invoice that already has an IRN but no EWB.
 * Body: { invoiceId, irn, ewbDistance, ewbTransMode, ewbTransporterId,
 *         ewbTransporterName, ewbVehNo, ewbVehType, ewbTransDocNo, ewbTransDocDate }
 */
router.post('/gst/mi/generate-ewb', async (req, res) => {
    try {
        const {
            invoiceId,
            irn,
            ewbDistance        = 0,
            ewbTransMode       = '1',
            ewbTransporterId   = '',
            ewbTransporterName = '',
            ewbVehNo           = '',
            ewbVehType         = 'R',
            ewbTransDocNo      = '',
            ewbTransDocDate    = '',
        } = req.body;

        if (!invoiceId) return res.status(400).json({ success: false, message: 'invoiceId is required' });
        if (!irn)       return res.status(400).json({ success: false, message: 'irn is required' });

        const ewbResult = await mastersIndiaService.generateEWBFromIRN(irn, {
            distance:        ewbDistance,
            transMode:       ewbTransMode,
            transporterId:   ewbTransporterId,
            transporterName: ewbTransporterName,
            vehNo:           ewbVehNo,
            vehType:         ewbVehType,
            transDocNo:      ewbTransDocNo,
            transDocDate:    ewbTransDocDate,
        });

        const { rows } = await pool.query(`
            UPDATE gst_invoices
            SET ewb_no               = $1,
                ewb_date             = $2,
                ewb_valid_upto       = $3,
                ewb_trans_mode       = $4,
                ewb_veh_no           = $5,
                ewb_veh_type         = $6,
                ewb_transporter_name = $7,
                ewb_distance         = $8,
                updated_at           = NOW()
            WHERE id = $9
            RETURNING *
        `, [
            ewbResult.ewb_no, ewbResult.ewb_date, ewbResult.ewb_valid_upto,
            ewbTransMode, ewbVehNo || null, ewbVehType,
            ewbTransporterName || null, parseInt(ewbDistance) || null,
            invoiceId,
        ]);

        if (!rows[0]) return res.status(404).json({ success: false, message: 'Invoice not found' });

        logger.info(`EWB generated separately: ${ewbResult.ewb_no} for invoice id ${invoiceId}`);
        res.json({
            success: true,
            message: 'E-Way Bill generated successfully',
            data:    rows[0],
        });
    } catch (error) {
        logger.error(`Generate EWB separately failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/invoices/gst/mi/gstin/:gstin
 * Validate and lookup a GSTIN via Masters India API
 */
router.get('/gst/mi/gstin/:gstin', async (req, res) => {
    try {
        const { gstin } = req.params;
        const data = await mastersIndiaService.getGSTINDetails(gstin);
        res.json({ success: true, data });
    } catch (error) {
        logger.error(`Masters India GSTIN lookup failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
