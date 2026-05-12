/**
 * Database Migration Runner
 * Tracks applied migrations in schema_migrations table — safe to run multiple times.
 * Gracefully handles migrations that were already applied before tracking was added.
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

        const migrationsDir  = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        let ranCount     = 0;
        let skippedCount = 0;

        for (const file of migrationFiles) {
            if (applied.has(file)) {
                console.log(`⏭  Skipping (already applied): ${file}`);
                skippedCount++;
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

                // If table/index already exists, mark as applied and continue
                if (err.code === '42P07' || err.code === '42701' || err.message.includes('already exists')) {
                    await client.query(
                        'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
                        [file]
                    );
                    console.log(`⚠️  Already exists — marked as applied: ${file}\n`);
                    skippedCount++;
                } else {
                    throw err;
                }
            }
        }

        console.log(`\n🎉 Done! ${ranCount} applied, ${skippedCount} skipped.`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
