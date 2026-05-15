/**
 * Express Application Setup
 * Main application configuration
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { helmetConfig, corsConfig } = require('./config/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const clientRoutes = require('./routes/client.routes');
const walletRoutes = require('./routes/wallet.routes');
const contractRoutes = require('./routes/contract.routes');
const reportRoutes = require('./routes/report.routes');
const settingsRoutes = require('./routes/settings.routes');
const sheetsRoutes = require('./routes/sheets.routes');
const invoiceRoutes       = require('./routes/invoice.routes');
const vendorRoutes        = require('./routes/vendor.routes');
const subscriptionRoutes  = require('./routes/subscription.routes');
const paymentRoutes       = require('./routes/payment.routes');

// Create Express app
const app = express();

// Trust proxy (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmetConfig);
app.use(corsConfig);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Global rate limiter
app.use('/api', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/invoices',      invoiceRoutes);
app.use('/api/vendors',       vendorRoutes);
app.use('/api/subscription',  subscriptionRoutes);
app.use('/api/payment',       paymentRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
