require('dotenv').config();
const { Client } = require('pg');

async function checkInventoryStatus() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check current inventory items
    const inventoryResult = await client.query(`
      SELECT warehouse_id, item_id, item_name, quantity_on_hand, quantity_available
      FROM inventory_items
      ORDER BY warehouse_id, item_name
      LIMIT 10
    `);

    console.log('📦 Current Inventory Items:');
    console.log('===========================');
    if (inventoryResult.rows.length === 0) {
      console.log('  No inventory items found');
    } else {
      console.table(inventoryResult.rows);
    }

    // Check catalog items
    const catalogResult = await client.query(`
      SELECT id, item_code, name, item_type, base_price
      FROM catalog_items
      WHERE is_active = true
      ORDER BY item_type, name
      LIMIT 10
    `);

    console.log('\n📚 Available Catalog Items:');
    console.log('============================');
    if (catalogResult.rows.length === 0) {
      console.log('  No catalog items found');
    } else {
      console.table(catalogResult.rows);
    }

    // Check warehouse IDs
    const warehouseResult = await client.query(`
      SELECT warehouse_id, name, status
      FROM warehouses
      WHERE status = 'active'
      ORDER BY warehouse_id
    `);

    console.log('\n🏭 Active Warehouses:');
    console.log('=====================');
    if (warehouseResult.rows.length === 0) {
      console.log('  No active warehouses found');
    } else {
      console.table(warehouseResult.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

checkInventoryStatus().catch(console.error);