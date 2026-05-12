/**
 * Database Migration Runner
 * Tracks applied migrations in schema_migrations table — safe to run multiple times.
 */

const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function runMigrations() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting database migrations...\n');

        // Create tracking table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename   TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        // Get already-applied migrations
        const { rows } = await client.query('SELECT filename FROM schema_migrations');
        const applied = new Set(rows.map(r => r.filename));

        const migrationsDir   = path.join(__dirname, 'migrations');
        const migrationFiles  = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        let ranCount = 0;

        for (const file of migrationFiles) {
            if (applied.has(file)) {
                console.log(`⏭  Skipping (already applied): ${file}`);
                continue;
            }

            console.log(`📄 Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file]
                );
                await client.query('COMMIT');
                console.log(`✅ Completed: ${file}\n`);
                ranCount++;
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
        }

        if (ranCount === 0) {
            console.log('✅ All migrations already applied — nothing to do.');
        } else {
            console.log(`🎉 ${ranCount} migration(s) applied successfully!`);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
