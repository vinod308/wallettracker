/**
 * Masters India GSP Service
 * Enterprise E-Invoice API integration for automated IRN generation.
 *
 * Auth flow:
 *   POST /token-auth/  →  { token: "JWT..." }
 *   All subsequent requests: Authorization: JWT <token>
 *
 * Required env vars:
 *   MI_USERNAME  — Masters India API username
 *   MI_PASSWORD  — Masters India API password
 *   MI_ENV       — 'sandbox' | 'production'  (default: sandbox)
 */

const config = require('../config/environment');
const logger = require('../utils/logger');

const MI_URLS = {
    sandbox:    'https://sandb-api.mastersindia.co/api/v1',
    production: 'https://api.mastersindia.co/api/v1',
};

class MastersIndiaService {
    constructor() {
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    get baseUrl() {
        return config.MI_ENV === 'production' ? MI_URLS.production : MI_URLS.sandbox;
    }

    // ─── Token management ──────────────────────────────────────────────────────

    _decodeJWTExpiry(token) {
        try {
            const payload = JSON.parse(
                Buffer.from(token.split('.')[1], 'base64url').toString()
            );
            return payload.exp ? payload.exp * 1000 : Date.now() + 3600000;
        } catch {
            return Date.now() + 3600000;
        }
    }

    _isTokenValid() {
        if (!this.accessToken || !this.tokenExpiry) return false;
        return Date.now() < this.tokenExpiry - 60000;
    }

    // ─── HTTP helper ───────────────────────────────────────────────────────────

    async _request(method, path, body = null, requiresAuth = true) {
        if (requiresAuth) await this._ensureAuth();

        const url     = `${this.baseUrl}${path}`;
        const headers = { 'Content-Type': 'application/json' };
        if (requiresAuth && this.accessToken) {
            headers['Authorization'] = `JWT ${this.accessToken}`;
        }

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error(`Masters India API HTTP ${response.status}: invalid JSON response`);
        }

        if (!response.ok) {
            const msg = data?.detail || data?.message || data?.error
                || (Array.isArray(data) ? data[0] : null)
                || `HTTP ${response.status}`;
            throw new Error(`Masters India API error: ${msg}`);
        }

        // All API responses are wrapped in { results: { status, message, errorMessage } }
        if (data.results) {
            if (data.results.status === 'Failed') {
                throw new Error(`Masters India: ${data.results.errorMessage || 'Unknown error'}`);
            }
            return data.results;
        }

        return data;
    }

    // ─── Authentication ────────────────────────────────────────────────────────

    async authenticate() {
        this._validateConfig();
        logger.info('Authenticating with Masters India API...');

        const url = `${this.baseUrl}/token-auth/`;
        const response = await fetch(url, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                username: config.MI_USERNAME,
                password: config.MI_PASSWORD,
            }),
        });

        let data;
        try { data = await response.json(); } catch {
            throw new Error('Masters India auth failed: invalid JSON response');
        }

        if (!response.ok || !data.token) {
            const msg = data?.error || data?.detail || `HTTP ${response.status}`;
            throw new Error(`Masters India authentication failed: ${msg}`);
        }

        this.accessToken = data.token;
        this.tokenExpiry = this._decodeJWTExpiry(data.token);
        logger.info(`Masters India authenticated (env: ${config.MI_ENV || 'sandbox'})`);
        return true;
    }

    async _ensureAuth() {
        if (!this._isTokenValid()) await this.authenticate();
    }

    // ─── Generate IRN ──────────────────────────────────────────────────────────

    /**
     * Generate an IRN (Invoice Reference Number) for a B2B service invoice.
     * @param {Object} invoiceData  Fields from the "Generate GST Invoice" form
     * @returns {{ irn, ack_no, ack_date, signed_qr, pdf_url, qr_url }}
     */
    async generateIRN(invoiceData) {
        const payload = this._buildPayload(invoiceData);
        logger.info(`Generating IRN via Masters India for invoice: ${invoiceData.invoiceNumber}`);

        const results = await this._request('POST', '/einvoice/', payload);
        const msg     = results.message;

        if (!msg || (!msg.Irn && !msg.irn)) {
            throw new Error(`IRN generation failed: ${results.errorMessage || JSON.stringify(msg)}`);
        }

        return {
            irn:        msg.Irn        || msg.irn,
            ack_no:     msg.AckNo      || msg.ack_no    || null,
            ack_date:   msg.AckDt      || msg.ack_date  || null,
            signed_qr:  msg.SignedQRCode || null,
            pdf_url:    msg.EinvoicePdf || null,
            qr_url:     msg.QRCodeUrl   || null,
        };
    }

    // ─── Cancel IRN ───────────────────────────────────────────────────────────

    /**
     * Cancel an IRN within 24 hours of generation.
     * cancel_reason: "1"=Duplicate, "2"=Data entry mistake, "3"=Order cancelled, "4"=Others
     */
    async cancelIRN(irn, cancelReason = '4', cancelRemarks = 'Cancelled by user', userGstin = null) {
        this._validateConfig();
        logger.info(`Cancelling IRN: ${irn}`);

        const results = await this._request('POST', '/cancel-einvoice/', {
            user_gstin:      userGstin || config.GST_GSTIN,
            irn,
            cancel_reason:   String(cancelReason),
            cancel_remarks:  cancelRemarks,
            ewaybill_cancel: '',
        });

        const msg = results.message;
        if (!msg || (!msg.CancelDate && !msg.cancel_date)) {
            throw new Error(`IRN cancellation failed: ${results.errorMessage || JSON.stringify(msg)}`);
        }

        return {
            cancelled:   true,
            cancel_date: msg.CancelDate || msg.cancel_date,
            irn:         msg.Irn || irn,
        };
    }

    // ─── Fetch IRN details ─────────────────────────────────────────────────────

    async fetchByIRN(irn) {
        this._validateConfig();
        logger.info(`Fetching invoice by IRN from Masters India: ${irn}`);
        const results = await this._request(
            'GET',
            `/get-einvoice?gstin=${config.GST_GSTIN}&irn=${irn}`
        );
        return results.message;
    }

    async fetchByDocDetails(docType, docNumber, docDate) {
        this._validateConfig();
        logger.info(`Fetching invoice by doc details: ${docNumber}`);
        const params = `user_gstin=${config.GST_GSTIN}&document_type=${docType}&document_number=${encodeURIComponent(docNumber)}&document_date=${encodeURIComponent(docDate)}`;
        const results = await this._request('GET', `/get-einvoice-bydoc?${params}`);
        return results.message;
    }

    // ─── GSTIN lookup ─────────────────────────────────────────────────────────

    async getGSTINDetails(gstin) {
        this._validateConfig();
        logger.info(`Looking up GSTIN: ${gstin}`);
        const results = await this._request(
            'GET',
            `/get-gstin-details?user_gstin=${config.GST_GSTIN}&gstin=${gstin}`
        );
        return results.message;
    }

    // ─── Connection test ───────────────────────────────────────────────────────

    async verifyConnection() {
        try {
            this._validateConfig();
            await this.authenticate();
            return {
                connected: true,
                env:       config.MI_ENV || 'sandbox',
                message:   `Connected to Masters India API (${config.MI_ENV || 'sandbox'})`,
            };
        } catch (err) {
            logger.warn(`Masters India connection test failed: ${err.message}`);
            return { connected: false, error: err.message };
        }
    }

    // ─── Build API payload (Masters India format) ──────────────────────────────

    _buildPayload(d) {
        this._validateConfig();

        // Date format: YYYY-MM-DD → DD/MM/YYYY
        const fmtDate = (iso) => {
            if (!iso) return '';
            const [yr, mo, day] = iso.split('-');
            return day ? `${day}/${mo}/${yr}` : iso;
        };

        // Masters India requires a valid 6-digit pincode (100000–999999).
        // If the caller doesn't supply one, fall back to 110001 (New Delhi).
        const safePin = (raw) => {
            const p = parseInt(raw);
            return (p >= 100000 && p <= 999999) ? p : 110001;
        };

        // In sandbox mode substitute real GSTINs/pincodes with Masters India test values.
        // Remove this block once production credentials are configured (MI_ENV=production).
        const isSandbox = config.MI_ENV !== 'production';
        const sellerGstin     = isSandbox ? '05AAAPG7885R002' : (d.sellerGstin || config.GST_GSTIN);
        const buyerGstin      = isSandbox ? '09AAAPG7885R002' : d.buyerGstin;
        const sellerStateCode = isSandbox ? '05' : d.sellerStateCode;
        const buyerStateCode  = isSandbox ? '09' : d.buyerStateCode;
        // State-05 (Uttarakhand) pincode; State-09 (UP) pincode
        const sellerPin = isSandbox ? 248001 : safePin(d.sellerPin);
        const buyerPin  = isSandbox ? 201301 : safePin(d.buyerPin);

        // Service SAC codes must be 6 digits starting with 99 (e.g. 998361 = IT services).
        const safeHsn = (raw) => /^99\d{4}$/.test(String(raw || '').trim()) ? String(raw).trim() : '998361';

        // Tax split: same state = CGST+SGST; different state = IGST
        const sameState = sellerStateCode === buyerStateCode;
        const gstRate   = parseFloat(d.gstRate || 18);
        const halfRate  = gstRate / 2;
        const taxable   = parseFloat(d.taxableAmount || 0);

        const cgstAmt = sameState ? parseFloat(((taxable * halfRate) / 100).toFixed(2)) : 0;
        const sgstAmt = sameState ? parseFloat(((taxable * halfRate) / 100).toFixed(2)) : 0;
        const igstAmt = sameState ? 0 : parseFloat(((taxable * gstRate) / 100).toFixed(2));
        const totalAmt = parseFloat((taxable + cgstAmt + sgstAmt + igstAmt).toFixed(2));

        // IRP credentials — required by Masters India to submit to NIC on your behalf.
        // Set MI_IRP_USERNAME / MI_IRP_PASSWORD in .env (same as your NIC e-invoice login).
        const irpCreds = {};
        if (config.MI_IRP_USERNAME) irpCreds.einvoice_username = config.MI_IRP_USERNAME;
        if (config.MI_IRP_PASSWORD) irpCreds.einvoice_password = config.MI_IRP_PASSWORD;

        return {
            user_gstin:  sellerGstin,
            data_source: 'erp',
            ...irpCreds,

            transaction_details: {
                supply_type:      d.supplyType      || 'B2B',
                charge_type:      'N',
                igst_on_intra:    'N',
                ecommerce_gstin:  '',
            },

            document_details: {
                document_type:   d.invoiceType   || 'INV',
                document_number: d.invoiceNumber,
                document_date:   fmtDate(d.invoiceDate),
            },

            seller_details: {
                gstin:        sellerGstin,
                legal_name:   d.sellerName,
                trade_name:   d.sellerTradeName || d.sellerName,
                address1:     d.sellerAddr1     || 'India',
                address2:     d.sellerAddr2     || '',
                location:     d.sellerCity      || 'India',
                pincode:      sellerPin,
                state_code:   sellerStateCode,
                phone_number: d.sellerPhone     || '',
                email:        d.sellerEmail     || '',
            },

            buyer_details: {
                gstin:           buyerGstin,
                legal_name:      d.buyerName,
                trade_name:      d.buyerTradeName || d.buyerName,
                place_of_supply: buyerStateCode,
                address1:        d.buyerAddr1    || d.buyerName,
                address2:        d.buyerAddr2    || '',
                location:        d.buyerCity     || 'India',
                pincode:         buyerPin,
                state_code:      buyerStateCode,
                phone_number:    d.buyerPhone    || '',
                email:           d.buyerEmail    || '',
            },

            value_details: {
                total_assessable_value:             taxable,
                total_cgst_value:                   cgstAmt,
                total_sgst_value:                   sgstAmt,
                total_igst_value:                   igstAmt,
                total_cess_value:                   0,
                total_cess_value_of_state:          0,
                total_discount:                     0,
                total_other_charge:                 0,
                total_invoice_value:                totalAmt,
                round_off_amount:                   0,
                total_invoice_value_additional_currency: 0,
            },

            item_list: [{
                item_serial_number:    '1',
                product_description:   d.description     || 'Digital Marketing Services',
                is_service:            'Y',
                hsn_code:              safeHsn(d.hsnCode),
                quantity:              1,
                free_quantity:         0,
                unit:                  'NOS',
                unit_price:            taxable,
                total_amount:          taxable,
                discount:              0,
                pre_tax_value:         0,
                other_charge:          0,
                assessable_value:      taxable,
                gst_rate:              gstRate,
                igst_amount:           igstAmt,
                cgst_amount:           cgstAmt,
                sgst_amount:           sgstAmt,
                cess_rate:             0,
                cess_amount:           0,
                cess_nonadvol_amount:  0,
                state_cess_rate:       0,
                state_cess_amount:     0,
                state_cess_nonadvol_amount: 0,
                total_item_value:      totalAmt,
            }],
        };
    }

    _validateConfig() {
        const missing = ['MI_USERNAME', 'MI_PASSWORD', 'GST_GSTIN'].filter(k => !config[k]);
        if (missing.length > 0) {
            throw new Error(
                `Masters India config missing: ${missing.join(', ')}. Add to your .env file.`
            );
        }
    }
}

module.exports = new MastersIndiaService();
