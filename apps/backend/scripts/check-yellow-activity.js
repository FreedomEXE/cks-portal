const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkYellowActivity() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Find the specific activity about CON-003 → MGR-004
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 SEARCHING FOR CON-003 → MGR-004 ASSIGNMENT:');
    console.log('═══════════════════════════════════════════════════════\n');

    const activity = await client.query(`
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
      WHERE description LIKE '%CON-003%MGR-004%'
        OR (target_id = 'CON-003' AND activity_type LIKE '%assigned%')
      ORDER BY created_at DESC
    `);

    if (activity.rowCount === 0) {
      console.log('❌ No matching activity found');
    } else {
      console.log(`Found ${activity.rowCount} matching activities:\n`);
      activity.rows.forEach((row, idx) => {
        console.log(`[${idx + 1}] Activity ID: ${row.activity_id}`);
        console.log(`    Type: ${row.activity_type}`);
        console.log(`    Description: "${row.description}"`);
        console.log(`    Actor ID: ${row.actor_id}`);
        console.log(`    Actor Role: ${row.actor_role} ⚠️ ${row.actor_role === 'customer' ? 'THIS IS WRONG!' : ''}`);
        console.log(`    Target: ${row.target_type} (${row.target_id})`);
        console.log(`    Metadata: ${row.metadata ? JSON.stringify(row.metadata, null, 2) : 'null'}`);
        console.log(`    Created: ${row.created_at}`);
        console.log('');
      });
    }

    // Also check: Are there any other activities with wrong actor_role?
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 ALL ACTIVITIES WITH NON-ADMIN ACTOR_ROLE:');
    console.log('═══════════════════════════════════════════════════════\n');

    const nonAdmin = await client.query(`
      SELECT
        activity_id,
        activity_type,
        description,
        actor_id,
        actor_role,
        target_id,
        created_at
      FROM system_activity
      WHERE actor_role != 'admin'
      ORDER BY created_at DESC
    `);

    console.log(`Found ${nonAdmin.rowCount} non-admin activities:\n`);
    nonAdmin.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.description}`);
      console.log(`    Actor Role: ${row.actor_role} (Actor ID: ${row.actor_id})`);
      console.log(`    Type: ${row.activity_type}`);
      console.log(`    Created: ${row.created_at.toISOString().split('T')[0]}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkYellowActivity();
