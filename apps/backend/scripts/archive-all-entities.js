/**
 * Archive All Entities Script
 *
 * Archives all active entities (managers, contractors, customers, centers, crew,
 * warehouses, services, products, orders, reports, feedback).
 *
 * This makes the UI appear empty while keeping all data in the database for restore.
 * Perfect for testing flows from scratch with a safety net.
 */

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

const ARCHIVE_REASON = 'Bulk archive for fresh testing';
const ARCHIVED_BY = 'ADMIN';
const DELETION_SCHEDULED_DAYS = 30;

async function archiveAll() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    const tables = [
      { table: 'managers', idColumn: 'manager_id', name: 'Managers' },
      { table: 'contractors', idColumn: 'contractor_id', name: 'Contractors' },
      { table: 'customers', idColumn: 'customer_id', name: 'Customers' },
      { table: 'centers', idColumn: 'center_id', name: 'Centers' },
      { table: 'crew', idColumn: 'crew_id', name: 'Crew' },
      { table: 'warehouses', idColumn: 'warehouse_id', name: 'Warehouses' },
      { table: 'services', idColumn: 'service_id', name: 'Services' },
      { table: 'inventory_items', idColumn: 'item_id', name: 'Products' },
      { table: 'orders', idColumn: 'order_id', name: 'Orders' },
      { table: 'reports', idColumn: 'report_id', name: 'Reports' },
      { table: 'feedback', idColumn: 'feedback_id', name: 'Feedback' },
    ];

    console.log('\n🗄️  Archiving all active entities...\n');

    let totalArchived = 0;

    for (const { table, idColumn, name } of tables) {
      try {
        // Calculate deletion date (30 days from now)
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + DELETION_SCHEDULED_DAYS);

        const result = await client.query(
          `UPDATE ${table}
           SET archived_at = NOW(),
               archived_by = $1,
               archive_reason = $2,
               deletion_scheduled = $3,
               updated_at = NOW()
           WHERE archived_at IS NULL
           RETURNING ${idColumn}`,
          [ARCHIVED_BY, ARCHIVE_REASON, deletionDate]
        );

        const count = result.rowCount || 0;
        totalArchived += count;

        if (count > 0) {
          console.log(`  ✓ ${name.padEnd(15)} ${count} archived`);
        } else {
          console.log(`  - ${name.padEnd(15)} 0 active (skipped)`);
        }
      } catch (err) {
        console.error(`  ✗ ${name.padEnd(15)} Failed: ${err.message}`);
      }
    }

    console.log(`\n✓ Total archived: ${totalArchived} entities`);
    console.log(`✓ Deletion scheduled: ${DELETION_SCHEDULED_DAYS} days from now`);
    console.log('\n📝 Next steps:');
    console.log('  1. Refresh your browser - Directory should be empty');
    console.log('  2. Start creating test data from scratch');
    console.log('  3. Check Archive tab to verify entities are preserved');
    console.log('  4. Restore from Archive if needed');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

archiveAll();
