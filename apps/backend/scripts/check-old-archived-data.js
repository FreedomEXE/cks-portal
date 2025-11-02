require('dotenv').config();
const { Client } = require('pg');

async function checkOldArchivedData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    console.log('\n=== ARCHIVED SERVICES ===');
    const services = await client.query(`
      SELECT service_id, service_name, archived_at, archived_by, archive_reason
      FROM services
      WHERE archived_at IS NOT NULL
      ORDER BY archived_at DESC
      LIMIT 5
    `);
    console.log(`Found ${services.rows.length} archived services:`);
    services.rows.forEach(s => {
      console.log(`  ${s.service_id}: ${s.service_name}`);
      console.log(`    archived_at: ${s.archived_at}`);
      console.log(`    archived_by: ${s.archived_by}, reason: ${s.archive_reason}`);
    });

    console.log('\n=== ARCHIVED ORDERS (Product) ===');
    const productOrders = await client.query(`
      SELECT order_id, order_type, status, archived_at, archived_by, metadata
      FROM orders
      WHERE order_type = 'product' AND archived_at IS NOT NULL
      ORDER BY archived_at DESC
      LIMIT 5
    `);
    console.log(`Found ${productOrders.rows.length} archived product orders:`);
    productOrders.rows.forEach(o => {
      console.log(`  ${o.order_id}: ${o.order_type} (${o.status})`);
      console.log(`    archived_at: ${o.archived_at}, archived_by: ${o.archived_by}`);
      console.log(`    metadata:`, o.metadata);
    });

    console.log('\n=== ARCHIVED ORDERS (Service) ===');
    const serviceOrders = await client.query(`
      SELECT order_id, order_type, status, archived_at, archived_by, metadata
      FROM orders
      WHERE order_type = 'service' AND archived_at IS NOT NULL
      ORDER BY archived_at DESC
      LIMIT 5
    `);
    console.log(`Found ${serviceOrders.rows.length} archived service orders:`);
    serviceOrders.rows.forEach(o => {
      console.log(`  ${o.order_id}: ${o.order_type} (${o.status})`);
      console.log(`    archived_at: ${o.archived_at}, archived_by: ${o.archived_by}`);
      console.log(`    metadata:`, o.metadata);
    });

    // Check if any have order_items
    console.log('\n=== ORDER ITEMS CHECK ===');
    const itemsCheck = await client.query(`
      SELECT o.order_id, COUNT(oi.order_item_id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.archived_at IS NOT NULL
      GROUP BY o.order_id
      HAVING COUNT(oi.order_item_id) > 0
      LIMIT 10
    `);
    console.log(`${itemsCheck.rows.length} archived orders have order_items:`);
    itemsCheck.rows.forEach(r => {
      console.log(`  ${r.order_id}: ${r.item_count} items`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOldArchivedData();
