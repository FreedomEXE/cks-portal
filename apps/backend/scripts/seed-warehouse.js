const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

async function seedWarehouse() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../../../database/seeds/add_test_warehouse.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await client.query(sql);
    console.log('Successfully added test warehouse data');

    // Verify the data
    const result = await client.query('SELECT warehouse_id, name, status FROM warehouses WHERE warehouse_id = $1', ['WHS-001']);
    console.log('Warehouse created:', result.rows[0]);

    const productCount = await client.query('SELECT COUNT(*) FROM products WHERE warehouse_id = $1', ['WHS-001']);
    console.log('Products added:', productCount.rows[0].count);

  } catch (error) {
    console.error('Error seeding warehouse:', error);
  } finally {
    await client.end();
  }
}

seedWarehouse();