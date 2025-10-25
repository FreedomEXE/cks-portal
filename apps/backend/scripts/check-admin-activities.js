/**
 * Check AdminHub activities endpoint
 * Verify why Recent Activity might be showing empty
 */

const { Client } = require('pg');

async function checkAdminActivities() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[check] Connected to database');

    const adminUserId = 'ADMIN-001';

    // Check total activities in system_activity
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM system_activity
    `;
    const totalResult = await client.query(totalQuery);
    console.log(`\n[check] Total activities in system: ${totalResult.rows[0].total}`);

    // Check non-cleared activities
    const nonClearedQuery = `
      SELECT COUNT(*) as total
      FROM system_activity
      WHERE cleared_at IS NULL
    `;
    const nonClearedResult = await client.query(nonClearedQuery);
    console.log(`[check] Non-cleared activities: ${nonClearedResult.rows[0].total}`);

    // Check dismissed activities for ADMIN-001
    const dismissedQuery = `
      SELECT COUNT(*) as total
      FROM activity_dismissals
      WHERE user_id = $1
    `;
    const dismissedResult = await client.query(dismissedQuery, [adminUserId]);
    console.log(`[check] Activities dismissed by ${adminUserId}: ${dismissedResult.rows[0].total}`);

    // Simulate the admin activities endpoint query (with per-user filtering)
    const adminActivitiesQuery = `
      SELECT sa.activity_id, sa.description, sa.activity_type,
             sa.actor_id, sa.actor_role, sa.target_id, sa.target_type,
             sa.metadata, sa.created_at
      FROM system_activity sa
      WHERE sa.cleared_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM activity_dismissals ad
          WHERE ad.activity_id = sa.activity_id AND ad.user_id = $1
        )
      ORDER BY sa.created_at DESC
      LIMIT 20
    `;

    const adminActivitiesResult = await client.query(adminActivitiesQuery, [adminUserId]);

    console.log(`\n[check] ✅ Activities visible to ${adminUserId}: ${adminActivitiesResult.rows.length}`);

    if (adminActivitiesResult.rows.length > 0) {
      console.log('\n[check] Recent 5 activities:');
      adminActivitiesResult.rows.slice(0, 5).forEach(row => {
        console.log(`  - [${row.activity_id}] ${row.activity_type}: ${row.description}`);
        console.log(`    Target: ${row.target_type || 'N/A'}/${row.target_id || 'N/A'} (${row.created_at.toISOString()})`);
      });
    } else {
      console.log('\n[check] ⚠️  NO ACTIVITIES VISIBLE!');
      console.log('[check] Possible reasons:');
      console.log('  1. All activities have been dismissed by this admin user');
      console.log('  2. All activities have cleared_at set');
      console.log('  3. No activities exist in the system');
    }

    // Check most recent activity regardless of dismissal
    const recentQuery = `
      SELECT activity_id, activity_type, description, created_at, cleared_at
      FROM system_activity
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const recentResult = await client.query(recentQuery);

    console.log('\n[check] Most recent 5 activities (regardless of dismissal):');
    recentResult.rows.forEach(row => {
      const cleared = row.cleared_at ? ` [CLEARED ${row.cleared_at.toISOString()}]` : '';
      console.log(`  - [${row.activity_id}] ${row.activity_type}: ${row.description}${cleared}`);
    });

  } catch (error) {
    console.error('[check] Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

checkAdminActivities();
