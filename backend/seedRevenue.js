/**
 * Seed script: Add revenue records for Jul 2025 - Feb 2026
 * Run from backend directory: node seedRevenue.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wallettracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

async function seedRevenue() {
    const client = await pool.connect();
    try {
        console.log('Connecting to database...');
        const sqlPath = path.join(__dirname, '..', 'database', 'seed_revenue_2025_2026.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Adding revenue records for Jul 2025 - Feb 2026...');
        await client.query(sql);
        console.log('Revenue seed completed successfully!');

        // Verify
        const { rows } = await client.query(`
            SELECT TO_CHAR(record_date, 'YYYY-MM') as month, COUNT(*) as records, SUM(amount) as revenue
            FROM revenue_records
            GROUP BY month
            ORDER BY month DESC
            LIMIT 14
        `);
        console.log('\nRevenue records by month:');
        rows.forEach(r => console.log(`  ${r.month}: ${r.records} records, ₹${Number(r.revenue).toLocaleString('en-IN')}`));

    } catch (err) {
        console.error('Error seeding revenue:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedRevenue();
