require('dotenv').config();
const { Client } = require('pg');

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orders'
      AND (column_name LIKE '%creator%' OR column_name LIKE '%created_by%')
      ORDER BY column_name
    `);

    console.log('\nColumns matching creator/created_by:');
    console.log(columnsResult.rows);

    // Check actual order data
    const orderResult = await client.query(`
      SELECT order_id, creator_id, created_by, created_by_role
      FROM orders
      WHERE order_id = 'CRW-006-PO-120'
      LIMIT 1
    `);

    console.log('\nOrder CRW-006-PO-120 data:');
    console.log(orderResult.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
