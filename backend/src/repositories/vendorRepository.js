const pool = require('../config/database');

class VendorRepository {
    async create(data) {
        const q = `
            INSERT INTO vendors (
                user_id, vendor_name, vendor_type, gst_number, pan_number,
                address, city, state, pincode, country,
                contact_person, email, mobile, alt_mobile, website,
                account_holder, bank_name, account_number, ifsc_code, upi_id, swift_code,
                onboarded_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
            RETURNING *`;
        const { rows } = await pool.query(q, [
            data.userId || null,
            data.vendorName, data.vendorType || 'Freelancer',
            data.gstNumber || null, data.panNumber || null,
            data.address || null, data.city || null, data.state || null,
            data.pincode || null, data.country || 'India',
            data.contactPerson || null, data.email || null,
            data.mobile || null, data.altMobile || null, data.website || null,
            data.accountHolder || null, data.bankName || null,
            data.accountNumber || null, data.ifscCode || null,
            data.upiId || null, data.swiftCode || null,
            data.onboardedBy || null,
        ]);
        return rows[0];
    }

    async findById(id) {
        const { rows } = await pool.query(
            'SELECT v.*, COUNT(pi.id)::int AS invoice_count, COALESCE(SUM(CASE WHEN pi.status=\'Pending\' THEN pi.total_amount ELSE 0 END),0) AS pending_amount FROM vendors v LEFT JOIN purchase_invoices pi ON v.id=pi.vendor_id WHERE v.id=$1 GROUP BY v.id',
            [id]
        );
        return rows[0] || null;
    }

    async findByUserId(userId) {
        const { rows } = await pool.query(
            'SELECT v.*, COUNT(pi.id)::int AS invoice_count FROM vendors v LEFT JOIN purchase_invoices pi ON v.id=pi.vendor_id WHERE v.user_id=$1 GROUP BY v.id',
            [userId]
        );
        return rows[0] || null;
    }

    async findAll(filters = {}) {
        let q = `SELECT v.*, COUNT(pi.id)::int AS invoice_count,
            COALESCE(SUM(CASE WHEN pi.status='Pending' THEN pi.total_amount ELSE 0 END),0) AS pending_amount
            FROM vendors v LEFT JOIN purchase_invoices pi ON v.id=pi.vendor_id WHERE 1=1`;
        const params = [];
        let idx = 1;
        if (filters.search) {
            q += ` AND (v.vendor_name ILIKE $${idx} OR v.email ILIKE $${idx} OR v.city ILIKE $${idx})`;
            params.push(`%${filters.search}%`); idx++;
        }
        if (filters.vendorType) {
            q += ` AND v.vendor_type = $${idx}`;
            params.push(filters.vendorType); idx++;
        }
        q += ' GROUP BY v.id ORDER BY v.created_at DESC';
        const { rows } = await pool.query(q, params);
        return rows;
    }

    async update(id, updates) {
        const keys = Object.keys(updates);
        if (!keys.length) return this.findById(id);
        const setClause = keys.map((k, i) => `${toSnake(k)} = $${i + 2}`).join(', ');
        const q = `UPDATE vendors SET ${setClause}, updated_at=NOW() WHERE id=$1 RETURNING *`;
        const { rows } = await pool.query(q, [id, ...Object.values(updates)]);
        return rows[0];
    }

    // Purchase Invoices
    async createInvoice(data) {
        const q = `
            INSERT INTO purchase_invoices (vendor_id, invoice_number, invoice_date, due_date, description, sub_amount, gst_rate, gst_amount, total_amount, notes)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`;
        const { rows } = await pool.query(q, [
            data.vendorId, data.invoiceNumber, data.invoiceDate,
            data.dueDate || null, data.description || null,
            data.subAmount, data.gstRate || 18,
            data.gstAmount, data.totalAmount,
            data.notes || null,
        ]);
        return rows[0];
    }

    async getInvoicesByVendorId(vendorId) {
        const { rows } = await pool.query(
            'SELECT * FROM purchase_invoices WHERE vendor_id=$1 ORDER BY created_at DESC',
            [vendorId]
        );
        return rows;
    }

    async updateInvoiceStatus(invoiceId, status) {
        const { rows } = await pool.query(
            'UPDATE purchase_invoices SET status=$2, updated_at=NOW() WHERE id=$1 RETURNING *',
            [invoiceId, status]
        );
        return rows[0] || null;
    }
}

function toSnake(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

module.exports = new VendorRepository();
