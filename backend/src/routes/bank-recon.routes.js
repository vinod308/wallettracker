const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── POST /api/bank-recon/upload  ─────────────────────────────────────────────
// Body: { statementName, bankName, periodFrom, periodTo, transactions: [{date, description, credit, debit, balance}] }
router.post('/upload', async (req, res) => {
    const userId = req.user.id;
    const { statementName, bankName, periodFrom, periodTo, transactions = [] } = req.body;

    if (!transactions.length) {
        return res.status(400).json({ success: false, message: 'No transactions provided' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fetch user's GST invoices for matching
        const invoicesRes = await client.query(
            `SELECT id, invoice_number, invoice_date, total_amount
             FROM gst_invoices
             WHERE created_by = $1 AND payment_status != 'Cancelled'`,
            [userId]
        );
        const invoices = invoicesRes.rows;

        // 2. Match each transaction against invoices
        let matchedCount = 0, unmatchedCount = 0, discrepancyCount = 0;
        let totalCredited = 0;

        const enriched = transactions.map(txn => {
            const credit = parseFloat(txn.credit) || 0;
            const debit  = parseFloat(txn.debit)  || 0;
            totalCredited += credit;

            if (credit === 0) {
                unmatchedCount++;
                return { ...txn, match_status: 'Debit', matched_invoice_id: null, matched_invoice_number: null, difference_amount: 0 };
            }

            // Try to find matching invoice: amount within 1% AND date within 10 days
            const txnDate = new Date(txn.date);
            let best = null;
            let bestDiff = Infinity;

            for (const inv of invoices) {
                const invAmt  = parseFloat(inv.total_amount);
                const invDate = new Date(inv.invoice_date);
                const dayDiff = Math.abs((txnDate - invDate) / (1000 * 60 * 60 * 24));
                const amtDiff = Math.abs(credit - invAmt);
                const pctDiff = invAmt > 0 ? amtDiff / invAmt : 1;

                if (dayDiff <= 10 && pctDiff <= 0.02 && amtDiff < bestDiff) {
                    bestDiff = amtDiff;
                    best = inv;
                }
            }

            if (best) {
                const diff = Math.round((credit - parseFloat(best.total_amount)) * 100) / 100;
                if (diff === 0) {
                    matchedCount++;
                    return { ...txn, match_status: 'Matched', matched_invoice_id: best.id, matched_invoice_number: best.invoice_number, difference_amount: 0 };
                } else {
                    discrepancyCount++;
                    return { ...txn, match_status: 'Difference', matched_invoice_id: best.id, matched_invoice_number: best.invoice_number, difference_amount: diff };
                }
            }

            unmatchedCount++;
            return { ...txn, match_status: 'Unmatched', matched_invoice_id: null, matched_invoice_number: null, difference_amount: credit };
        });

        // 3. Insert statement header
        const stmtRes = await client.query(
            `INSERT INTO bank_statements
               (user_id, statement_name, bank_name, period_from, period_to,
                total_transactions, matched_count, unmatched_count, discrepancy_count, total_credited)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
            [userId, statementName || `Statement ${new Date().toLocaleDateString('en-IN')}`,
             bankName || 'Bank', periodFrom || null, periodTo || null,
             transactions.length, matchedCount, unmatchedCount, discrepancyCount, totalCredited]
        );
        const statementId = stmtRes.rows[0].id;

        // 4. Insert transactions
        for (const t of enriched) {
            await client.query(
                `INSERT INTO bank_transactions
                   (statement_id, txn_date, description, credit_amount, debit_amount, balance,
                    match_status, matched_invoice_id, matched_invoice_number, difference_amount)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [statementId,
                 t.date || null,
                 t.description || '',
                 parseFloat(t.credit) || 0,
                 parseFloat(t.debit)  || 0,
                 parseFloat(t.balance) || null,
                 t.match_status,
                 t.matched_invoice_id || null,
                 t.matched_invoice_number || null,
                 t.difference_amount || 0]
            );
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            data: {
                statementId,
                totalTransactions: transactions.length,
                matchedCount,
                unmatchedCount,
                discrepancyCount,
                totalCredited,
                matchRate: Math.round((matchedCount / Math.max(transactions.filter(t => (parseFloat(t.credit)||0) > 0).length, 1)) * 1000) / 10,
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
});

// ── GET /api/bank-recon/statements  ──────────────────────────────────────────
router.get('/statements', async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT * FROM bank_statements WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET /api/bank-recon/statements/:id  ──────────────────────────────────────
router.get('/statements/:id', async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { filter } = req.query; // 'all' | 'unmatched' | 'matched' | 'discrepancy'
    try {
        const stmtRes = await pool.query(
            `SELECT * FROM bank_statements WHERE id=$1 AND user_id=$2`, [id, userId]
        );
        if (!stmtRes.rows.length) return res.status(404).json({ success: false, message: 'Not found' });

        let whereStatus = '';
        if (filter === 'unmatched')   whereStatus = `AND match_status = 'Unmatched'`;
        if (filter === 'matched')     whereStatus = `AND match_status = 'Matched'`;
        if (filter === 'discrepancy') whereStatus = `AND match_status = 'Difference'`;

        const txnRes = await pool.query(
            `SELECT * FROM bank_transactions WHERE statement_id=$1 ${whereStatus} ORDER BY txn_date ASC`,
            [id]
        );
        res.json({ success: true, data: { statement: stmtRes.rows[0], transactions: txnRes.rows } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── PATCH /api/bank-recon/transactions/:id/link  ─────────────────────────────
// Manually link a transaction to an invoice
router.patch('/transactions/:id/link', async (req, res) => {
    const { invoiceId } = req.body;
    const { id } = req.params;
    try {
        const invRes = await pool.query(`SELECT invoice_number, total_amount FROM gst_invoices WHERE id=$1`, [invoiceId]);
        if (!invRes.rows.length) return res.status(404).json({ success: false, message: 'Invoice not found' });

        const inv = invRes.rows[0];
        const txnRes = await pool.query(`SELECT credit_amount FROM bank_transactions WHERE id=$1`, [id]);
        const credit = parseFloat(txnRes.rows[0]?.credit_amount || 0);
        const diff   = Math.round((credit - parseFloat(inv.total_amount)) * 100) / 100;

        await pool.query(
            `UPDATE bank_transactions SET match_status=$1, matched_invoice_id=$2,
             matched_invoice_number=$3, difference_amount=$4 WHERE id=$5`,
            [diff === 0 ? 'Matched' : 'Difference', invoiceId, inv.invoice_number, diff, id]
        );

        // Update statement counts
        await pool.query(
            `UPDATE bank_statements SET
               matched_count     = (SELECT COUNT(*) FROM bank_transactions WHERE statement_id=bs.id AND match_status='Matched'),
               unmatched_count   = (SELECT COUNT(*) FROM bank_transactions WHERE statement_id=bs.id AND match_status='Unmatched'),
               discrepancy_count = (SELECT COUNT(*) FROM bank_transactions WHERE statement_id=bs.id AND match_status='Difference'),
               updated_at = NOW()
             FROM bank_statements bs
             WHERE bs.id = (SELECT statement_id FROM bank_transactions WHERE id=$1)
               AND bank_statements.id = bs.id`,
            [id]
        );

        res.json({ success: true, message: 'Linked successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── DELETE /api/bank-recon/statements/:id  ───────────────────────────────────
router.delete('/statements/:id', async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query(`DELETE FROM bank_statements WHERE id=$1 AND user_id=$2`, [req.params.id, userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
