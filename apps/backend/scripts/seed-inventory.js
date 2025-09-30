require('dotenv').config();
const { Client } = require('pg');

async function seedInventory() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all active catalog products
    const catalogResult = await client.query(`
      SELECT id, item_code, name, item_type, base_price
      FROM catalog_items
      WHERE is_active = true AND item_type = 'product'
      ORDER BY name
    `);

    console.log(`📚 Found ${catalogResult.rows.length} catalog products to add to inventory\n`);

    // Get active warehouse
    const warehouseResult = await client.query(`
      SELECT warehouse_id, name
      FROM warehouses
      WHERE status = 'active'
      LIMIT 1
    `);

    if (warehouseResult.rows.length === 0) {
      throw new Error('No active warehouse found');
    }

    const warehouse = warehouseResult.rows[0];
    console.log(`🏭 Adding inventory to warehouse: ${warehouse.name} (${warehouse.warehouse_id})\n`);

    // Insert inventory items for each catalog product
    for (const product of catalogResult.rows) {
      // Generate random stock levels for demo purposes
      const quantityOnHand = Math.floor(Math.random() * 100) + 20; // 20-120
      const minStock = Math.floor(quantityOnHand * 0.2); // 20% of on-hand
      const maxStock = quantityOnHand * 2; // Double the on-hand

      const insertResult = await client.query(`
        INSERT INTO inventory_items (
          warehouse_id,
          item_id,
          item_type,
          sku,
          item_name,
          category,
          quantity_on_hand,
          quantity_reserved,
          min_stock_level,
          max_stock_level,
          unit_cost,
          location_code,
          status,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        )
        ON CONFLICT (warehouse_id, item_id) DO UPDATE SET
          quantity_on_hand = EXCLUDED.quantity_on_hand,
          quantity_reserved = EXCLUDED.quantity_reserved,
          min_stock_level = EXCLUDED.min_stock_level,
          max_stock_level = EXCLUDED.max_stock_level,
          updated_at = NOW()
        RETURNING item_name, quantity_on_hand, quantity_available
      `, [
        warehouse.warehouse_id,     // warehouse_id
        product.item_code,          // item_id
        'product',                  // item_type
        product.item_code,          // sku
        product.name,               // item_name
        'Cleaning Supplies',        // category
        quantityOnHand,            // quantity_on_hand
        0,                         // quantity_reserved
        minStock,                 // min_stock_level
        maxStock,                 // max_stock_level
        product.base_price,       // unit_cost
        `A${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 20) + 1}`, // location_code (e.g., A3-15)
        'active'                  // status
      ]);

      const item = insertResult.rows[0];
      console.log(`  ✓ ${item.item_name}: ${item.quantity_available} units available`);
    }

    // Show summary
    const summaryResult = await client.query(`
      SELECT
        COUNT(*) as total_items,
        SUM(quantity_on_hand) as total_quantity,
        SUM(quantity_available) as total_available
      FROM inventory_items
      WHERE warehouse_id = $1
    `, [warehouse.warehouse_id]);

    const summary = summaryResult.rows[0];
    console.log('\n📊 Inventory Summary:');
    console.log('=====================');
    console.log(`  Total SKUs: ${summary.total_items}`);
    console.log(`  Total Quantity: ${summary.total_quantity}`);
    console.log(`  Total Available: ${summary.total_available}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Inventory seeding complete!');
  }
}

seedInventory().catch(console.error);