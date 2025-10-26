/**
 * Test script for catalog service detail endpoint
 * Usage: node scripts/test-catalog-service-endpoint.js
 */

const { Client } = require('pg');

async function testEndpoint() {
  // Determine if we need SSL (Render) or not (local)
  const needsSsl = process.env.DATABASE_URL?.includes('render.com');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get first catalog service
    const result = await client.query(`
      SELECT service_id, name, category, is_active
      FROM catalog_services
      WHERE is_active = true
      ORDER BY service_id
      LIMIT 3
    `);

    if (result.rowCount === 0) {
      console.log('❌ No catalog services found in database');
      return;
    }

    console.log(`Found ${result.rowCount} catalog services:\n`);
    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.service_id} - ${row.name} (${row.category || 'No category'})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('Test catalog service endpoint:');
    console.log(`GET /api/catalog/services/${result.rows[0].service_id}/details`);
    console.log('='.repeat(60));
    console.log('\nEndpoint is ready for testing!');
    console.log(`\nExample test command:`);
    console.log(`curl http://localhost:4000/api/catalog/services/${result.rows[0].service_id}/details \\`);
    console.log(`  -H "Cookie: your-session-cookie"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testEndpoint();
