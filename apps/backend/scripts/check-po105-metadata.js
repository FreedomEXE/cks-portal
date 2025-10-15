const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkPO105Metadata() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 CHECKING CRW-006-PO-105 ACTIVITY:');
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
      WHERE target_id = 'CRW-006-PO-105'
        AND activity_type = 'order_created'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (activity.rowCount === 0) {
      console.log('❌ NO ACTIVITY FOUND for CRW-006-PO-105\n');
    } else {
      const row = activity.rows[0];
      console.log(`Activity ID: ${row.activity_id}`);
      console.log(`Type: ${row.activity_type}`);
      console.log(`Description: "${row.description}"`);
      console.log(`Actor: ${row.actor_id} (${row.actor_role})`);
      console.log(`Target: ${row.target_type} (${row.target_id})`);
      console.log(`Created: ${row.created_at}\n`);

      console.log('METADATA:');
      if (row.metadata) {
        console.log(JSON.stringify(row.metadata, null, 2));
        console.log('\n');

        // Check for hierarchy keys
        const hasContractorId = row.metadata.contractorId || row.metadata.contractor_id;
        const hasCustomerId = row.metadata.customerId || row.metadata.customer_id;
        const hasCenterId = row.metadata.centerId || row.metadata.center_id;
        const hasCrewId = row.metadata.crewId || row.metadata.crew_id;

        console.log('Hierarchy Check:');
        console.log(`  contractorId: ${hasContractorId ? '✓ ' + hasContractorId : '❌ MISSING'}`);
        console.log(`  customerId: ${hasCustomerId ? '✓ ' + hasCustomerId : '❌ MISSING'}`);
        console.log(`  centerId: ${hasCenterId ? '✓ ' + hasCenterId : '❌ MISSING'}`);
        console.log(`  crewId: ${hasCrewId ? '✓ ' + hasCrewId : '❌ MISSING'}`);
      } else {
        console.log('  ❌ NULL - No metadata at all!\n');
      }
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await client.end();
  }
}

checkPO105Metadata();
