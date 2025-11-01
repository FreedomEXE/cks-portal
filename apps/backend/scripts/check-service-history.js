const { Client } = require('pg');
require('dotenv/config');

async function checkServiceHistory() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check services table structure
    console.log('=== Services Table Structure ===');
    const structure = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'services'
      ORDER BY ordinal_position
    `);
    console.log(structure.rows);

    // Check how many services exist with status transitions
    console.log('\n=== Service Status Distribution ===');
    const statusDist = await client.query(`
      SELECT status, COUNT(*) as count
      FROM services
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log(statusDist.rows);

    // Check sample services with metadata
    console.log('\n=== Sample Service Records (first 5) ===');
    const samples = await client.query(`
      SELECT service_id, status, actual_start_time, actual_end_time, managed_by, created_at
      FROM services
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(samples.rows);

    // Check orders table for service metadata
    console.log('\n=== Sample Order Metadata for Services (first 3) ===');
    const orderMeta = await client.query(`
      SELECT order_id, transformed_id,
             metadata->>'serviceStatus' as service_status,
             metadata->>'serviceStartedAt' as started_at,
             metadata->>'serviceCompletedAt' as completed_at,
             metadata->>'serviceCancelledAt' as cancelled_at,
             metadata->>'serviceStartedBy' as started_by
      FROM orders
      WHERE transformed_id IS NOT NULL
      LIMIT 3
    `);
    console.log(orderMeta.rows);

    // Check for existing service activities
    console.log('\n=== Existing Service Activities ===');
    const existing = await client.query(`
      SELECT activity_type, COUNT(*) as count
      FROM system_activity
      WHERE target_type = 'service' OR activity_type LIKE 'service_%'
      GROUP BY activity_type
      ORDER BY count DESC
    `);
    console.log(existing.rows.length > 0 ? existing.rows : 'No service activities found');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkServiceHistory();
