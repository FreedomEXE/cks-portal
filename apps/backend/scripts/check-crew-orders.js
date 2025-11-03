require('dotenv').config();
const { Client } = require('pg');

async function checkOrders() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check CRW-006 orders
    const orderResult = await client.query(`
      SELECT order_id, creator_id, created_by, creator_role, status, created_at
      FROM orders
      WHERE order_id LIKE 'CRW-006%'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('\nCRW-006 Orders:');
    console.log(orderResult.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOrders();
