const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixYellowActivity() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🔧 FIXING ACTIVITY 299 (CON-003 → MGR-004):');
    console.log('═══════════════════════════════════════════════════════\n');

    // Show before
    const before = await client.query(`
      SELECT activity_id, description, actor_id, actor_role
      FROM system_activity
      WHERE activity_id = 299
    `);
    console.log('BEFORE:');
    console.log(`  Actor ID: ${before.rows[0]?.actor_id}`);
    console.log(`  Actor Role: ${before.rows[0]?.actor_role}`);

    // Fix it
    const result = await client.query(`
      UPDATE system_activity
      SET actor_id = 'ADMIN',
          actor_role = 'admin'
      WHERE activity_id = 299
      RETURNING activity_id, description, actor_id, actor_role
    `);

    console.log('\nAFTER:');
    console.log(`  Actor ID: ${result.rows[0]?.actor_id}`);
    console.log(`  Actor Role: ${result.rows[0]?.actor_role}`);

    console.log('\n✅ Fixed! Activity will now display with admin color (gray/black)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

fixYellowActivity();
