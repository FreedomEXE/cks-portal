require('dotenv').config();
const { Client } = require('pg');

async function checkLatestOrder() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get the latest CRW-006 order
    const orderResult = await client.query(`
      SELECT order_id, creator_id, created_by, creator_role, status,
             crew_id, center_id, customer_id, metadata, created_at
      FROM orders
      WHERE order_id LIKE 'CRW-006%'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    console.log('\nLatest CRW-006 Order:');
    console.log(JSON.stringify(orderResult.rows[0], null, 2));

    // Check activity for this order
    if (orderResult.rows[0]) {
      const orderId = orderResult.rows[0].order_id;
      const activityResult = await client.query(`
        SELECT id, activity_type, actor_id, target_type, target_id, metadata, created_at
        FROM activities
        WHERE target_id = $1 OR metadata->>'orderId' = $1
        ORDER BY created_at DESC
      `, [orderId]);

      console.log('\nActivities for', orderId + ':');
      console.log(JSON.stringify(activityResult.rows, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkLatestOrder();
