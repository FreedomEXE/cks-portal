require('dotenv').config();
const { Client } = require('pg');

async function testOrderValidation() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🧪 Testing Order Validation\n');

    // First, let's see what the order creation query actually does
    console.log('1️⃣ Checking inventory for PRD-009:');
    const inventoryResult = await client.query(
      `SELECT warehouse_id, quantity_available
       FROM inventory_items
       WHERE item_id = $1 AND status = 'active'
       ORDER BY quantity_available DESC`,
      ['PRD-009']
    );

    console.table(inventoryResult.rows);

    const totalAvailable = inventoryResult.rows.reduce((sum, row) => sum + (row.quantity_available || 0), 0);
    console.log(`Total available: ${totalAvailable} units\n`);

    console.log('2️⃣ Testing validation logic:');
    const requestedQuantity = 90;
    console.log(`Requested: ${requestedQuantity} units`);
    console.log(`Should block? ${requestedQuantity > totalAvailable ? 'YES ❌' : 'NO ✅'}`);

    // Check recent orders to see if the 90 unit order went through
    console.log('\n3️⃣ Recent orders for Auto-Scrubber Pads:');
    const ordersResult = await client.query(`
      SELECT
        o.order_id,
        o.status,
        o.created_at,
        oi.quantity,
        oi.catalog_item_code
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE oi.catalog_item_code = 'PRD-009'
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    console.table(ordersResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testOrderValidation().catch(console.error);