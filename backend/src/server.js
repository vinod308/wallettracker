/**
 * Server Entry Point
 * Starts the Express server
 */

require('dotenv').config();

// Force development environment and port 5000 for local development
// This overrides Windows system environment variables
if (!process.env.PRODUCTION) {
    process.env.NODE_ENV = 'development';
    process.env.PORT = '5000';
}

const app = require('./app');
const config = require('./config/environment');
const logger = require('./utils/logger');

// Start server
const PORT = 5000; // Always use port 5000 for development

const server = app.listen(PORT, () => {
    logger.info(`
    ┌─────────────────────────────────────────────┐
    │                                             │
    │   🚀 MoneyGence API Server       │
    │                                             │
    │   Environment: ${config.NODE_ENV.padEnd(27)} │
    │   Port: ${PORT.toString().padEnd(35)} │
    │   URL: ${config.API_BASE_URL.padEnd(35)} │
    │                                             │
    │   Status: ✅ Server is running             │
    │                                             │
    └─────────────────────────────────────────────┘
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = server;
