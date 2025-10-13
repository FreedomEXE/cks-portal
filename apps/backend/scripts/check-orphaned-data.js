require('dotenv').config();
const { Client } = require('pg');

async function checkOrphanedData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check the specific services
    console.log('=== SERVICES ===\n');
    const services = await client.query(`
      SELECT service_id, service_name, status, archived_at, created_at
      FROM services
      WHERE service_id IN ('CEN-010-SRV-003', 'CEN-010-SRV-001')
      ORDER BY service_id
    `);

    if (services.rows.length === 0) {
      console.log('❌ Services NOT FOUND in database (already deleted)');
    } else {
      services.rows.forEach(row => {
        console.log(`Service ID: ${row.service_id}`);
        console.log(`  Name: ${row.service_name}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Archived: ${row.archived_at ? 'YES - ' + row.archived_at : 'NO'}`);
        console.log(`  Created: ${row.created_at}`);
        console.log('');
      });
    }

    // Check the specific orders
    console.log('=== ORDERS ===\n');
    const orders = await client.query(`
      SELECT order_id, order_type, status, archived_at, created_at
      FROM orders
      WHERE order_id IN ('CUS-015-SO-044', 'CEN-010-SO-038')
      ORDER BY order_id
    `);

    if (orders.rows.length === 0) {
      console.log('❌ Orders NOT FOUND in database (already deleted)');
    } else {
      orders.rows.forEach(row => {
        console.log(`Order ID: ${row.order_id}`);
        console.log(`  Type: ${row.order_type}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Archived: ${row.archived_at ? 'YES - ' + row.archived_at : 'NO'}`);
        console.log(`  Created: ${row.created_at}`);
        console.log('');
      });
    }

    // Check all non-deleted services
    console.log('=== ALL SERVICES IN DATABASE ===\n');
    const allServices = await client.query(`
      SELECT service_id, status, archived_at
      FROM services
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (allServices.rows.length === 0) {
      console.log('✓ No services found (clean state)');
    } else {
      console.log(`Found ${allServices.rows.length} services:`);
      allServices.rows.forEach(row => {
        console.log(`  ${row.service_id} | Status: ${row.status} | Archived: ${row.archived_at ? 'YES' : 'NO'}`);
      });
    }

    // Check all non-deleted orders
    console.log('\n=== ALL ORDERS IN DATABASE ===\n');
    const allOrders = await client.query(`
      SELECT order_id, order_type, status, archived_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (allOrders.rows.length === 0) {
      console.log('✓ No orders found (clean state)');
    } else {
      console.log(`Found ${allOrders.rows.length} orders:`);
      allOrders.rows.forEach(row => {
        console.log(`  ${row.order_id} | Type: ${row.order_type} | Status: ${row.status} | Archived: ${row.archived_at ? 'YES' : 'NO'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOrphanedData();
