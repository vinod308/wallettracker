require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function migrate() {
    console.log('Adding client contact/bank/GST columns...');
    await pool.query(`
        ALTER TABLE clients
            ADD COLUMN IF NOT EXISTS gst_number        VARCHAR(20),
            ADD COLUMN IF NOT EXISTS address           TEXT,
            ADD COLUMN IF NOT EXISTS state             VARCHAR(100),
            ADD COLUMN IF NOT EXISTS state_code        VARCHAR(10),
            ADD COLUMN IF NOT EXISTS bank_name         VARCHAR(200),
            ADD COLUMN IF NOT EXISTS account_number    VARCHAR(30),
            ADD COLUMN IF NOT EXISTS ifsc_code         VARCHAR(11),
            ADD COLUMN IF NOT EXISTS contact_person    VARCHAR(100),
            ADD COLUMN IF NOT EXISTS contact_email     VARCHAR(255),
            ADD COLUMN IF NOT EXISTS mobile_number     VARCHAR(15),
            ADD COLUMN IF NOT EXISTS alt_contact_email VARCHAR(255)
    `);
    console.log('Adding invoice status and details columns...');
    await pool.query(`
        ALTER TABLE invoices
            ADD COLUMN IF NOT EXISTS status  VARCHAR(30) DEFAULT 'Generated',
            ADD COLUMN IF NOT EXISTS details JSONB
    `);
    console.log('Migration complete.');
    await pool.end();
}

migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
