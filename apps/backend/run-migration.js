require('dotenv').config();
const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Running migration to fix order_items...');

    const sql = `
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS catalog_item_code VARCHAR(255),
      ADD COLUMN IF NOT EXISTS catalog_item_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);
    `;

    await pool.query(sql);
    console.log('Migration completed successfully!');

    // Verify columns
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'order_items'
      AND column_name IN ('catalog_item_code', 'name', 'description', 'unit_price')
    `);

    console.log('Verified columns:', result.rows.map(r => r.column_name));
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();