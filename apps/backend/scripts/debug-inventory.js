require('dotenv').config();
const { Client } = require('pg');

async function debugInventory() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 Debugging Inventory System\n');

    // Check what's actually in inventory_items
    const inventoryResult = await client.query(`
      SELECT
        warehouse_id,
        item_id,
        item_name,
        quantity_on_hand,
        quantity_available,
        status
      FROM inventory_items
      WHERE item_name LIKE '%Auto-Scrubber%'
      OR item_id = 'PRD-009'
    `);

    console.log('📦 Auto-Scrubber Inventory:');
    console.table(inventoryResult.rows);

    // Check catalog items
    const catalogResult = await client.query(`
      SELECT
        item_code,
        name
      FROM catalog_items
      WHERE name LIKE '%Auto-Scrubber%'
      OR item_code = 'PRD-009'
    `);

    console.log('\n📚 Catalog Items:');
    console.table(catalogResult.rows);

    // Check if there's a mismatch between catalog and inventory IDs
    const mismatchResult = await client.query(`
      SELECT
        ci.item_code as catalog_code,
        ci.name as catalog_name,
        inv.item_id as inventory_id,
        inv.quantity_available
      FROM catalog_items ci
      LEFT JOIN inventory_items inv ON ci.item_code = inv.item_id
      WHERE ci.item_type = 'product'
      LIMIT 5
    `);

    console.log('\n🔗 Catalog to Inventory Mapping:');
    console.table(mismatchResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugInventory().catch(console.error);