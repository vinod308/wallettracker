const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/balance-sheet?fy=2025&period=full|Q1|Q2|Q3|Q4  ─────────────────
router.get('/', async (req, res) => {
    const userId = req.user.id;
    const fy     = parseInt(req.query.fy) || new Date().getFullYear();
    const period = req.query.period || 'full'; // full | Q1 | Q2 | Q3 | Q4

    // Map quarter to month range (Indian FY: Apr-Mar)
    const quarterMap = {
        Q1: [4, 6],   // Apr–Jun
        Q2: [7, 9],   // Jul–Sep
        Q3: [10, 12], // Oct–Dec
        Q4: [1, 3],   // Jan–Mar (next calendar year)
    };

    // Build date range
    let dateFrom, dateTo;
    if (period === 'full') {
        dateFrom = `${fy}-04-01`;
        dateTo   = `${fy + 1}-03-31`;
    } else {
        const [mFrom, mTo] = quarterMap[period];
        const yearFrom = mFrom >= 4 ? fy : fy + 1;
        const yearTo   = mTo   >= 4 ? fy : fy + 1;
        dateFrom = `${yearFrom}-${String(mFrom).padStart(2,'0')}-01`;
        dateTo   = `${yearTo}-${String(mTo).padStart(2,'0')}-${mTo === 3 || mTo === 12 ? 31 : 30}`;
    }

    try {
        // ── Revenue from GST invoices ────────────────────────────────────────
        const revenueRes = await pool.query(
            `SELECT
               COALESCE(SUM(total_amount),0)   AS total_revenue,
               COALESCE(SUM(taxable_amount),0) AS taxable_revenue,
               COALESCE(SUM(cgst_amount),0)    AS cgst_collected,
               COALESCE(SUM(sgst_amount),0)    AS sgst_collected,
               COALESCE(SUM(igst_amount),0)    AS igst_collected,
               COUNT(*) AS invoice_count,
               COUNT(*) FILTER (WHERE payment_status='Paid')   AS paid_count,
               COUNT(*) FILTER (WHERE payment_status='Unpaid') AS unpaid_count,
               COALESCE(SUM(total_amount) FILTER (WHERE payment_status='Paid'),0)   AS collected_revenue,
               COALESCE(SUM(total_amount) FILTER (WHERE payment_status='Unpaid'),0) AS outstanding_revenue
             FROM gst_invoices
             WHERE created_by=$1 AND invoice_date BETWEEN $2 AND $3`,
            [userId, dateFrom, dateTo]
        );

        // ── Vendor expenses (purchase invoices) ──────────────────────────────
        const vendorExpRes = await pool.query(
            `SELECT
               COALESCE(SUM(pi.total_amount),0) AS vendor_expenses,
               COALESCE(SUM(pi.gst_amount),0)   AS vendor_gst_paid,
               COUNT(*) AS vendor_invoice_count
             FROM purchase_invoices pi
             JOIN vendors v ON v.id = pi.vendor_id
             WHERE v.user_id=$1 AND pi.invoice_date BETWEEN $2 AND $3`,
            [userId, dateFrom, dateTo]
        );

        // ── Reimbursements ───────────────────────────────────────────────────
        const reimbRes = await pool.query(
            `SELECT
               COALESCE(SUM(amount),0) AS total_reimbursements,
               COALESCE(SUM(amount) FILTER (WHERE status='Approved'),0) AS approved_reimbursements,
               COUNT(*) AS reimbursement_count
             FROM reimbursements
             WHERE user_id=$1 AND expense_date BETWEEN $2 AND $3`,
            [userId, dateFrom, dateTo]
        );

        // ── Quarterly breakdown (always compute all 4 quarters of the FY) ───
        const quarterlyRes = await pool.query(
            `SELECT
               CASE
                 WHEN EXTRACT(MONTH FROM invoice_date) BETWEEN 4 AND 6  THEN 'Q1'
                 WHEN EXTRACT(MONTH FROM invoice_date) BETWEEN 7 AND 9  THEN 'Q2'
                 WHEN EXTRACT(MONTH FROM invoice_date) BETWEEN 10 AND 12 THEN 'Q3'
                 ELSE 'Q4'
               END AS quarter,
               COALESCE(SUM(total_amount),0)   AS revenue,
               COALESCE(SUM(taxable_amount),0) AS taxable,
               COUNT(*) AS invoice_count
             FROM gst_invoices
             WHERE created_by=$1
               AND invoice_date BETWEEN $2 AND $3
             GROUP BY quarter
             ORDER BY quarter`,
            [userId, `${fy}-04-01`, `${fy + 1}-03-31`]
        );

        // ── Revenue by client (top 5) ────────────────────────────────────────
        const byClientRes = await pool.query(
            `SELECT buyer_name, COALESCE(SUM(total_amount),0) AS revenue, COUNT(*) AS invoices
             FROM gst_invoices
             WHERE created_by=$1 AND invoice_date BETWEEN $2 AND $3
               AND buyer_name IS NOT NULL
             GROUP BY buyer_name
             ORDER BY revenue DESC LIMIT 5`,
            [userId, dateFrom, dateTo]
        );

        const rev     = revenueRes.rows[0];
        const vendor  = vendorExpRes.rows[0];
        const reimb   = reimbRes.rows[0];

        const totalRevenue      = parseFloat(rev.total_revenue);
        const vendorExpenses    = parseFloat(vendor.vendor_expenses);
        const reimbExpenses     = parseFloat(reimb.approved_reimbursements);
        const gstCollected      = parseFloat(rev.cgst_collected) + parseFloat(rev.sgst_collected) + parseFloat(rev.igst_collected);
        const gstPaid           = parseFloat(vendor.vendor_gst_paid);
        const gstPayable        = Math.max(0, gstCollected - gstPaid);
        const totalExpenses     = vendorExpenses + reimbExpenses;
        const netProfit         = totalRevenue - totalExpenses - gstPayable;
        const profitMargin      = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

        res.json({
            success: true,
            data: {
                period,
                fy,
                dateFrom,
                dateTo,
                revenue: {
                    total:       totalRevenue,
                    taxable:     parseFloat(rev.taxable_revenue),
                    collected:   parseFloat(rev.collected_revenue),
                    outstanding: parseFloat(rev.outstanding_revenue),
                    gstCollected,
                    invoiceCount:  parseInt(rev.invoice_count),
                    paidCount:     parseInt(rev.paid_count),
                    unpaidCount:   parseInt(rev.unpaid_count),
                },
                expenses: {
                    vendor:       vendorExpenses,
                    reimbursement: reimbExpenses,
                    total:        totalExpenses,
                    gstPaid,
                },
                gst: {
                    collected: gstCollected,
                    paid:      gstPaid,
                    payable:   gstPayable,
                },
                profitLoss: {
                    revenue:       totalRevenue,
                    expenses:      totalExpenses,
                    gstPayable,
                    netProfit,
                    profitMargin,
                },
                quarterly:  quarterlyRes.rows,
                topClients: byClientRes.rows,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET /api/balance-sheet/years  ────────────────────────────────────────────
// Return available fiscal years for which we have invoice data
router.get('/years', async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT DISTINCT
               CASE WHEN EXTRACT(MONTH FROM invoice_date) >= 4
                    THEN EXTRACT(YEAR FROM invoice_date)
                    ELSE EXTRACT(YEAR FROM invoice_date) - 1
               END AS fy
             FROM gst_invoices
             WHERE created_by=$1
             ORDER BY fy DESC`,
            [userId]
        );
        res.json({ success: true, data: result.rows.map(r => parseInt(r.fy)) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
