/**
 * Plan Limiter Middleware
 * Checks whether the current user's subscription plan allows adding
 * more clients or vendors before the create route runs.
 *
 * Usage:
 *   router.post('/', planLimiter('client'), ctrl.createClient);
 *   router.post('/', planLimiter('vendor'), ctrl.createVendor);
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

// Single source of truth — mirrors the plans table seed data
const PLAN_LIMITS = {
    free:       { label: 'Free',       max_clients: 5,   max_vendors: 5   },
    basic:      { label: 'Basic',      max_clients: 10,  max_vendors: 10  },
    pro:        { label: 'Pro',        max_clients: 500, max_vendors: 500 },
    enterprise: { label: 'Enterprise', max_clients: -1,  max_vendors: -1  },
};

/**
 * Returns the active plan for the workspace.
 * We treat the oldest Admin user's plan as the workspace plan.
 * (Extend this to an org-level plan when multi-tenancy is added.)
 */
async function getWorkspacePlan() {
    const { rows } = await pool.query(`
        SELECT plan FROM users
        WHERE role = 'Admin' AND deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT 1
    `);
    return rows[0]?.plan || 'free';
}

/**
 * Count active records for the given resource type.
 */
async function countResource(type) {
    const table = type === 'client' ? 'clients' : 'vendors';
    const condition = type === 'client' ? 'WHERE deleted_at IS NULL' : '';
    const { rows } = await pool.query(`SELECT COUNT(*) AS cnt FROM ${table} ${condition}`);
    return parseInt(rows[0].cnt, 10);
}

/**
 * planLimiter(resourceType)
 * @param {'client'|'vendor'} resourceType
 */
const planLimiter = (resourceType) => async (req, res, next) => {
    try {
        const plan = await getWorkspacePlan();
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

        const limitKey = resourceType === 'client' ? 'max_clients' : 'max_vendors';
        const maxAllowed = limits[limitKey];

        // -1 means unlimited (Enterprise)
        if (maxAllowed === -1) return next();

        const current = await countResource(resourceType);

        if (current >= maxAllowed) {
            logger.info(`Plan limit reached: ${plan} plan, ${current}/${maxAllowed} ${resourceType}s`);
            return res.status(403).json({
                success:  false,
                code:     'PLAN_LIMIT_REACHED',
                message:  `You have reached the ${limits.label} plan limit of ${maxAllowed} ${resourceType}(s). Please upgrade your plan to add more.`,
                data: {
                    current,
                    limit:        maxAllowed,
                    plan:         plan,
                    planLabel:    limits.label,
                    resourceType,
                },
            });
        }

        // Attach usage info to request so controllers can surface it if needed
        req.planUsage = { plan, current, limit: maxAllowed, resourceType };
        next();
    } catch (err) {
        // On unexpected error, log and allow — don't block legitimate requests
        logger.error(`planLimiter error: ${err.message}`);
        next();
    }
};

module.exports = planLimiter;
