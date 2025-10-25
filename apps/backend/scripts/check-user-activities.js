/**
 * Check if user creation and assignment activities exist in database
 */

require('dotenv/config');
const { Client } = require('pg');

async function checkUserActivities() {
  const isRenderDb = process.env.DATABASE_URL?.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isRenderDb ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('[check] Connected to database\n');

    // Check for user creation activities
    const creationQuery = `
      SELECT activity_type, COUNT(*) as count
      FROM system_activity
      WHERE activity_type IN (
        'manager_created', 'contractor_created', 'customer_created',
        'center_created', 'crew_created', 'warehouse_created'
      )
      GROUP BY activity_type
      ORDER BY activity_type
    `;

    const creationResult = await client.query(creationQuery);
    console.log('[check] USER CREATION ACTIVITIES:');
    if (creationResult.rows.length === 0) {
      console.log('  ❌ NONE FOUND - No user creation activities exist in database\n');
    } else {
      creationResult.rows.forEach(row => {
        console.log(`  ✅ ${row.activity_type}: ${row.count} activities`);
      });
      console.log('');
    }

    // Check for assignment activities
    const assignmentQuery = `
      SELECT activity_type, COUNT(*) as count
      FROM system_activity
      WHERE activity_type IN (
        'contractor_assigned_to_manager',
        'customer_assigned_to_contractor',
        'center_assigned_to_customer',
        'crew_assigned_to_center',
        'order_assigned_to_warehouse'
      )
      GROUP BY activity_type
      ORDER BY activity_type
    `;

    const assignmentResult = await client.query(assignmentQuery);
    console.log('[check] ASSIGNMENT ACTIVITIES:');
    if (assignmentResult.rows.length === 0) {
      console.log('  ❌ NONE FOUND - No assignment activities exist in database\n');
    } else {
      assignmentResult.rows.forEach(row => {
        console.log(`  ✅ ${row.activity_type}: ${row.count} activities`);
      });
      console.log('');
    }

    // Check sample for CEN-010 (crew's center)
    const centerQuery = `
      SELECT activity_type, description, target_id, created_at
      FROM system_activity
      WHERE (
        activity_type IN ('center_created', 'crew_created', 'crew_assigned_to_center')
        AND (
          target_id = 'CEN-010'
          OR target_id = 'CRW-006'
          OR (metadata ? 'crewId' AND metadata->>'crewId' = 'CRW-006')
          OR (metadata ? 'centerId' AND metadata->>'centerId' = 'CEN-010')
        )
      )
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const centerResult = await client.query(centerQuery);
    console.log('[check] USER ACTIVITIES FOR CRW-006 ECOSYSTEM (CEN-010):');
    if (centerResult.rows.length === 0) {
      console.log('  ❌ NONE FOUND - No user creation/assignment activities for this crew\n');
    } else {
      centerResult.rows.forEach(row => {
        console.log(`  - ${row.activity_type}`);
        console.log(`    ${row.description}`);
        console.log(`    Target: ${row.target_id} | Created: ${row.created_at?.toISOString()}`);
      });
      console.log('');
    }

    // Show what DOES exist for this crew
    console.log('[check] WHAT ACTIVITIES EXIST FOR CRW-006:');
    const existingQuery = `
      SELECT activity_type, COUNT(*) as count
      FROM system_activity
      WHERE target_id LIKE 'CRW-006%'
         OR actor_id = 'CRW-006'
         OR (metadata ? 'crewId' AND metadata->>'crewId' = 'CRW-006')
      GROUP BY activity_type
      ORDER BY count DESC
    `;

    const existingResult = await client.query(existingQuery);
    existingResult.rows.forEach(row => {
      console.log(`  ${row.activity_type}: ${row.count}`);
    });

  } catch (error) {
    console.error('[check] Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserActivities();
