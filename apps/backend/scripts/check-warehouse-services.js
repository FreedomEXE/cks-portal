require('dotenv').config();
const { Client } = require('pg');

async function checkOrder() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check latest warehouse service orders
    const orderResult = await client.query(`
      SELECT o.order_id, o.status, o.order_type, o.title, o.metadata
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN catalog_services cs ON oi.catalog_item_code = cs.service_id
      
SELECT s.service_id, s.service_type, s.status, s.managed_by, s.actual_start_time
FROM services s
WHERE s.managed_by = 'warehouse'
ORDER BY s.created_at DESC
LIMIT 5
 = 'service'
        AND cs.managed_by = 'warehouse'
      ORDER BY s.created_at DESC
      LIMIT 5
    `);

    console.log('📦 Latest Warehouse Service Orders:');
    console.table(orderResult.rows.map(r => ({
      order_id: r.order_id,
      status: r.status,
      title: r.title,
      serviceManagedBy: r.metadata?.serviceManagedBy
    })));

    // Check the first order in detail
    if (orderResult.rows.length > 0) {
      const firstOrderId = orderResult.rows[0].order_id;

      // Check order items
      const itemsResult = await client.query(`
        SELECT order_id, catalog_item_code, item_type, quantity
        FROM order_items
        WHERE order_id = $1
      `, [firstOrderId]);

      console.log(`\n📋 Order Items for ${firstOrderId}:`);
      console.table(itemsResult.rows);

      // Check if the catalog service exists and its managed_by
      if (itemsResult.rows.length > 0) {
        const serviceCode = itemsResult.rows[0].catalog_item_code;
        const serviceResult = await client.query(`
          SELECT service_id, name, managed_by
          FROM catalog_services
          WHERE service_id = $1
        `, [serviceCode]);

        console.log(`\n🔍 Catalog Service (${serviceCode}):`);
        console.table(serviceResult.rows);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

checkOrder().catch(console.error);
