/**
 * Payment Routes
 * Placeholder endpoints — payment gateway (Razorpay) integration added in next phase.
 */

const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const pool = require('../config/database');

// POST /api/payment/create-order
// Creates a payment order before redirecting user to gateway.
// TODO: integrate Razorpay SDK — replace stub with real order creation.
router.post('/create-order', authenticate, asyncHandler(async (req, res) => {
    const { plan, billing_cycle = 'monthly' } = req.body;

    const PRICES = {
        basic:      { monthly: 299,  yearly: 2990  },
        pro:        { monthly: 599,  yearly: 5990  },
        enterprise: { monthly: 1299, yearly: 12990 },
    };

    if (!PRICES[plan]) {
        return res.status(400).json({ success: false, message: 'Invalid plan selected' });
    }

    const baseAmount  = PRICES[plan][billing_cycle];
    const gstAmount   = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;

    // Stub order — replace with Razorpay order when API is ready
    const orderId = `ORD_${Date.now()}_${req.user.id}`;

    res.status(200).json({
        success: true,
        data: {
            order_id:      orderId,
            plan,
            billing_cycle,
            base_amount:   baseAmount,
            gst_amount:    gstAmount,
            total_amount:  totalAmount,
            currency:      'INR',
            status:        'pending',
            // gateway:    'razorpay',        // uncomment when integrating
            // razorpay_key: config.RAZORPAY_KEY_ID,
        },
    });
}));

// POST /api/payment/verify
// Called after gateway callback to verify & activate plan.
// TODO: verify Razorpay signature and activate subscription.
router.post('/verify', authenticate, asyncHandler(async (req, res) => {
    const {
        order_id,
        plan,
        billing_cycle,
        // razorpay_payment_id,   // uncomment when integrating
        // razorpay_signature,    // uncomment when integrating
    } = req.body;

    // TODO: verify HMAC signature with Razorpay secret
    // const isValid = razorpay.validateSignature(...)

    // For now: directly upgrade the plan (remove this once real verification is in place)
    const planOrder = ['free', 'basic', 'pro', 'enterprise'];
    const { rows: [user] } = await pool.query(
        'SELECT plan FROM users WHERE id = $1', [req.user.id]
    );
    const currentIdx = planOrder.indexOf(user.plan);
    const newIdx     = planOrder.indexOf(plan);

    if (newIdx <= currentIdx) {
        return res.status(400).json({ success: false, message: 'Cannot downgrade via payment' });
    }

    const expiresAt = billing_cycle === 'yearly'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30  * 24 * 60 * 60 * 1000);

    await pool.query(
        'UPDATE subscriptions SET status = $1, cancelled_at = NOW() WHERE user_id = $2 AND status = $3',
        ['cancelled', req.user.id, 'active']
    );
    await pool.query(
        `INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at, notes, created_by)
         VALUES ($1,$2,'active',NOW(),$3,$4,$5)`,
        [req.user.id, plan, expiresAt, `Upgraded via payment — order ${order_id}`, req.user.id]
    );
    await pool.query(
        'UPDATE users SET plan=$1, plan_expires_at=$2, updated_at=NOW() WHERE id=$3',
        [plan, expiresAt, req.user.id]
    );

    res.status(200).json({
        success: true,
        message: `Plan upgraded to ${plan} successfully!`,
        data: { plan, expires_at: expiresAt },
    });
}));

// GET /api/payment/history
// Returns past payment / subscription records for the workspace.
router.get('/history', authenticate, asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT s.*, u.email AS upgraded_by_email
         FROM subscriptions s
         JOIN users u ON u.id = s.created_by
         WHERE s.user_id = $1
         ORDER BY s.created_at DESC`,
        [req.user.id]
    );
    res.status(200).json({ success: true, data: rows });
}));

module.exports = router;
