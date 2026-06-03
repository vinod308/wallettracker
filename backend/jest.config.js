/**
 * Jest Configuration — MoneyGence Backend
 *
 * Run with:
 *   npm test                          # full suite with coverage
 *   npx jest tests/auth.test.js       # single file
 *   npx jest --testNamePattern health # filter by test name
 *
 * Environment variables read by tests/setup.js:
 *   TEST_BASE_URL  — defaults to http://localhost:5000
 *   TEST_EMAIL     — defaults to test@moneygence.com
 *   TEST_PASSWORD  — defaults to Test@1234
 *   TEST_OTP       — required ONLY when SMTP is active and OTP is expected
 */

'use strict';

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
    // ── Environment ────────────────────────────────────────────────────────────
    testEnvironment: 'node',

    // ── Test discovery ─────────────────────────────────────────────────────────
    // Matches any *.test.js file inside the tests/ directory
    testMatch: [
        '<rootDir>/tests/**/*.test.js',
    ],

    // ── Setup file ─────────────────────────────────────────────────────────────
    // Runs after the Jest test framework is installed in the environment.
    // setup.js exports helper functions; it is imported directly in each test file
    // via require('./setup'). Add paths here for jest-extend / custom matchers.
    setupFilesAfterEnv: [],
    // Note: setup.js is NOT a Jest setup file — it is a plain module imported by tests.
    // If you need global beforeAll setup (e.g. DB seed), add it here:
    // globalSetup: '<rootDir>/tests/globalSetup.js',

    // ── Timeouts ───────────────────────────────────────────────────────────────
    // Individual test timeout in ms.
    // Auth tests hit a real HTTP server including DB round-trips → generous budget.
    testTimeout: 15000,

    // ── Coverage ───────────────────────────────────────────────────────────────
    collectCoverage: false,          // enable with --coverage flag
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',            // entry point — not unit-testable
        '!src/config/**',
        '!src/utils/logger.js',
    ],
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches:   50,
            functions:  50,
            lines:      50,
            statements: 50,
        },
    },

    // ── Reporter ───────────────────────────────────────────────────────────────
    // verbose gives one line per test in CI logs
    verbose: true,

    // ── Module resolution ──────────────────────────────────────────────────────
    // No transforms needed — pure CommonJS
    transform: {},

    // ── Force exit ─────────────────────────────────────────────────────────────
    // Ensures Jest exits even if supertest / pg hold open handles
    forceExit: true,

    // ── Detect open handles ────────────────────────────────────────────────────
    // Uncomment to debug "Jest did not exit" warnings
    // detectOpenHandles: true,
};
