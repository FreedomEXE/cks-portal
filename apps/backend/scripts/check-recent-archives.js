const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkRecentArchives() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    // Check for the specific orders you just archived
    const specific = await client.query(`
      SELECT activity_id, description, created_at
      FROM system_activity
      WHERE target_id IN ('CRW-006-PO-100', 'CRW-006-PO-101', 'CRW-006-PO-102', 'CRW-006-PO-103', 'CRW-006-PO-104')
        AND activity_type = 'order_archived'
      ORDER BY created_at DESC
    `);

    console.log('Archive activities for CRW-006-PO-100 through 104:');
    if (specific.rowCount === 0) {
      console.log('  ❌ NONE FOUND - Archives were NOT recorded!\n');
    } else {
      specific.rows.forEach(r => {
        console.log(`  [${r.activity_id}] ${r.description}`);
        console.log(`     Created: ${r.created_at}`);
      });
      console.log('');
    }

    // Check most recent 10 activities of ANY type
    console.log('Most recent 10 activities in database:');
    const recent = await client.query(`
      SELECT activity_id, activity_type, description, created_at
      FROM system_activity
      ORDER BY created_at DESC
      LIMIT 10
    `);

    recent.rows.forEach((r, idx) => {
      console.log(`  ${idx + 1}. [${r.activity_id}] ${r.activity_type}: ${r.description}`);
      console.log(`     ${r.created_at}`);
    });

    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    await client.end();
  }
}

checkRecentArchives();
