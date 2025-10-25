/**
 * Test the history endpoint with manager entity type
 * Now includes related assignment events
 */

const { Client } = require('pg');

async function testHistoryEndpoint() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('[test] Connected to database');

    // Test what the endpoint does for entityType='manager', entityId='MGR-012'
    const entityType = 'manager';
    const entityId = 'MGR-012';

    console.log(`\n[test] Testing endpoint: /api/activity/entity/${entityType}/${entityId}`);

    // Simulate what the NEW endpoint does (with related assignments)
    const activityTypes = [
      `${entityType}_created`,
      `${entityType}_archived`,
      `${entityType}_restored`,
      `${entityType}_deleted`,
    ];

    console.log('[test] Activity types to search:', activityTypes);
    console.log('[test] Plus: contractor_assigned_to_manager where metadata->>"managerId" = MGR-012');

    // NEW QUERY: Includes related assignment events
    const queryText = `
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
      WHERE (
        (
          UPPER(target_id) = UPPER($1)
          AND target_type = $2
          AND (
            activity_type = ANY($3)
            OR activity_type LIKE $4
          )
        )
        OR (
          activity_type = 'contractor_assigned_to_manager'
          AND metadata ? 'managerId'
          AND UPPER(metadata->>'managerId') = UPPER($1)
        )
      )
      ORDER BY created_at ASC
    `;

    const result = await client.query(
      queryText,
      [
        entityId,
        entityType,
        activityTypes,
        `${entityType}_%`
      ]
    );

    console.log(`\n[test] ✅ Found ${result.rows.length} events for ${entityType} ${entityId}`);

    if (result.rows.length > 0) {
      console.log('\n[test] All events:');
      result.rows.forEach(row => {
        const isAssignment = row.activity_type === 'contractor_assigned_to_manager';
        const prefix = isAssignment ? '  📌 [ASSIGNMENT]' : '  -';
        console.log(`${prefix} ${row.activity_type}: ${row.description} (${row.created_at.toISOString()})`);
        if (isAssignment && row.metadata) {
          console.log(`      Child: ${row.target_id}, Manager: ${row.metadata.managerId}`);
        }
      });

      const assignmentCount = result.rows.filter(r => r.activity_type === 'contractor_assigned_to_manager').length;
      console.log(`\n[test] 📊 Summary: ${result.rows.length} total events (${assignmentCount} assignments)`);
    } else {
      console.log('\n[test] ⚠️  NO EVENTS FOUND!');
    }

  } catch (error) {
    console.error('[test] Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

testHistoryEndpoint();
