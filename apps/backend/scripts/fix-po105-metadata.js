const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixPO105Metadata() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🔧 FIXING CRW-006-PO-105 METADATA:');
    console.log('═══════════════════════════════════════════════════════\n');

    // Get current metadata
    const before = await client.query(`
      SELECT activity_id, metadata
      FROM system_activity
      WHERE target_id = 'CRW-006-PO-105'
        AND activity_type = 'order_created'
    `);

    if (before.rowCount === 0) {
      console.log('❌ Activity not found\n');
      await client.end();
      return;
    }

    console.log('BEFORE:');
    console.log(JSON.stringify(before.rows[0].metadata, null, 2));
    console.log('');

    // Update metadata to include contractorId
    const result = await client.query(`
      UPDATE system_activity
      SET metadata = metadata || '{"contractorId": "CON-010"}'::jsonb
      WHERE target_id = 'CRW-006-PO-105'
        AND activity_type = 'order_created'
      RETURNING activity_id, metadata
    `);

    console.log('AFTER:');
    console.log(JSON.stringify(result.rows[0].metadata, null, 2));
    console.log('');

    console.log('✅ Fixed! CON-010 should now see this activity.');

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await client.end();
  }
}

fixPO105Metadata();
