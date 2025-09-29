require('dotenv').config();
const { Pool } = require('pg');

async function fixOrderItemsId() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Adding id column alias to order_items table...');

    // Add id column as an alias for order_item_id
    await pool.query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS id INTEGER GENERATED ALWAYS AS (order_item_id) STORED
    `);

    console.log('Successfully added id column!');
  } catch (error) {
    // If generated columns not supported, try renaming
    console.log('Generated column failed, trying rename approach...');
    try {
      await pool.query('ALTER TABLE order_items RENAME COLUMN order_item_id TO id');
      console.log('Successfully renamed order_item_id to id!');
    } catch (renameError) {
      console.error('Failed to fix id column:', renameError);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

fixOrderItemsId();