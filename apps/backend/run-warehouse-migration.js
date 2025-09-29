const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: 'postgresql://cks_portal_db_user:SN6DBtsYKzDjo9JbfzdDbcoTOda6AH4X@dpg-d2aesdvgi27c73f87q7g-a.oregon-postgres.render.com/cks_portal_db'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationPath = path.join(__dirname, '../../database/migrations/047_cleanup_warehouses.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running warehouse cleanup migration...');
    await client.query(migrationSQL);

    console.log('Migration completed successfully!');

    // Show the results
    const orderResult = await client.query('SELECT COUNT(*) as count FROM orders WHERE assigned_warehouse = $1', ['WHS-004']);
    console.log(`Orders assigned to WHS-004: ${orderResult.rows[0].count}`);

    const warehouseResult = await client.query('SELECT warehouse_id, name FROM warehouses ORDER BY warehouse_id');
    console.log('Remaining warehouses:');
    warehouseResult.rows.forEach(row => {
      console.log(`  - ${row.warehouse_id}: ${row.name}`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();