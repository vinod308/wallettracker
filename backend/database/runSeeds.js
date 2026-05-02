import 'dotenv/config';
import pkg from 'pg';

const { Client } = pkg;

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function runSeeds() {
  try {
    await client.connect();
    console.log('🌱 Seeding database...');

    await client.query(`
      INSERT INTO users (name, email)
      VALUES ('Demo User', 'demo@example.com')
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Seeding completed');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await client.end();
  }
}

runSeeds();
