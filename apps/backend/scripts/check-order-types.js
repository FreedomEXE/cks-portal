require('dotenv').config();
const { Client } = require('pg');

async function checkOrderTypes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check the specific orders
    const specificOrders = await client.query(`
      SELECT order_id, order_type, status, archived_at, created_by
      FROM orders
      WHERE order_id IN ('CUS-015-SO-044', 'CEN-010-SO-038')
      ORDER BY order_id
    `);

    console.log('=== Specific Orders ===');
    if (specificOrders.rows.length === 0) {
      console.log('No orders found with those IDs');
    } else {
      specificOrders.rows.forEach(row => {
        console.log(`Order ID: ${row.order_id}`);
        console.log(`  Order Type: ${row.order_type || 'NULL/UNDEFINED'}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Archived At: ${row.archived_at || 'NOT ARCHIVED'}`);
        console.log(`  Created By: ${row.created_by}`);
        console.log('');
      });
    }

    // Check all archived orders
    const archivedOrders = await client.query(`
      SELECT order_id, order_type, status, archived_at
      FROM orders
      WHERE archived_at IS NOT NULL
      ORDER BY archived_at DESC
      LIMIT 20
    `);

    console.log('\n=== All Archived Orders (Last 20) ===');
    if (archivedOrders.rows.length === 0) {
      console.log('No archived orders found');
    } else {
      archivedOrders.rows.forEach(row => {
        console.log(`${row.order_id} | Type: ${row.order_type || 'NULL'} | Status: ${row.status}`);
      });
    }

    // Count by order_type
    const typeCounts = await client.query(`
      SELECT
        order_type,
        COUNT(*) as count,
        COUNT(CASE WHEN archived_at IS NOT NULL THEN 1 END) as archived_count
      FROM orders
      GROUP BY order_type
    `);

    console.log('\n=== Order Type Counts ===');
    typeCounts.rows.forEach(row => {
      console.log(`Type: ${row.order_type || 'NULL'} | Total: ${row.count} | Archived: ${row.archived_count}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkOrderTypes();
