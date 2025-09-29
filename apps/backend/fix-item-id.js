require('dotenv').config();
const { Pool } = require('pg');

async function fixItemId() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Making item_id nullable in order_items table...');
    await pool.query('ALTER TABLE order_items ALTER COLUMN item_id DROP NOT NULL');
    console.log('Successfully made item_id nullable!');
  } catch (error) {
    console.error('Failed to alter table:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixItemId();