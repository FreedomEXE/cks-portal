/**
 * Check if activities are dismissed
 */

require('dotenv/config');
const { Client } = require('pg');

async function checkDismissals() {
  const isRenderDb = process.env.DATABASE_URL?.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isRenderDb ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('[check] Connected to database\n');

    // Check for dismissed activities for CRW-006
    const dismissalQuery = `
      SELECT ad.activity_id, ad.user_id, ad.dismissed_at,
             sa.activity_type, sa.description
      FROM activity_dismissals ad
      JOIN system_activity sa ON sa.activity_id = ad.activity_id
      WHERE ad.user_id = 'CRW-006'
      ORDER BY ad.dismissed_at DESC
      LIMIT 20
    `;

    const result = await client.query(dismissalQuery);

    console.log(`[check] Found ${result.rows.length} dismissed activities for CRW-006:\n`);

    if (result.rows.length === 0) {
      console.log('  ✅ No dismissed activities - should see all activities\n');
    } else {
      result.rows.forEach(row => {
        console.log(`  - ${row.activity_type}`);
        console.log(`    ${row.description}`);
        console.log(`    Dismissed: ${row.dismissed_at?.toISOString()}`);
        console.log('');
      });
    }

    // Check specific user creation activities
    console.log('[check] Checking specific user activities for CRW-006:\n');

    const userActivitiesQuery = `
      SELECT sa.activity_id, sa.activity_type, sa.description, sa.target_id,
             EXISTS(
               SELECT 1 FROM activity_dismissals ad2
               WHERE ad2.activity_id = sa.activity_id AND ad2.user_id = 'CRW-006'
             ) as is_dismissed
      FROM system_activity sa
      WHERE sa.activity_type IN ('crew_created', 'crew_assigned_to_center', 'center_created')
        AND (sa.target_id = 'CRW-006' OR sa.target_id = 'CEN-010'
             OR (sa.metadata ? 'crewId' AND sa.metadata->>'crewId' = 'CRW-006'))
      ORDER BY sa.created_at DESC
    `;

    const activitiesResult = await client.query(userActivitiesQuery);

    activitiesResult.rows.forEach(row => {
      const status = row.is_dismissed ? '❌ DISMISSED' : '✅ VISIBLE';
      console.log(`  ${status} - ${row.activity_type}`);
      console.log(`    ${row.description}`);
      console.log(`    target_id: ${row.target_id}`);
      console.log('');
    });

  } catch (error) {
    console.error('[check] Error:', error.message);
  } finally {
    await client.end();
  }
}

checkDismissals();
