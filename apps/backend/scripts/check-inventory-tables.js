require('dotenv').config();
const { Client } = require('pg');

async function checkInventoryTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check for inventory-related tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (table_name LIKE '%inventory%'
          OR table_name = 'products'
          OR table_name LIKE '%catalog%')
      ORDER BY table_name
    `);

    console.log('📊 Found the following relevant tables:');
    console.log('=====================================');
    result.rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });

    // Get columns for inventory_items if it exists
    const inventoryCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'inventory_items'
      ORDER BY ordinal_position
    `);

    if (inventoryCheck.rows.length > 0) {
      console.log('\n📦 inventory_items table structure:');
      console.log('=====================================');
      console.table(inventoryCheck.rows);
    }

    // Check products table structure
    const productsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'products'
      ORDER BY ordinal_position
    `);

    if (productsCheck.rows.length > 0) {
      console.log('\n📦 products table structure:');
      console.log('=====================================');
      console.table(productsCheck.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

checkInventoryTables().catch(console.error);