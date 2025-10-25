/**
 * Check what the activities endpoint returns
 */

const { Client } = require('pg');

async function checkActivitiesEndpoint() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[check] Connected to database');

    // Simulate what the store does (with per-user filtering)
    const query = `
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

    const result = await client.query(query, ['ADMIN-001']);

    console.log('\n[check] Activities returned:', result.rows.length);
    console.log('\n[check] Sample activities:');

    // Transform like the store does
    const activities = result.rows.map(row => ({
      id: String(row.activity_id),
      description: row.description,
      category: row.activity_type?.includes('created') ? 'success' :
                row.activity_type?.includes('deleted') ? 'warning' :
                row.activity_type?.includes('archived') ? 'info' : 'action',
      actorId: row.actor_id,
      actorRole: row.actor_role,
      targetId: row.target_id,
      targetType: row.target_type,
      metadata: row.metadata,
      createdAt: row.created_at?.toISOString()
    }));

    console.log(JSON.stringify(activities.slice(0, 5), null, 2));

  } catch (error) {
    console.error('[check] Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

checkActivitiesEndpoint();
