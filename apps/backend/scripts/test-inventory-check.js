require('dotenv').config();
const { Client } = require('pg');

async function testInventoryCheck() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🧪 Testing Inventory Check Logic\n');

    // Simulate what happens in insertOrderItems function
    const itemCode = 'PRD-009';
    const requestedQty = 90;

    console.log(`Testing order for ${requestedQty} units of ${itemCode}\n`);

    // Step 1: Fetch product from catalog_products
    const productResult = await client.query(`
      SELECT product_id, name
      FROM catalog_products
      WHERE product_id = $1
    `, [itemCode]);

    if (productResult.rows.length === 0) {
      console.log('❌ Product not found in catalog_products table');
      console.log('Checking catalog_items instead...');

      const catalogResult = await client.query(`
        SELECT item_code, name
        FROM catalog_items
        WHERE item_code = $1
      `, [itemCode]);

      console.table(catalogResult.rows);
    } else {
      console.log('✅ Product found in catalog_products:');
      console.table(productResult.rows);
    }

    // Step 2: Check inventory
    console.log('\nChecking inventory:');
    const inventoryResult = await client.query(`
      SELECT warehouse_id, quantity_available
      FROM inventory_items
      WHERE item_id = $1 AND status = 'active'
    `, [itemCode]);

    console.table(inventoryResult.rows);

    const totalAvailable = inventoryResult.rows.reduce((sum, row) =>
      sum + (row.quantity_available || 0), 0
    );

    console.log(`\n📊 Summary:`);
    console.log(`Requested: ${requestedQty}`);
    console.log(`Available: ${totalAvailable}`);
    console.log(`Should fail? ${requestedQty > totalAvailable ? 'YES ❌' : 'NO ✅'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testInventoryCheck().catch(console.error);