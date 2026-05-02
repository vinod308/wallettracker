/**
 * Database Seed Runner
 * Executes the seed_client_data.sql file
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

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
        console.log('🚀 Starting database seed...\n');

        // Read the SQL file
        const sqlFile = path.join(__dirname, 'seed_client_data.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Execute the SQL
        console.log('📝 Executing SQL script...');
        await client.query(sql);

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log('   - 10 clients inserted');
        console.log('   - 10 contracts created');
        console.log('   - Services linked to clients');
        console.log('   - 6 months of revenue records generated');
        console.log('   - 6 upsell opportunities created');
        console.log('\n🎉 Your dashboard is now ready with real data!');

    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runSeed();
