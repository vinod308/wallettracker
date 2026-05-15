/**
 * Environment Configuration
 * Centralized environment variable management
 */

require('dotenv').config();

module.exports = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',

    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 5432,
    DB_NAME: process.env.DB_NAME || 'MoneyGence',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD,

    // Security
    JWT_SECRET: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30m',
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    SESSION_TIMEOUT_MINUTES: parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 30,

    // Email
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@moneygence.com',
    EMAIL_CC_SAURABH: process.env.EMAIL_CC_SAURABH || '',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // GST e-Invoice (NIC IRP) — einvoice1.gst.gov.in
    GST_CLIENT_ID:     process.env.GST_CLIENT_ID,
    GST_CLIENT_SECRET: process.env.GST_CLIENT_SECRET,
    GST_USERNAME:      process.env.GST_USERNAME,
    GST_PASSWORD:      process.env.GST_PASSWORD,
    GST_GSTIN:         process.env.GST_GSTIN || '09AAGCG1126N1ZG',
};
