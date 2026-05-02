/**
 * Database Seed Runner
 * Runs migration for invoices table, clears old data, then re-seeds
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wallettracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function runSeed() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting database seed (with July 2025 invoice data)...\n');

        // Step 1: Create invoices table if not exists
        console.log('📋 Running invoices migration...');
        const migrationFile = path.join(__dirname, '../database/migrations/016_create_invoices.sql');
        const migrationSql = fs.readFileSync(migrationFile, 'utf8');
        try {
            await client.query(migrationSql);
            console.log('   ✅ Invoices table created');
        } catch (err) {
            if (err.code === '42P07') {
                console.log('   ℹ️  Invoices table already exists, skipping');
            } else {
                throw err;
            }
        }

        // Step 2: Clear existing data (in correct order to respect FK constraints)
        console.log('\n🧹 Clearing existing data...');
        await client.query('DELETE FROM invoices');
        await client.query('DELETE FROM revenue_records');
        await client.query('DELETE FROM upsell_opportunities');
        await client.query('DELETE FROM renewal_tasks');
        await client.query('DELETE FROM churn_reasons');
        await client.query('DELETE FROM client_services');
        await client.query('DELETE FROM contracts');
        await client.query('DELETE FROM notifications');
        await client.query('DELETE FROM clients');
        console.log('   ✅ Old data cleared');

        // Step 3: Run the seed SQL
        console.log('\n📝 Executing seed SQL script...');
        const sqlFile = path.join(__dirname, '../database/seed_client_data.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        await client.query(sql);

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📊 Summary (July 2025 Update):');
        console.log('   - 11 clients inserted (6 active, 5 inactive)');
        console.log('   - 11 contracts created');
        console.log('   - Services linked to clients');
        console.log('   - 4 months of revenue records (April-July 2025)');
        console.log('   - 6 July invoices from Excel CSV');
        console.log('   - 6 upsell opportunities created');
        console.log('\n💰 July 2025 Revenue:');
        console.log('   Service MRR:  ₹17,77,944');
        console.log('   Addons MRR:   ₹29,44,537');
        console.log('   Total MRR:    ₹45,22,481');
        console.log('\n🎉 Your dashboard is now ready with July 2025 data!');
        console.log('\n📍 Refresh your browser to see the changes!');

    } catch (error) {
        console.error('\n❌ Error seeding database:');
        console.error('Message:', error.message);
        if (error.detail) console.error('Detail:', error.detail);
        if (error.hint) console.error('Hint:', error.hint);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runSeed();
