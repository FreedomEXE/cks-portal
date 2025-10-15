const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkUserActivities() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Test what MGR-012 would see with the current filtering
    console.log('═══════════════════════════════════════════════════════');
    console.log('👤 WHAT MGR-012 SEES (with current filtering):');
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
        activity_type NOT LIKE '%_archived'
        AND activity_type NOT LIKE '%_deleted'
        AND activity_type NOT LIKE '%_hard_deleted'
        AND activity_type NOT LIKE '%_restored'
      ) AND (
        (activity_type LIKE '%_created' AND UPPER(target_id) = 'MGR-012')
        OR
        (activity_type LIKE '%_assigned%' AND UPPER(target_id) = 'MGR-012')
        OR
        (
          (activity_type = 'contractor_assigned_to_manager' AND metadata ? 'managerId' AND UPPER(metadata->>'managerId') = 'MGR-012')
        )
        OR
        (
          activity_type NOT LIKE '%created%'
          AND activity_type NOT LIKE '%assigned%'
          AND activity_type != 'assignment_made'
        )
        AND (
          (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
          OR (actor_id IS NOT NULL AND UPPER(actor_id) = 'MGR-012')
          OR (metadata ? 'managerId' AND UPPER(metadata->>'managerId') = 'MGR-012')
          OR (metadata ? 'cksManager' AND UPPER(metadata->>'cksManager') = 'MGR-012')
        )
      )
      ORDER BY created_at DESC
      LIMIT 50
    `, [idArray]);

    console.log(`\nMGR-012 sees ${filtered.rowCount} activities:\n`);
    filtered.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.description}`);
      console.log(`    Type: ${row.activity_type}`);
      console.log(`    Actor: ${row.actor_role} (${row.actor_id})`);
      console.log(`    Target: ${row.target_id}`);
      console.log(`    Created: ${row.created_at.toISOString()}`);
      console.log('');
    });

    // What would CRW-006 see?
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('👤 WHAT CRW-006 SEES (with current filtering):');
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
        (activity_type LIKE '%_assigned%' AND UPPER(target_id) = 'CRW-006')
        OR
        (
          activity_type NOT LIKE '%created%'
          AND activity_type NOT LIKE '%assigned%'
          AND activity_type != 'assignment_made'
        )
        AND (
          (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
          OR (actor_id IS NOT NULL AND UPPER(actor_id) = 'CRW-006')
          OR (metadata ? 'crewId' AND UPPER(metadata->>'crewId') = 'CRW-006')
        )
      )
      ORDER BY created_at DESC
      LIMIT 50
    `, [crw006IdArray]);

    console.log(`\nCRW-006 sees ${crw006Filtered.rowCount} activities:\n`);
    crw006Filtered.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.description}`);
      console.log(`    Type: ${row.activity_type}`);
      console.log(`    Actor: ${row.actor_role} (${row.actor_id})`);
      console.log(`    Target: ${row.target_id}`);
      console.log(`    Created: ${row.created_at.toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkUserActivities();
