const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── GET /api/reimbursements  ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
    const userId = req.user.id;
    const { status, search } = req.query;
    try {
        let where = 'WHERE user_id = $1';
        const params = [userId];
        if (status && status !== 'all') {
            params.push(status);
            where += ` AND status = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            where += ` AND (employee_name ILIKE $${params.length} OR description ILIKE $${params.length})`;
        }
        const result = await pool.query(
            `SELECT * FROM reimbursements ${where} ORDER BY created_at DESC`,
            params
        );
        // Summary counts
        const summary = await pool.query(
            `SELECT
               COUNT(*) FILTER (WHERE status='Pending')  AS pending,
               COUNT(*) FILTER (WHERE status='Approved') AS approved,
               COUNT(*) FILTER (WHERE status='Rejected') AS rejected,
               SUM(amount) AS total_amount,
               SUM(amount) FILTER (WHERE status='Approved') AS approved_amount,
               SUM(amount) FILTER (WHERE status='Pending')  AS pending_amount
             FROM reimbursements WHERE user_id=$1`,
            [userId]
        );
        res.json({ success: true, data: result.rows, summary: summary.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/reimbursements  ─────────────────────────────────────────────────
// Single add
router.post('/', async (req, res) => {
    const userId = req.user.id;
    const { employeeName, category, expenseDate, description, amount } = req.body;
    if (!employeeName || !expenseDate || !amount) {
        return res.status(400).json({ success: false, message: 'employeeName, expenseDate and amount are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO reimbursements (user_id, employee_name, category, expense_date, description, amount)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [userId, employeeName, category || 'Other', expenseDate, description || '', parseFloat(amount)]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/reimbursements/bulk  ───────────────────────────────────────────
// Bulk import from CSV (array of objects)
router.post('/bulk', async (req, res) => {
    const userId = req.user.id;
    const { records = [] } = req.body;
    if (!records.length) return res.status(400).json({ success: false, message: 'No records provided' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let inserted = 0;
        const errors = [];

        for (const r of records) {
            const name   = r.employee_name || r.employeeName || '';
            const cat    = r.category || 'Other';
            const date   = r.date || r.expense_date || r.expenseDate;
            const desc   = r.description || '';
            const amount = parseFloat(r.amount);

            if (!name || !date || isNaN(amount)) {
                errors.push(`Skipped row: ${JSON.stringify(r)} — missing name/date/amount`);
                continue;
            }
            await client.query(
                `INSERT INTO reimbursements (user_id, employee_name, category, expense_date, description, amount)
                 VALUES ($1,$2,$3,$4,$5,$6)`,
                [userId, name, cat, date, desc, amount]
            );
            inserted++;
        }

        await client.query('COMMIT');
        res.json({ success: true, inserted, errors });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
});

// ── PATCH /api/reimbursements/:id/status  ────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
    const userId = req.user.id;
    const { status, rejectionReason } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    try {
        const result = await pool.query(
            `UPDATE reimbursements
             SET status=$1, rejection_reason=$2,
                 approved_at = CASE WHEN $1='Approved' THEN NOW() ELSE NULL END,
                 updated_at = NOW()
             WHERE id=$3 AND user_id=$4 RETURNING *`,
            [status, rejectionReason || null, req.params.id, userId]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── DELETE /api/reimbursements/:id  ──────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    const userId = req.user.id;
    try {
        await pool.query(`DELETE FROM reimbursements WHERE id=$1 AND user_id=$2`, [req.params.id, userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET /api/reimbursements/categories  ──────────────────────────────────────
router.get('/categories/summary', async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query(
            `SELECT category,
               COUNT(*) AS count,
               SUM(amount) AS total,
               COUNT(*) FILTER (WHERE status='Approved') AS approved_count,
               SUM(amount) FILTER (WHERE status='Approved') AS approved_total
             FROM reimbursements WHERE user_id=$1
             GROUP BY category ORDER BY total DESC`,
            [userId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
