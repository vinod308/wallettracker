/**
 * Auth Tests — MoneyGence API
 *
 * Covers:
 *  1. Health check (public endpoint)
 *  2. Login with valid credentials
 *  3. Login with wrong password → 401
 *  4. Login with missing fields → 422 validation error
 *  5. Signup validation (missing fields, weak password, mismatched passwords)
 *  6. Signup with duplicate email → 409
 *  7. Logout (authenticated)
 *  8. GET /api/auth/me — returns current user
 *  9. GET /api/auth/verify-session — valid session
 * 10. Protected route without token → 401
 */

'use strict';

const request = require('supertest');
const { BASE_URL, getAuthToken, TEST_EMAIL, TEST_PASSWORD, resetTokenCache } = require('./setup');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const api = (path) => `${BASE_URL}${path}`;

// ─── 1. Health check ─────────────────────────────────────────────────────────

describe('GET /api/health', () => {
    it('should return 200 with status ok (no auth required)', async () => {
        const res = await request(BASE_URL)
            .get('/api/health')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body).toHaveProperty('status');
        // Acceptable values: 'ok', 'healthy', true
        const status = res.body.status;
        expect(['ok', 'healthy', 'UP', true]).toContain(status);
    });
});

// ─── 2. Login — valid credentials ────────────────────────────────────────────

describe('POST /api/auth/login — valid credentials', () => {
    it('should return 200 and either a token (no OTP) or otpRequired flag', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.success).toBe(true);

        const data = res.body.data;
        expect(data).toBeDefined();

        // Either direct login (no SMTP) or OTP challenge
        const hasToken      = typeof data.token === 'string' && data.token.length > 0;
        const hasOtpFlag    = data.otpRequired === true;

        expect(hasToken || hasOtpFlag).toBe(true);
    });

    it('should return a token that is a non-empty string when SMTP is unavailable', async () => {
        // getAuthToken handles both OTP and direct-login paths
        const token = await getAuthToken();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(20);
    });
});

// ─── 3. Login — wrong password → 401 ─────────────────────────────────────────

describe('POST /api/auth/login — wrong password', () => {
    it('should return 401 Unauthorized', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL, password: 'WrongPassword999!' })
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /json/)
            .expect(401);

        expect(res.body.success).toBe(false);
    });

    it('should return 401 for completely unknown email', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: 'nobody@nowhere-xyz.com', password: 'Whatever1!' })
            .set('Content-Type', 'application/json')
            .expect(401);

        expect(res.body.success).toBe(false);
    });
});

// ─── 4. Login — missing / invalid fields → 422 ────────────────────────────────

describe('POST /api/auth/login — validation errors', () => {
    it('should return 422 when email is missing', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ password: TEST_PASSWORD })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
    });

    it('should return 422 when password is missing', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: TEST_EMAIL })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
    });

    it('should return 422 when email is not a valid email format', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({ email: 'not-an-email', password: TEST_PASSWORD })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
    });

    it('should return 422 when body is empty', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/login')
            .send({})
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
    });
});

// ─── 5. Signup — validation ───────────────────────────────────────────────────

describe('POST /api/auth/signup — validation errors', () => {
    const validSignupPayload = {
        fullName: 'Test User',
        email: `test_signup_${Date.now()}@example.com`,
        password: 'Secure@1234',
        confirmPassword: 'Secure@1234',
        agreedToTerms: 'true',
    };

    it('should return 422 when fullName is missing', async () => {
        const { fullName, ...rest } = validSignupPayload;
        const res = await request(BASE_URL)
            .post('/api/auth/signup')
            .send(rest)
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
        const messages = res.body.errors?.map((e) => e.msg) || [];
        expect(messages.some((m) => /name/i.test(m))).toBe(true);
    });

    it('should return 422 when email is invalid', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/signup')
            .send({ ...validSignupPayload, email: 'bad-email' })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
    });

    it('should return 422 when password lacks uppercase letter', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/signup')
            .send({
                ...validSignupPayload,
                password: 'nouppercase1!',
                confirmPassword: 'nouppercase1!',
            })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
        const messages = res.body.errors?.map((e) => e.msg) || [];
        expect(messages.some((m) => /uppercase/i.test(m))).toBe(true);
    });

    it('should return 422 when password lacks a number', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/signup')
            .send({
                ...validSignupPayload,
                password: 'NoNumber!',
                confirmPassword: 'NoNumber!',
            })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
    });

    it('should return 422 when password lacks a special character', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/signup')
            .send({
                ...validSignupPayload,
                password: 'NoSpecial1',
                confirmPassword: 'NoSpecial1',
            })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
    });

    it('should return 422 when passwords do not match', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/signup')
            .send({
                ...validSignupPayload,
                confirmPassword: 'Different@9999',
            })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
        const messages = res.body.errors?.map((e) => e.msg) || [];
        expect(messages.some((m) => /match/i.test(m))).toBe(true);
    });

    it('should return 422 when agreedToTerms is not true', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/signup')
            .send({ ...validSignupPayload, agreedToTerms: 'false' })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
    });

    it('should return 422 when password is shorter than 8 characters', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/signup')
            .send({
                ...validSignupPayload,
                password: 'Ab1!',
                confirmPassword: 'Ab1!',
            })
            .set('Content-Type', 'application/json')
            .expect(422);

        expect(res.body.success).toBe(false);
    });
});

// ─── 6. Signup — duplicate email ──────────────────────────────────────────────

describe('POST /api/auth/signup — duplicate email', () => {
    it('should return 409 Conflict when email already exists', async () => {
        // Use the test account email which is guaranteed to exist
        const res = await request(BASE_URL)
            .post('/api/auth/signup')
            .send({
                fullName: 'Duplicate User',
                email: TEST_EMAIL,
                password: 'Secure@1234',
                confirmPassword: 'Secure@1234',
                agreedToTerms: 'true',
            })
            .set('Content-Type', 'application/json')
            .expect(409);

        expect(res.body.success).toBe(false);
    });
});

// ─── 7. Logout ────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
    it('should return 200 and a logout confirmation', async () => {
        // Get a fresh token (do NOT use cached one — we're logging it out)
        const freshToken = await getAuthToken();

        const res = await request(BASE_URL)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${freshToken}`)
            .set('Content-Type', 'application/json')
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/logged out/i);

        // Invalidate the cache since we just killed this token
        resetTokenCache();
    });

    it('should return 401 when calling logout without a token', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/logout')
            .set('Content-Type', 'application/json')
            .expect(401);

        expect(res.body.success).toBe(false);
    });
});

// ─── 8. GET /api/auth/me ──────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
    it('should return the currently authenticated user', async () => {
        const token = await getAuthToken();

        const res = await request(BASE_URL)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.email).toBe(TEST_EMAIL.toLowerCase());
    });

    it('should return 401 without a token', async () => {
        await request(BASE_URL)
            .get('/api/auth/me')
            .expect(401);
    });

    it('should return 401 with a malformed token', async () => {
        const res = await request(BASE_URL)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer this.is.not.a.valid.jwt')
            .expect(401);

        expect(res.body.success).toBe(false);
    });
});

// ─── 9. GET /api/auth/verify-session ─────────────────────────────────────────

describe('GET /api/auth/verify-session', () => {
    it('should return authenticated: false when no cookie is set', async () => {
        const res = await request(BASE_URL)
            .get('/api/auth/verify-session')
            .expect('Content-Type', /json/)
            .expect(401);

        expect(res.body.authenticated).toBe(false);
    });
});

// ─── 10. Protected route without token → 401 ─────────────────────────────────

describe('Protected routes — no token', () => {
    const protectedRoutes = [
        { method: 'get', path: '/api/dashboard' },
        { method: 'get', path: '/api/clients' },
        { method: 'get', path: '/api/vendors' },
        { method: 'get', path: '/api/employees' },
        { method: 'get', path: '/api/invoices' },
    ];

    protectedRoutes.forEach(({ method, path }) => {
        it(`${method.toUpperCase()} ${path} should return 401 when unauthenticated`, async () => {
            const res = await request(BASE_URL)[method](path)
                .set('Content-Type', 'application/json')
                .expect(401);

            expect(res.body.success).toBe(false);
        });
    });
});
