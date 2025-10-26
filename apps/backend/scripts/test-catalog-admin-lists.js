/**
 * Test script to verify catalog service admin lists populate correctly
 * Tests the exact queries used by the /api/catalog/services/:serviceId/details endpoint
 * Usage: node -r dotenv/config scripts/test-catalog-admin-lists.js
 */

require('dotenv/config');
const { Client } = require('pg');

async function testAdminLists() {
  const needsSsl = process.env.DATABASE_URL?.includes('render.com');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Get a test catalog service
    console.log('Step 1: Fetching test catalog service...');
    const serviceResult = await client.query(`
      SELECT service_id, name, category, is_active
      FROM catalog_services
      WHERE is_active = true
      ORDER BY service_id
      LIMIT 1
    `);

    if (serviceResult.rowCount === 0) {
      console.log('❌ No catalog services found in database');
      return;
    }

    const testService = serviceResult.rows[0];
    console.log(`✅ Found test service: ${testService.service_id} - ${testService.name}\n`);

    // Step 2: Test certifications query
    console.log('Step 2: Testing certifications query...');
    const certResult = await client.query(`
      SELECT user_id, role
      FROM service_certifications
      WHERE service_id = $1 AND archived_at IS NULL
    `, [testService.service_id]);

    console.log(`✅ Certifications query successful: ${certResult.rowCount} certifications found`);
    if (certResult.rowCount > 0) {
      const certsByRole = certResult.rows.reduce((acc, row) => {
        acc[row.role] = (acc[row.role] || 0) + 1;
        return acc;
      }, {});
      console.log('   Breakdown:', certsByRole);
    }
    console.log('');

    // Step 3: Test directory queries (the queries that were failing)
    console.log('Step 3: Testing directory queries with "name" column...\n');

    // Test managers query
    console.log('   3a. Testing managers query...');
    const managersResult = await client.query(`
      SELECT manager_id, name
      FROM managers
      WHERE status = 'active'
      ORDER BY name
    `);
    console.log(`   ✅ Managers query successful: ${managersResult.rowCount} active managers`);
    if (managersResult.rowCount > 0) {
      console.log(`      Sample: ${managersResult.rows[0].manager_id} - ${managersResult.rows[0].name}`);
    }

    // Test contractors query
    console.log('\n   3b. Testing contractors query...');
    const contractorsResult = await client.query(`
      SELECT contractor_id, name
      FROM contractors
      WHERE status = 'active'
      ORDER BY name
    `);
    console.log(`   ✅ Contractors query successful: ${contractorsResult.rowCount} active contractors`);
    if (contractorsResult.rowCount > 0) {
      console.log(`      Sample: ${contractorsResult.rows[0].contractor_id} - ${contractorsResult.rows[0].name}`);
    }

    // Test crew query
    console.log('\n   3c. Testing crew query...');
    const crewResult = await client.query(`
      SELECT crew_id, name
      FROM crew
      WHERE status = 'active'
      ORDER BY name
    `);
    console.log(`   ✅ Crew query successful: ${crewResult.rowCount} active crew members`);
    if (crewResult.rowCount > 0) {
      console.log(`      Sample: ${crewResult.rows[0].crew_id} - ${crewResult.rows[0].name}`);
    }

    // Test warehouses query
    console.log('\n   3d. Testing warehouses query...');
    const warehousesResult = await client.query(`
      SELECT warehouse_id, name
      FROM warehouses
      WHERE status = 'active'
      ORDER BY name
    `);
    console.log(`   ✅ Warehouses query successful: ${warehousesResult.rowCount} active warehouses`);
    if (warehousesResult.rowCount > 0) {
      console.log(`      Sample: ${warehousesResult.rows[0].warehouse_id} - ${warehousesResult.rows[0].name}`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY - Expected Admin Lists Response:');
    console.log('='.repeat(70));
    console.log(`peopleManagers: ${managersResult.rowCount} items`);
    console.log(`peopleContractors: ${contractorsResult.rowCount} items`);
    console.log(`peopleCrew: ${crewResult.rowCount} items`);
    console.log(`peopleWarehouses: ${warehousesResult.rowCount} items`);
    console.log(`certifiedManagers: ${certResult.rows.filter(r => r.role === 'manager').length} items`);
    console.log(`certifiedContractors: ${certResult.rows.filter(r => r.role === 'contractor').length} items`);
    console.log(`certifiedCrew: ${certResult.rows.filter(r => r.role === 'crew').length} items`);
    console.log(`certifiedWarehouses: ${certResult.rows.filter(r => r.role === 'warehouse').length} items`);
    console.log('='.repeat(70));

    console.log('\n✅ All queries executed successfully!');
    console.log('✅ Admin lists should populate correctly in the UI');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testAdminLists();
