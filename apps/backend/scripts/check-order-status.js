require('dotenv').config();
const { Client } = require('pg');

async function checkOrderStatus() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('📋 Checking Order CEN-010-PO-023 Status\n');

    const result = await client.query(`
      SELECT
        order_id,
        status,
        next_actor_role,
        assigned_warehouse,
        created_at,
        updated_at
      FROM orders
      WHERE order_id = 'CEN-010-PO-023'
    `);

    if (result.rows.length > 0) {
      console.log('Order Details:');
      console.table(result.rows);
    } else {
      console.log('Order not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOrderStatus().catch(console.error);