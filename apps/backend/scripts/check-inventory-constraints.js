require('dotenv').config();
const { Client } = require('pg');

async function checkConstraints() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Check the constraint definition
    const result = await client.query(`
      SELECT
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'inventory_items'::regclass
        AND conname = 'inventory_items_status_check'
    `);

    console.log('Inventory status constraint:');
    console.log(result.rows[0]?.constraint_definition || 'Not found');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkConstraints().catch(console.error);