const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function analyzeActivityFiltering() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // 1. Get sample activities with full details
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 SAMPLE ACTIVITIES (showing all columns):');
    console.log('═══════════════════════════════════════════════════════');

    const activities = await client.query(`
      SELECT
        activity_id,
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        target_type,
        metadata,
        created_at
      FROM system_activity
      ORDER BY created_at DESC
      LIMIT 20
    `);

    activities.rows.forEach((row, idx) => {
      console.log(`\n[${idx + 1}] Activity ID: ${row.activity_id}`);
      console.log(`    Type: ${row.activity_type}`);
      console.log(`    Description: "${row.description}"`);
      console.log(`    Actor: ${row.actor_role || 'null'} (${row.actor_id || 'null'})`);
      console.log(`    Target: ${row.target_type || 'null'} (${row.target_id || 'null'})`);
      console.log(`    Metadata: ${row.metadata ? JSON.stringify(row.metadata) : 'null'}`);
      console.log(`    Created: ${row.created_at}`);
    });

    // 2. Analyze what MGR-012 should see
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('👤 MANAGER MGR-012 ECOSYSTEM ANALYSIS:');
    console.log('═══════════════════════════════════════════════════════');

    // Get MGR-012's ecosystem
    const contractors = await client.query(`
      SELECT contractor_id FROM contractors WHERE UPPER(cks_manager) = 'MGR-012'
    `);
    const customers = await client.query(`
      SELECT customer_id, contractor_id FROM customers WHERE UPPER(cks_manager) = 'MGR-012'
    `);
    const centers = await client.query(`
      SELECT center_id, customer_id, contractor_id FROM centers WHERE UPPER(cks_manager) = 'MGR-012'
    `);
    const crew = await client.query(`
      SELECT crew_id, assigned_center FROM crew WHERE UPPER(cks_manager) = 'MGR-012'
    `);

    console.log('\nMGR-012 Ecosystem:');
    console.log(`  Contractors: ${contractors.rows.map(r => r.contractor_id).join(', ') || 'none'}`);
    console.log(`  Customers: ${customers.rows.map(r => r.customer_id).join(', ') || 'none'}`);
    console.log(`  Centers: ${centers.rows.map(r => r.center_id).join(', ') || 'none'}`);
    console.log(`  Crew: ${crew.rows.map(r => r.crew_id).join(', ') || 'none'}`);

    // Build idArray like the backend does
    const mgr012Ids = new Set();
    mgr012Ids.add('MGR-012');
    contractors.rows.forEach(r => mgr012Ids.add(r.contractor_id?.toUpperCase()));
    customers.rows.forEach(r => {
      mgr012Ids.add(r.customer_id?.toUpperCase());
      if (r.contractor_id) mgr012Ids.add(r.contractor_id.toUpperCase());
    });
    centers.rows.forEach(r => {
      mgr012Ids.add(r.center_id?.toUpperCase());
      if (r.customer_id) mgr012Ids.add(r.customer_id.toUpperCase());
      if (r.contractor_id) mgr012Ids.add(r.contractor_id.toUpperCase());
    });
    crew.rows.forEach(r => {
      mgr012Ids.add(r.crew_id?.toUpperCase());
      if (r.assigned_center) mgr012Ids.add(r.assigned_center.toUpperCase());
    });

    const idArray = Array.from(mgr012Ids).filter(Boolean);
    console.log(`\nTotal IDs in ecosystem: ${idArray.length}`);
    console.log(`IDs: ${idArray.join(', ')}`);

    // Query activities MGR-012 should see
    const mgr012Activities = await client.query(`
      SELECT
        activity_id,
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        target_type
      FROM system_activity
      WHERE (
        actor_id IS NOT NULL AND UPPER(actor_id) = ANY($1::text[])
      ) OR (
        target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[])
      ) OR (
        metadata ? 'managerId' AND UPPER(metadata->>'managerId') = 'MGR-012'
      ) OR (
        metadata ? 'cksManager' AND UPPER(metadata->>'cksManager') = 'MGR-012'
      )
      ORDER BY created_at DESC
      LIMIT 20
    `, [idArray]);

    console.log(`\nActivities MGR-012 SHOULD see (${mgr012Activities.rowCount} total):\n`);
    mgr012Activities.rows.forEach((row, idx) => {
      const reason = idArray.includes(row.actor_id?.toUpperCase()) ? 'actor in ecosystem' :
                     idArray.includes(row.target_id?.toUpperCase()) ? 'target in ecosystem' :
                     'metadata match';
      console.log(`[${idx + 1}] ${row.description}`);
      console.log(`    Actor: ${row.actor_role} (${row.actor_id})`);
      console.log(`    Target: ${row.target_type} (${row.target_id})`);
      console.log(`    Reason: ${reason}`);
    });

    // 3. Check for "orphaned" activities (admin actions not tied to anyone)
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('⚠️  ORPHANED ADMIN ACTIVITIES (no clear ownership):');
    console.log('═══════════════════════════════════════════════════════');

    const orphaned = await client.query(`
      SELECT
        activity_id,
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        target_type
      FROM system_activity
      WHERE actor_role = 'admin'
        AND activity_type IN ('manager_created', 'contractor_created', 'customer_created', 'center_created', 'crew_created', 'warehouse_created',
                               'manager_archived', 'contractor_archived', 'customer_archived', 'center_archived', 'crew_archived', 'warehouse_archived',
                               'manager_deleted', 'contractor_deleted', 'customer_deleted', 'center_deleted', 'crew_deleted', 'warehouse_deleted')
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log(`\nFound ${orphaned.rowCount} creation/deletion/archive activities:\n`);
    orphaned.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.description}`);
      console.log(`    Type: ${row.activity_type}`);
      console.log(`    Target: ${row.target_id} (${row.target_type})`);
    });

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('✅ ANALYSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

analyzeActivityFiltering();
