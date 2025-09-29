require('dotenv').config();
const { Pool } = require('pg');

async function updateWarehouse() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // First, update existing references
    console.log('Updating warehouse references...');

    // Update order participants
    await pool.query(`UPDATE order_participants SET participant_id = 'WHS-004' WHERE participant_id = 'WAR-001'`);

    // Update orders table
    await pool.query(`UPDATE orders SET assigned_warehouse = 'WHS-004' WHERE assigned_warehouse = 'WAR-001'`);

    // Delete old warehouse and insert new one
    await pool.query(`DELETE FROM warehouses WHERE warehouse_id = 'WAR-001'`);
    await pool.query(`INSERT INTO warehouses (warehouse_id, name) VALUES ('WHS-004', 'Main Warehouse') ON CONFLICT DO NOTHING`);

    console.log('Successfully updated warehouse to WHS-004!');

    // Verify
    const result = await pool.query('SELECT * FROM warehouses');
    console.log('Current warehouses:', result.rows);
  } catch (error) {
    console.error('Failed to update warehouse:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateWarehouse();