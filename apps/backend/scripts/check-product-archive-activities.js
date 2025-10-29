// Quick script to check if product_archived activities exist
const { Client } = require('pg');

async function checkProductArchiveActivities() {
  // Use same SSL logic as backend connection.ts
  const sslEnv = String(process.env.DATABASE_SSL ?? 'true').toLowerCase();
  const useSsl = sslEnv !== 'false' && sslEnv !== '0' && sslEnv !== 'disable';

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(useSsl && {
      ssl: {
        rejectUnauthorized: false
      }
    })
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check for product_archived activities
    const result = await client.query(`
      SELECT activity_id, description, activity_type, actor_id, target_id, target_type,
             metadata, created_at, cleared_at
      FROM system_activity
      WHERE activity_type = 'product_archived'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('\n=== Product Archive Activities ===');
    console.log(`Found ${result.rowCount} product_archived activities:\n`);

    if (result.rows.length === 0) {
      console.log('❌ No product_archived activities found in database');
    } else {
      result.rows.forEach((row, i) => {
        console.log(`${i + 1}. Activity ID: ${row.activity_id}`);
        console.log(`   Description: ${row.description}`);
        console.log(`   Type: ${row.activity_type}`);
        console.log(`   Actor: ${row.actor_id}`);
        console.log(`   Target: ${row.target_id} (${row.target_type})`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Cleared: ${row.cleared_at || 'Not cleared'}`);
        console.log(`   Metadata: ${JSON.stringify(row.metadata, null, 2)}`);
        console.log('');
      });
    }

    // Also check recent activities of any type (for comparison)
    const recentResult = await client.query(`
      SELECT activity_id, description, activity_type, created_at
      FROM system_activity
      WHERE cleared_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('\n=== Most Recent Non-Cleared Activities (all types) ===');
    recentResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. [${row.activity_type}] ${row.description} (ID: ${row.activity_id}, Created: ${row.created_at})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkProductArchiveActivities();
