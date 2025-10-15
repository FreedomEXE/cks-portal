const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testActivityFiltering() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Test MGR-012's activities with new filtering
    console.log('═══════════════════════════════════════════════════════');
    console.log('👤 MANAGER MGR-012 - NEW FILTERING TEST:');
    console.log('═══════════════════════════════════════════════════════');

    // Get MGR-012 ecosystem
    const contractors = await client.query(`SELECT contractor_id FROM contractors WHERE UPPER(cks_manager) = 'MGR-012'`);
    const customers = await client.query(`SELECT customer_id FROM customers WHERE UPPER(cks_manager) = 'MGR-012'`);
    const centers = await client.query(`SELECT center_id FROM centers WHERE UPPER(cks_manager) = 'MGR-012'`);
    const crew = await client.query(`SELECT crew_id FROM crew WHERE UPPER(cks_manager) = 'MGR-012'`);

    const mgr012Ids = new Set(['MGR-012']);
    contractors.rows.forEach(r => mgr012Ids.add(r.contractor_id?.toUpperCase()));
    customers.rows.forEach(r => mgr012Ids.add(r.customer_id?.toUpperCase()));
    centers.rows.forEach(r => mgr012Ids.add(r.center_id?.toUpperCase()));
    crew.rows.forEach(r => mgr012Ids.add(r.crew_id?.toUpperCase()));

    const idArray = Array.from(mgr012Ids).filter(Boolean);

    console.log(`Ecosystem: ${idArray.join(', ')}`);

    // Apply new filtering logic
    const filtered = await client.query(`
      SELECT
        activity_id,
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        target_type,
        created_at
      FROM system_activity
      WHERE (
        -- Exclude archive/delete activities (admin-only)
        activity_type NOT LIKE '%_archived'
        AND activity_type NOT LIKE '%_deleted'
        AND activity_type NOT LIKE '%_hard_deleted'
        AND activity_type NOT LIKE '%_restored'
      ) AND (
        -- Show creation activities ONLY if target is self
        (activity_type LIKE '%_created' AND UPPER(target_id) = 'MGR-012')
        OR
        -- Show assignment activities ONLY if assigned TO self (check metadata)
        (
          (activity_type LIKE '%_assigned' OR activity_type = 'assignment_made')
          AND (
            (metadata ? 'managerId' AND UPPER(metadata->>'managerId') = 'MGR-012')
            OR (metadata ? 'cksManager' AND UPPER(metadata->>'cksManager') = 'MGR-012')
          )
        )
        OR
        -- Show other activity types (orders, services, etc.) for ecosystem
        (
          activity_type NOT LIKE '%_created'
          AND activity_type NOT LIKE '%_assigned'
          AND activity_type != 'assignment_made'
        )
        AND (
          (actor_id IS NOT NULL AND UPPER(actor_id) = ANY($1::text[]))
          OR (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
          OR (metadata ? 'managerId' AND UPPER(metadata->>'managerId') = 'MGR-012')
          OR (metadata ? 'cksManager' AND UPPER(metadata->>'cksManager') = 'MGR-012')
        )
      )
      ORDER BY created_at DESC
      LIMIT 20
    `, [idArray]);

    console.log(`\nMGR-012 will now see ${filtered.rowCount} activities (filtered):\n`);
    filtered.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.description}`);
      console.log(`    Type: ${row.activity_type}`);
      console.log(`    Actor: ${row.actor_role} (${row.actor_id})`);
      console.log(`    Target: ${row.target_id}`);
      console.log(`    Created: ${row.created_at.toISOString().split('T')[0]}`);
      console.log('');
    });

    // Test CON-010 (Contractor)
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('👤 CONTRACTOR CON-010 - NEW FILTERING TEST:');
    console.log('═══════════════════════════════════════════════════════');

    const con010Customers = await client.query(`SELECT customer_id FROM customers WHERE UPPER(contractor_id) = 'CON-010'`);
    const con010Centers = await client.query(`SELECT center_id FROM centers WHERE UPPER(contractor_id) = 'CON-010'`);
    const con010Crew = await client.query(`
      SELECT c.crew_id
      FROM crew c
      INNER JOIN centers ct ON UPPER(c.assigned_center) = UPPER(ct.center_id)
      WHERE UPPER(ct.contractor_id) = 'CON-010'
    `);

    const con010Ids = new Set(['CON-010']);
    con010Customers.rows.forEach(r => con010Ids.add(r.customer_id?.toUpperCase()));
    con010Centers.rows.forEach(r => con010Ids.add(r.center_id?.toUpperCase()));
    con010Crew.rows.forEach(r => con010Ids.add(r.crew_id?.toUpperCase()));

    const con010IdArray = Array.from(con010Ids).filter(Boolean);

    console.log(`Ecosystem: ${con010IdArray.join(', ')}`);

    const con010Filtered = await client.query(`
      SELECT
        activity_id,
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        target_type,
        created_at
      FROM system_activity
      WHERE (
        activity_type NOT LIKE '%_archived'
        AND activity_type NOT LIKE '%_deleted'
        AND activity_type NOT LIKE '%_hard_deleted'
        AND activity_type NOT LIKE '%_restored'
      ) AND (
        (activity_type LIKE '%_created' AND UPPER(target_id) = 'CON-010')
        OR
        (
          (activity_type LIKE '%_assigned' OR activity_type = 'assignment_made')
          AND (metadata ? 'contractorId' AND UPPER(metadata->>'contractorId') = 'CON-010')
        )
        OR
        (
          activity_type NOT LIKE '%_created'
          AND activity_type NOT LIKE '%_assigned'
          AND activity_type != 'assignment_made'
        )
        AND (
          (actor_id IS NOT NULL AND UPPER(actor_id) = ANY($1::text[]))
          OR (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
          OR (metadata ? 'contractorId' AND UPPER(metadata->>'contractorId') = 'CON-010')
        )
      )
      ORDER BY created_at DESC
      LIMIT 20
    `, [con010IdArray]);

    console.log(`\nCON-010 will now see ${con010Filtered.rowCount} activities (filtered):\n`);
    con010Filtered.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.description}`);
      console.log(`    Type: ${row.activity_type}`);
      console.log(`    Actor: ${row.actor_role} (${row.actor_id})`);
      console.log(`    Target: ${row.target_id}`);
      console.log(`    Created: ${row.created_at.toISOString().split('T')[0]}`);
      console.log('');
    });

    // Test CRW-006 (Crew)
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('👤 CREW CRW-006 - NEW FILTERING TEST:');
    console.log('═══════════════════════════════════════════════════════');

    const crw006Center = await client.query(`SELECT assigned_center FROM crew WHERE UPPER(crew_id) = 'CRW-006'`);
    const crw006Ids = new Set(['CRW-006']);
    if (crw006Center.rows[0]?.assigned_center) {
      crw006Ids.add(crw006Center.rows[0].assigned_center.toUpperCase());
    }

    const crw006IdArray = Array.from(crw006Ids).filter(Boolean);

    console.log(`Ecosystem: ${crw006IdArray.join(', ')}`);

    const crw006Filtered = await client.query(`
      SELECT
        activity_id,
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        target_type,
        created_at
      FROM system_activity
      WHERE (
        activity_type NOT LIKE '%_archived'
        AND activity_type NOT LIKE '%_deleted'
        AND activity_type NOT LIKE '%_hard_deleted'
        AND activity_type NOT LIKE '%_restored'
      ) AND (
        (activity_type LIKE '%_created' AND UPPER(target_id) = 'CRW-006')
        OR
        (
          (activity_type LIKE '%_assigned' OR activity_type = 'assignment_made')
          AND (metadata ? 'crewId' AND UPPER(metadata->>'crewId') = 'CRW-006')
        )
        OR
        (
          activity_type NOT LIKE '%_created'
          AND activity_type NOT LIKE '%_assigned'
          AND activity_type != 'assignment_made'
        )
        AND (
          (actor_id IS NOT NULL AND UPPER(actor_id) = ANY($1::text[]))
          OR (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
          OR (metadata ? 'crewId' AND UPPER(metadata->>'crewId') = 'CRW-006')
        )
      )
      ORDER BY created_at DESC
      LIMIT 20
    `, [crw006IdArray]);

    console.log(`\nCRW-006 will now see ${crw006Filtered.rowCount} activities (filtered):\n`);
    crw006Filtered.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.description}`);
      console.log(`    Type: ${row.activity_type}`);
      console.log(`    Actor: ${row.actor_role} (${row.actor_id})`);
      console.log(`    Target: ${row.target_id}`);
      console.log(`    Created: ${row.created_at.toISOString().split('T')[0]}`);
      console.log('');
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ FILTERING TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

testActivityFiltering();
