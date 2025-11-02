require('dotenv').config();
const { Client } = require('pg');

async function checkOrderItems() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Check if order_items table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'order_items'
      ) as exists
    `);

    console.log('order_items table exists:', tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      console.log('\norder_items table does NOT exist - no FK to clean up!');
      await client.end();
      return;
    }

    // Check order_items columns
    const columns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position
    `);

    console.log('\norder_items columns:');
    columns.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    // Check for FK constraints
    const fks = await client.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'order_items'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);

    console.log('\norder_items foreign keys:');
    fks.rows.forEach(r => {
      console.log(`  - ${r.column_name} → ${r.foreign_table}.${r.foreign_column} (${r.constraint_name})`);
    });

    // Count order_items
    const count = await client.query('SELECT COUNT(*) FROM order_items');
    console.log(`\nTotal order_items: ${count.rows[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOrderItems();
