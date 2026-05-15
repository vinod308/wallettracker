/**
 * GST e-Invoice Service
 * Integrates with NIC IRP (Invoice Registration Portal) — einvoice1.gst.gov.in
 *
 * Auth flow:
 *   1. Generate a random 32-char AppKey
 *   2. POST /auth  →  receive AuthToken + Sek (Sek is AES-256-ECB encrypted with AppKey)
 *   3. Decrypt Sek using AppKey  →  session encryption key for all subsequent responses
 *   4. GET /Invoice/GetDtlsByIrn/{irn}  →  response.Info is AES-256-ECB encrypted with Sek
 *
 * Credentials required (set in .env):
 *   GST_CLIENT_ID, GST_CLIENT_SECRET  — from NIC API registration
 *   GST_USERNAME, GST_PASSWORD        — NIC portal login
 *   GST_GSTIN                         — your company GSTIN
 */

const crypto = require('crypto');
const config = require('../config/environment');
const logger = require('../utils/logger');

const NIC_BASE_URL = 'https://einvoice1.gst.gov.in/ieim/api';

class GSTService {
    constructor() {
        this.authToken   = null;
        this.sek         = null;   // decrypted session key (Base64)
        this.tokenExpiry = null;
        this.appKey      = null;
    }

    // ─── Key generation ────────────────────────────────────────────────────────

    _generateAppKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        const bytes = crypto.randomBytes(32);
        for (let i = 0; i < 32; i++) {
            key += chars[bytes[i] % chars.length];
        }
        return key; // 32 ASCII chars = 32 bytes, valid AES-256 key
    }

    // ─── AES-256-ECB crypto ────────────────────────────────────────────────────

    _decryptECB(encryptedBase64, keyStr) {
        const key       = Buffer.from(keyStr, 'utf8');          // 32 bytes
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        const decipher  = crypto.createDecipheriv('aes-256-ecb', key, null);
        decipher.setAutoPadding(true);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    }

    _decryptECBWithBase64Key(encryptedBase64, keyBase64) {
        const key       = Buffer.from(keyBase64, 'base64');
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        const decipher  = crypto.createDecipheriv('aes-256-ecb', key, null);
        decipher.setAutoPadding(true);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    }

    // ─── Token management ──────────────────────────────────────────────────────

    _isTokenValid() {
        if (!this.authToken || !this.tokenExpiry) return false;
        // tokenExpiry from NIC: "DD/MM/YYYY HH:MM:SS"
        const [datePart, timePart] = this.tokenExpiry.split(' ');
        const [day, month, year]   = datePart.split('/');
        const expiry = new Date(`${year}-${month}-${day}T${timePart}`);
        return Date.now() < expiry.getTime() - 60000; // 1-min buffer
    }

    // ─── HTTP helper ───────────────────────────────────────────────────────────

    async _request(method, path, body = null, extraHeaders = {}) {
        const url = `${NIC_BASE_URL}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            'client_id':     config.GST_CLIENT_ID     || '',
            'client_secret': config.GST_CLIENT_SECRET || '',
            ...extraHeaders,
        };

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`NIC IRP HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    // ─── Authentication ────────────────────────────────────────────────────────

    async authenticate() {
        this._validateConfig();
        this.appKey = this._generateAppKey();

        const body = {
            UserName:               config.GST_USERNAME,
            Password:               Buffer.from(config.GST_PASSWORD).toString('base64'),
            AppKey:                 this.appKey,
            ForceRefreshAccessToken: true,
        };

        logger.info('Authenticating with NIC e-Invoice portal...');
        const data = await this._request('POST', '/auth', body);

        if (data.Status !== 1 || !data.Info?.AuthToken) {
            throw new Error(
                typeof data.Info === 'string' ? data.Info : 'NIC IRP authentication failed'
            );
        }

        this.authToken   = data.Info.AuthToken;
        this.tokenExpiry = data.Info.TokenExpiry;

        // Sek is AES-256-ECB encrypted with AppKey; decrypt to get actual session key
        const sekDecrypted = this._decryptECB(data.Info.Sek, this.appKey);
        this.sek = sekDecrypted; // This is the Base64-encoded actual session key

        logger.info('GST portal authenticated successfully');
        return true;
    }

    async _ensureAuth() {
        if (!this._isTokenValid()) {
            await this.authenticate();
        }
    }

    // ─── Fetch invoice by IRN ──────────────────────────────────────────────────

    async fetchByIRN(irn) {
        if (!irn || irn.trim().length !== 64) {
            throw new Error('IRN must be exactly 64 characters');
        }

        await this._ensureAuth();

        const data = await this._request('GET', `/Invoice/GetDtlsByIrn/${irn.trim()}`, null, {
            user_name:  config.GST_USERNAME,
            AuthToken:  this.authToken,
            Gstin:      config.GST_GSTIN,
        });

        if (data.Status !== 1) {
            throw new Error(
                typeof data.Info === 'string' ? data.Info : 'Invoice not found on GST portal'
            );
        }

        // Response Info is AES-256-ECB encrypted with the decrypted Sek
        const decrypted = this._decryptECBWithBase64Key(data.Info, this.sek);
        const invoiceObj = JSON.parse(decrypted);

        return this._mapToInvoice(invoiceObj, irn.trim(), data.AckNo, data.AckDt);
    }

    // ─── Map NIC IRP schema → our schema ───────────────────────────────────────

    _mapToInvoice(d, irn, ackNo, ackDt) {
        const doc   = d.DocDtls  || {};
        const buyer = d.BuyerDtls || {};
        const val   = d.ValDtls  || {};
        const items = d.ItemList || [];

        const descriptions = items.map(i => i.PrdDesc).filter(Boolean);
        const cgstAmount   = items.reduce((s, i) => s + (i.CgstAmt || 0), 0);
        const sgstAmount   = items.reduce((s, i) => s + (i.SgstAmt || 0), 0);
        const igstAmount   = items.reduce((s, i) => s + (i.IgstAmt || 0), 0);

        return {
            invoice_number:  doc.No,
            invoice_date:    this._parseNICDate(doc.Dt),
            invoice_type:    doc.Typ === 'INV' ? 'TAX INVOICE' : doc.Typ === 'CRN' ? 'CREDIT NOTE' : 'TAX INVOICE',
            irn,
            ack_no:          ackNo  || d.AckNo  || null,
            ack_date:        ackDt  || d.AckDt  || null,
            buyer_name:      buyer.LglNm || buyer.TrdNm || null,
            buyer_gstin:     buyer.Gstin || null,
            buyer_address:   [buyer.Addr1, buyer.Addr2, buyer.Loc, buyer.Stcd, buyer.Pin]
                                .filter(Boolean).join(', ') || null,
            description:     descriptions.join('; ') || null,
            taxable_amount:  val.AssVal  || 0,
            cgst_rate:       items[0]?.CgstRt || 0,
            cgst_amount:     cgstAmount || val.CgstVal || 0,
            sgst_rate:       items[0]?.SgstRt || 0,
            sgst_amount:     sgstAmount || val.SgstVal || 0,
            igst_rate:       items[0]?.IgstRt || 0,
            igst_amount:     igstAmount || val.IgstVal || 0,
            total_amount:    val.TotInvVal || 0,
            source:          'GST Portal',
        };
    }

    // NIC date format: DD/MM/YYYY
    _parseNICDate(str) {
        if (!str) return new Date().toISOString().split('T')[0];
        const parts = str.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return str;
    }

    // ─── Connection test ───────────────────────────────────────────────────────

    async verifyConnection() {
        try {
            this._validateConfig();
            await this.authenticate();
            return { connected: true, gstin: config.GST_GSTIN, message: 'Connected to NIC e-Invoice portal' };
        } catch (err) {
            logger.warn(`GST connection test failed: ${err.message}`);
            return { connected: false, error: err.message };
        }
    }

    _validateConfig() {
        const missing = ['GST_CLIENT_ID', 'GST_CLIENT_SECRET', 'GST_USERNAME', 'GST_PASSWORD', 'GST_GSTIN']
            .filter(key => !config[key]);
        if (missing.length > 0) {
            throw new Error(`Missing GST config: ${missing.join(', ')}. Add them to your .env file.`);
        }
    }
}

module.exports = new GSTService();
