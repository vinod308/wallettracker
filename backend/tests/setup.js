/**
 * Jest Global Test Setup — MoneyGence API
 *
 * Provides:
 *  - BASE_URL: resolved from TEST_BASE_URL env var or defaults to localhost:5000
 *  - getAuthToken(email, password): logs in, handles the OTP-bypass path, and
 *    returns a Bearer token string ready for Authorization headers.
 *  - authedRequest(method, path, token, body): thin wrapper around supertest
 *    that injects the Authorization header automatically.
 *
 * Auth flow notes (based on authController.js):
 *  - POST /api/auth/login always validates credentials first.
 *  - If SMTP is available it sends an OTP and returns { otpRequired: true }.
 *    In a test environment SMTP is expected to be unavailable, so the
 *    controller falls back to returning { token } directly.
 *  - If otpRequired=true is still returned (CI has SMTP) this helper also
 *    handles it by calling POST /api/auth/verify-otp with TEST_OTP env var
 *    (set it to whatever your seed OTP or SMTP stub emits).
 */

'use strict';

const request = require('supertest');

// ─── Base URL ────────────────────────────────────────────────────────────────
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

// ─── Test credentials (override via env for CI / staging) ────────────────────
const TEST_EMAIL    = process.env.TEST_EMAIL    || 'test@moneygence.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test@1234';

// ─── Cached token so we only log in once per test suite run ──────────────────
let _cachedToken = null;

/**
 * Authenticate with the MoneyGence API and return a JWT Bearer token.
 *
 * @param {string} [email]    - Account email (default: TEST_EMAIL env var)
 * @param {string} [password] - Account password (default: TEST_PASSWORD env var)
 * @returns {Promise<string>} Bearer token string (without "Bearer " prefix)
 */
async function getAuthToken(email = TEST_EMAIL, password = TEST_PASSWORD) {
    // Return cached token for the default test account to avoid hammering
    // the rate limiter (5 attempts / 15 min per the loginLimiter middleware).
    const isDefaultCreds = email === TEST_EMAIL && password === TEST_PASSWORD;
    if (isDefaultCreds && _cachedToken) {
        return _cachedToken;
    }

    // Step 1: POST /api/auth/login
    const loginRes = await request(BASE_URL)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ email, password });

    if (loginRes.status !== 200) {
        throw new Error(
            `Login failed [${loginRes.status}]: ${JSON.stringify(loginRes.body)}`
        );
    }

    const loginBody = loginRes.body;

    // Step 2a: Direct login (SMTP unavailable in test env — most common path)
    if (loginBody.data && loginBody.data.token) {
        const token = loginBody.data.token;
        if (isDefaultCreds) _cachedToken = token;
        return token;
    }

    // Step 2b: OTP required — verify with TEST_OTP env var
    if (loginBody.data && loginBody.data.otpRequired) {
        const otp = process.env.TEST_OTP;
        if (!otp) {
            throw new Error(
                'Server returned otpRequired=true but TEST_OTP env var is not set. ' +
                'Either configure SMTP to be disabled in your test environment, ' +
                'or set TEST_OTP to the OTP value from your SMTP stub.'
            );
        }

        const otpRes = await request(BASE_URL)
            .post('/api/auth/verify-otp')
            .set('Content-Type', 'application/json')
            .send({ email, otp });

        if (otpRes.status !== 200 || !otpRes.body?.data?.token) {
            throw new Error(
                `OTP verification failed [${otpRes.status}]: ${JSON.stringify(otpRes.body)}`
            );
        }

        const token = otpRes.body.data.token;
        if (isDefaultCreds) _cachedToken = token;
        return token;
    }

    throw new Error(
        `Unexpected login response: ${JSON.stringify(loginBody)}`
    );
}

/**
 * Make an authenticated HTTP request using supertest.
 *
 * @param {'get'|'post'|'put'|'patch'|'delete'} method - HTTP method (lowercase)
 * @param {string}  path  - API path, e.g. '/api/clients'
 * @param {string}  token - Bearer token returned by getAuthToken()
 * @param {object}  [body]- Optional request body (for POST/PUT/PATCH)
 * @returns {Promise<import('supertest').Response>}
 */
async function authedRequest(method, path, token, body = null) {
    let req = request(BASE_URL)[method](path)
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json');

    if (body) {
        req = req.send(body);
    }

    return req;
}

/**
 * Reset the cached token (call this in afterAll if you log out during a test).
 */
function resetTokenCache() {
    _cachedToken = null;
}

module.exports = {
    BASE_URL,
    TEST_EMAIL,
    TEST_PASSWORD,
    getAuthToken,
    authedRequest,
    resetTokenCache,
};
