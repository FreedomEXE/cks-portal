/**
 * Check what activities the crew query returns for CRW-006
 */

require('dotenv/config');
const { Client } = require('pg');

async function checkCrewActivities() {
  const isRenderDb = process.env.DATABASE_URL?.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isRenderDb ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('[check] Connected to database\n');

    const crewId = 'CRW-006';

    // Build ecosystem ID array (simulate what getCrewRoleScope does)
    console.log('[check] Building ecosystem for', crewId);

    // For crew, ecosystem includes: self, center, services
    const scopeQuery = `
      SELECT
        c.crew_id,
        c.assigned_center
      FROM crew c
      WHERE UPPER(c.crew_id) = UPPER($1)
      LIMIT 1
    `;

    const scopeResult = await client.query(scopeQuery, [crewId]);

    if (!scopeResult.rowCount) {
      console.log('[check] Crew not found!');
      return;
    }

    const crew = scopeResult.rows[0];
    console.log('[check] Crew data:', crew);

    const ids = new Set();
    ids.add(crewId.toUpperCase());
    if (crew.assigned_center) {
      ids.add(crew.assigned_center.toUpperCase());
    }

    const idArray = Array.from(ids);
    console.log('[check] Ecosystem ID array:', idArray, '\n');

    // Now run the actual activities query
    const activitiesQuery = `
      SELECT activity_id, description, activity_type, actor_id, actor_role,
             target_id, target_type, metadata, created_at
      FROM system_activity
      WHERE (
        -- Exclude archive/delete activities (admin-only)
        activity_type NOT LIKE '%_archived'
        AND activity_type NOT LIKE '%_deleted'
        AND activity_type NOT LIKE '%_hard_deleted'
        AND activity_type NOT LIKE '%_restored'
      ) AND (
        -- Show creation activities ONLY if target is self
        (activity_type LIKE '%_created' AND UPPER(target_id) = $2)
        OR
        -- Show assignments where YOU are being assigned (target is self)
        (activity_type LIKE '%_assigned%' AND UPPER(target_id) = $2)
        OR
        -- Show assignments where you are assigned to a center (crew is in metadata)
        (activity_type = 'crew_assigned_to_center' AND metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $2)
        OR
        -- Show other activity types (orders, services, users, etc.) for ecosystem
        (
          activity_type NOT LIKE '%assigned%'
          AND activity_type != 'assignment_made'
        )
        AND (
          (target_id IS NOT NULL AND UPPER(target_id) = ANY($1::text[]))
          OR (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
          OR (metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $2)
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM activity_dismissals ad
        WHERE ad.activity_id = system_activity.activity_id AND ad.user_id = $2
      )
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const activitiesResult = await client.query(activitiesQuery, [idArray, crewId.toUpperCase()]);

    console.log('[check] Query returned', activitiesResult.rows.length, 'activities\n');

    if (activitiesResult.rows.length === 0) {
      console.log('[check] NO ACTIVITIES FOUND!');
      console.log('[check] Checking if any activities exist at all for crew...\n');

      // Check for ANY activities mentioning this crew
      const anyActivitiesQuery = `
        SELECT activity_id, activity_type, description, target_id, metadata
        FROM system_activity
        WHERE UPPER(target_id) = $1
           OR UPPER(actor_id) = $1
           OR (metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $1)
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const anyResult = await client.query(anyActivitiesQuery, [crewId.toUpperCase()]);
      console.log('[check] Found', anyResult.rows.length, 'total activities mentioning crew:');
      anyResult.rows.forEach(row => {
        console.log('  -', row.activity_type, '|', row.description);
        console.log('    target_id:', row.target_id, '| metadata.crewId:', row.metadata?.crewId);
      });

    } else {
      console.log('[check] Activities returned:');
      activitiesResult.rows.forEach((row, idx) => {
        console.log(`\n${idx + 1}. ${row.activity_type}`);
        console.log('   Description:', row.description);
        console.log('   Target:', row.target_type, row.target_id);
        console.log('   Actor:', row.actor_role, row.actor_id);
        console.log('   Created:', row.created_at?.toISOString());
      });
    }

  } catch (error) {
    console.error('[check] Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

checkCrewActivities();
