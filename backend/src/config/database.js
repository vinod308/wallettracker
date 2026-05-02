/**
 * Database Configuration
 * PostgreSQL connection pool with production-grade settings
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Connection error handling
pool.on('error', (err, client) => {
    logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection on startup
pool.connect((err, client, release) => {
    if (err) {
        logger.error('Error acquiring client', err.stack);
        process.exit(-1);
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            logger.error('Error executing query', err.stack);
            process.exit(-1);
        }
        logger.info('✅ Database connected successfully');
    });
});

module.exports = pool;
