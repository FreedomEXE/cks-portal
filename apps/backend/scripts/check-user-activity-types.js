/**
 * Check what target_type values exist for user activities in database
 */

const { Client } = require('pg');

async function checkUserActivityTypes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[check] Connected to database');

    // Check target_type values for user entity IDs
    const query = `
      SELECT DISTINCT target_type, COUNT(*) as count
      FROM system_activity
      WHERE target_id LIKE 'MGR-%'
         OR target_id LIKE 'CON-%'
         OR target_id LIKE 'CUS-%'
         OR target_id LIKE 'CTR-%'
         OR target_id LIKE 'CRW-%'
         OR target_id LIKE 'WHS-%'
      GROUP BY target_type
      ORDER BY target_type
    `;

    const result = await client.query(query);

    console.log('\n[check] Target types for user entities:');
    console.log(JSON.stringify(result.rows, null, 2));

    // Also check actual manager entity activities (not orders)
    const sampleQuery = `
      SELECT activity_id, activity_type, target_id, target_type, description, created_at
      FROM system_activity
      WHERE target_type = 'manager'
        AND target_id ~ '^MGR-[0-9]+$'
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const sampleResult = await client.query(sampleQuery);
    console.log('\n[check] Sample manager activities:');
    console.log(JSON.stringify(sampleResult.rows, null, 2));

  } catch (error) {
    console.error('[check] Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserActivityTypes();
