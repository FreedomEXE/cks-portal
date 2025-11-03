require('dotenv').config();
const { Client } = require('pg');

/**
 * Cleanup script for archived services that won't open modals
 * Deletes CEN-010-SRV-002 and CEN-010-SRV-003 (old archived services)
 */
async function cleanupArchivedServices() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const servicesToDelete = ['CEN-010-SRV-002', 'CEN-010-SRV-003'];

  try {
    await client.connect();
    await client.query('BEGIN');

    console.log('\n=== Cleaning up archived services ===\n');

    for (const serviceId of servicesToDelete) {
      console.log(`Deleting ${serviceId}...`);

      // Check if it exists and is archived
      const check = await client.query(
        'SELECT service_id, service_name, archived_at FROM services WHERE service_id = $1',
        [serviceId]
      );

      if (check.rows.length === 0) {
        console.log(`  ⚠️  Service ${serviceId} not found - skipping`);
        continue;
      }

      const service = check.rows[0];
      console.log(`  Found: ${service.service_name}`);
      console.log(`  Archived: ${service.archived_at || 'NOT ARCHIVED'}`);

      if (!service.archived_at) {
        console.log(`  ⚠️  Service is NOT archived - skipping for safety`);
        continue;
      }

      // Delete the service
      const deleteResult = await client.query(
        'DELETE FROM services WHERE service_id = $1',
        [serviceId]
      );

      if (deleteResult.rowCount === 1) {
        console.log(`  ✅ Deleted ${serviceId}`);
      } else {
        console.log(`  ❌ Delete failed`);
      }

      // Clean up archive relationships
      await client.query(
        "DELETE FROM archive_relationships WHERE entity_type = 'service' AND entity_id = $1",
        [serviceId]
      );
      console.log(`  ✅ Cleaned up archive relationships`);
    }

    console.log('\n=== COMMITTING CHANGES ===\n');

    await client.query('COMMIT');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.query('ROLLBACK');
  } finally {
    await client.end();
  }
}

cleanupArchivedServices();
