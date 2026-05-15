/**
 * Subscription Routes
 * GET  /api/subscription/plans      — list all plans with limits & pricing
 * GET  /api/subscription/current    — current workspace plan + usage
 * POST /api/subscription/upgrade    — admin upgrades plan (manual, no payment gateway yet)
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole }  = require('../middleware/rbac');
const logger           = require('../utils/logger');

const PLAN_LIMITS = {
    free:       { max_clients: 5,   max_vendors: 5   },
    basic:      { max_clients: 10,  max_vendors: 10  },
    pro:        { max_clients: 500, max_vendors: 500 },
    enterprise: { max_clients: -1,  max_vendors: -1  },
};

router.use(authenticate);

// ── GET /api/subscription/plans ────────────────────────────────────────────────
router.get('/plans', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM plans WHERE is_active = true ORDER BY sort_order ASC`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        logger.error(`Get plans failed: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── GET /api/subscription/current ──────────────────────────────────────────────
router.get('/current', async (req, res) => {
    try {
        // Get workspace plan from admin
        const { rows: [adminUser] } = await pool.query(`
            SELECT id, plan, plan_expires_at FROM users
            WHERE role = 'Admin' AND deleted_at IS NULL
            ORDER BY created_at ASC LIMIT 1
        `);

        const plan = adminUser?.plan || 'free';
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

        // Count current usage
        const [clientRes, vendorRes] = await Promise.all([
            pool.query(`SELECT COUNT(*) AS cnt FROM clients WHERE deleted_at IS NULL`),
            pool.query(`SELECT COUNT(*) AS cnt FROM vendors`),
        ]);

        const clientCount = parseInt(clientRes.rows[0].cnt, 10);
        const vendorCount  = parseInt(vendorRes.rows[0].cnt, 10);

        // Subscription history
        const { rows: history } = await pool.query(`
            SELECT s.*, p.label AS plan_label
            FROM subscriptions s
            LEFT JOIN plans p ON s.plan = p.name
            WHERE s.user_id = $1
            ORDER BY s.created_at DESC
            LIMIT 5
        `, [adminUser?.id]);

        res.json({
            success: true,
            data: {
                plan,
                planExpiresAt: adminUser?.plan_expires_at,
                usage: {
                    clients: { current: clientCount, limit: limits.max_clients },
                    vendors: { current: vendorCount,  limit: limits.max_vendors  },
                },
                history,
            },
        });
    } catch (err) {
        logger.error(`Get current plan failed: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ── POST /api/subscription/upgrade ─────────────────────────────────────────────
// Admin-only — upgrades the workspace plan
router.post('/upgrade', requireRole(['Admin']), async (req, res) => {
    const { plan, notes } = req.body;
    const validPlans = ['free', 'basic', 'pro', 'enterprise'];

    if (!validPlans.includes(plan)) {
        return res.status(400).json({ success: false, message: `Invalid plan. Choose: ${validPlans.join(', ')}` });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update user's plan
        await client.query(
            `UPDATE users SET plan = $1, plan_expires_at = NULL WHERE id = $2`,
            [plan, req.user.id]
        );

        // Cancel any previous active subscriptions
        await client.query(
            `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW()
             WHERE user_id = $1 AND status = 'active'`,
            [req.user.id]
        );

        // Insert new subscription record
        const { rows: [sub] } = await client.query(`
            INSERT INTO subscriptions (user_id, plan, status, started_at, created_by)
            VALUES ($1, $2, 'active', NOW(), $3)
            RETURNING *
        `, [req.user.id, plan, req.user.id]);

        await client.query('COMMIT');

        logger.info(`Plan upgraded to ${plan} by user ${req.user.id}`);
        res.json({ success: true, data: sub, message: `Plan upgraded to ${plan} successfully` });
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`Plan upgrade failed: ${err.message}`);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
});

module.exports = router;
