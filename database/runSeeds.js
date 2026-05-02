/**
 * Database Seed Runner
 * Executes all SQL seed files to populate initial data
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runSeeds() {
    const client = await pool.connect();

    try {
        console.log('🌱 Starting database seeding...\n');

        const seedsDir = path.join(__dirname, 'seeds');
        const seedFiles = fs.readdirSync(seedsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        for (const file of seedFiles) {
            console.log(`📄 Running seed: ${file}`);
            const filePath = path.join(seedsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');

            await client.query(sql);
            console.log(`✅ Completed: ${file}\n`);
        }

        console.log('🎉 All seeds completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runSeeds();
