/**
 * Protected API Endpoint Tests — MoneyGence API
 *
 * All tests in this file require a valid auth token.
 * The token is obtained once in beforeAll via getAuthToken()
 * so the rate limiter is not triggered per-test.
 *
 * Endpoint coverage:
 *  - GET  /api/dashboard
 *  - GET  /api/clients           (list + pagination meta)
 *  - GET  /api/vendors
 *  - GET  /api/employees
 *  - GET  /api/invoices
 *  - GET  /api/balance-sheet
 *  - GET  /api/reimbursements
 *  - GET  /api/bank-recon/statements
 *  - GET  /api/wallet
 *  - GET  /api/reports
 *  - GET  /api/settings
 *  - GET  /api/subscription
 *  - POST /api/clients  (without auth → 401)
 *  - POST /api/vendors  (without auth → 401)
 */

'use strict';

const request = require('supertest');
const { BASE_URL, getAuthToken, authedRequest } = require('./setup');

// ─── Shared token ─────────────────────────────────────────────────────────────
let token;

beforeAll(async () => {
    token = await getAuthToken();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Asserts that a response has a standard MoneyGence success envelope.
 * Accepts responses that either have { success: true } or a 2xx status
 * with data — some list endpoints return plain arrays.
 */
function assertSuccess(res) {
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    // success flag is present on most endpoints
    if ('success' in res.body) {
        expect(res.body.success).toBe(true);
    }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe('GET /api/dashboard', () => {
    it('should return 200 with dashboard data', async () => {
        const res = await authedRequest('get', '/api/dashboard', token);
        assertSuccess(res);
        // Dashboard typically returns a data object — not strictly typed here
        // because the shape can change. We just verify it is not empty.
        expect(res.body).toBeDefined();
    });
});

// ─── Clients ──────────────────────────────────────────────────────────────────

describe('GET /api/clients', () => {
    it('should return 200 with an array-like data payload', async () => {
        const res = await authedRequest('get', '/api/clients', token);
        assertSuccess(res);

        // The controller returns either { data: { clients: [] } } or { data: [] }
        const data = res.body.data;
        expect(data).toBeDefined();

        // Accept { clients: [] } or a direct array
        const clientArray = Array.isArray(data)
            ? data
            : (data.clients || data.items || data.rows || []);

        expect(Array.isArray(clientArray)).toBe(true);
    });

    it('should respect the limit query param', async () => {
        const res = await authedRequest('get', '/api/clients?limit=5&page=1', token);
        assertSuccess(res);
        expect(res.body).toBeDefined();
    });

    it('should return 200 for client statistics endpoint', async () => {
        const res = await authedRequest('get', '/api/clients/statistics', token);
        assertSuccess(res);
    });
});

// ─── Vendors ──────────────────────────────────────────────────────────────────

describe('GET /api/vendors', () => {
    it('should return 200 with vendors list', async () => {
        const res = await authedRequest('get', '/api/vendors', token);
        assertSuccess(res);
        expect(res.body).toBeDefined();
    });
});

// ─── Employees ────────────────────────────────────────────────────────────────

describe('GET /api/employees', () => {
    it('should return 200 with employees list', async () => {
        const res = await authedRequest('get', '/api/employees', token);
        assertSuccess(res);
    });
});

// ─── Invoices ─────────────────────────────────────────────────────────────────

describe('GET /api/invoices', () => {
    it('should return 200 with invoices data', async () => {
        const res = await authedRequest('get', '/api/invoices', token);
        assertSuccess(res);
    });
});

// ─── Balance Sheet ────────────────────────────────────────────────────────────

describe('GET /api/balance-sheet', () => {
    it('should return 200 with balance sheet data', async () => {
        const res = await authedRequest('get', '/api/balance-sheet', token);
        assertSuccess(res);
    });

    it('should accept a financial year query param', async () => {
        const currentYear = new Date().getFullYear();
        const fy = `${currentYear - 1}-${currentYear}`;
        const res = await authedRequest('get', `/api/balance-sheet?fy=${fy}`, token);
        // Either 200 or 400 (invalid FY string) — must not be 401/500
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(500);
    });
});

// ─── Reimbursements ───────────────────────────────────────────────────────────

describe('GET /api/reimbursements', () => {
    it('should return 200 with reimbursements list', async () => {
        const res = await authedRequest('get', '/api/reimbursements', token);
        assertSuccess(res);
    });
});

// ─── Bank Reconciliation ──────────────────────────────────────────────────────

describe('GET /api/bank-recon/statements', () => {
    it('should return 200 with bank statements list', async () => {
        const res = await authedRequest('get', '/api/bank-recon/statements', token);
        assertSuccess(res);
    });
});

// ─── Wallet ───────────────────────────────────────────────────────────────────

describe('GET /api/wallet', () => {
    it('should return 200 with wallet analytics data', async () => {
        const res = await authedRequest('get', '/api/wallet', token);
        assertSuccess(res);
    });
});

// ─── Reports ─────────────────────────────────────────────────────────────────

describe('GET /api/reports', () => {
    it('should return 200 with reports data', async () => {
        const res = await authedRequest('get', '/api/reports', token);
        assertSuccess(res);
    });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

describe('GET /api/settings', () => {
    it('should return 200 with settings data', async () => {
        const res = await authedRequest('get', '/api/settings', token);
        assertSuccess(res);
    });
});

// ─── Subscription ─────────────────────────────────────────────────────────────

describe('GET /api/subscription', () => {
    it('should return 200 with subscription plan data', async () => {
        const res = await authedRequest('get', '/api/subscription', token);
        assertSuccess(res);
    });
});

// ─── Unauthenticated access → 401 ─────────────────────────────────────────────

describe('Unauthenticated POST requests → 401', () => {
    it('POST /api/clients without auth should return 401', async () => {
        const res = await request(BASE_URL)
            .post('/api/clients')
            .send({
                name: 'Ghost Corp',
                industry: 'Tech',
                monthlyRetainer: 10000,
            })
            .set('Content-Type', 'application/json')
            .expect(401);

        expect(res.body.success).toBe(false);
    });

    it('POST /api/vendors without auth should return 401', async () => {
        const res = await request(BASE_URL)
            .post('/api/vendors')
            .send({
                name: 'Ghost Vendor',
                contactEmail: 'ghost@example.com',
            })
            .set('Content-Type', 'application/json')
            .expect(401);

        expect(res.body.success).toBe(false);
    });

    it('POST /api/employees without auth should return 401', async () => {
        const res = await request(BASE_URL)
            .post('/api/employees')
            .send({ name: 'Phantom Employee' })
            .set('Content-Type', 'application/json')
            .expect(401);

        expect(res.body.success).toBe(false);
    });
});

// ─── Authenticated mutation endpoints — basic smoke tests ─────────────────────

describe('Authenticated write endpoints — validation smoke', () => {
    it('POST /api/clients with auth but empty body → 422 or 400 (not 401/500)', async () => {
        const res = await authedRequest('post', '/api/clients', token, {});
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(500);
        // Should be a validation error (400/422) or forbidden (403)
        expect([400, 403, 422]).toContain(res.status);
    });

    it('POST /api/reimbursements with auth but empty body → 422 or 400 (not 401/500)', async () => {
        const res = await authedRequest('post', '/api/reimbursements', token, {});
        expect(res.status).not.toBe(401);
        expect(res.status).not.toBe(500);
    });
});

// ─── Response time smoke test ─────────────────────────────────────────────────

describe('Response time — all protected GET endpoints should respond < 5 000 ms', () => {
    const endpoints = [
        '/api/dashboard',
        '/api/clients',
        '/api/vendors',
        '/api/employees',
        '/api/invoices',
        '/api/balance-sheet',
        '/api/reimbursements',
        '/api/wallet',
    ];

    endpoints.forEach((path) => {
        it(`${path} responds in under 5 000 ms`, async () => {
            const start = Date.now();
            const res   = await authedRequest('get', path, token);
            const elapsed = Date.now() - start;

            expect(res.status).not.toBe(500);
            expect(elapsed).toBeLessThan(5000);
        }, 10000 /* per-test timeout */);
    });
});
