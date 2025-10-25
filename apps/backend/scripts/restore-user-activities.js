/**
 * Un-dismiss user creation and assignment activities
 */

require('dotenv/config');
const { Client } = require('pg');

async function restoreUserActivities() {
  const isRenderDb = process.env.DATABASE_URL?.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isRenderDb ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('[restore] Connected to database\n');

    // Delete dismissals for user creation and assignment activities
    const deleteQuery = `
      DELETE FROM activity_dismissals
      WHERE activity_id IN (
        SELECT activity_id
        FROM system_activity
        WHERE activity_type IN (
          -- User creations
          'manager_created',
          'contractor_created',
          'customer_created',
          'center_created',
          'crew_created',
          'warehouse_created',
          -- User assignments
          'contractor_assigned_to_manager',
          'customer_assigned_to_contractor',
          'center_assigned_to_customer',
          'crew_assigned_to_center',
          'order_assigned_to_warehouse'
        )
      )
      RETURNING activity_id
    `;

    const result = await client.query(deleteQuery);

    console.log(`[restore] ✅ Restored ${result.rowCount} user creation and assignment activities`);
    console.log('[restore] These activities are now visible in all user hubs\n');

    // Show what was restored
    const checkQuery = `
      SELECT activity_type, COUNT(*) as count
      FROM system_activity
      WHERE activity_type IN (
        'manager_created', 'contractor_created', 'customer_created',
        'center_created', 'crew_created', 'warehouse_created',
        'contractor_assigned_to_manager', 'customer_assigned_to_contractor',
        'center_assigned_to_customer', 'crew_assigned_to_center',
        'order_assigned_to_warehouse'
      )
      GROUP BY activity_type
      ORDER BY activity_type
    `;

    const checkResult = await client.query(checkQuery);

    console.log('[restore] Now visible in hubs:');
    checkResult.rows.forEach(row => {
      console.log(`  ✅ ${row.activity_type}: ${row.count} activities`);
    });

    console.log('\n[restore] Test by refreshing any user hub (Manager, Contractor, Crew, etc.)');

  } catch (error) {
    console.error('[restore] Error:', error.message);
  } finally {
    await client.end();
  }
}

restoreUserActivities();
