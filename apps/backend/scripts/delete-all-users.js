/**
 * DANGER: This script permanently deletes ALL users from the database
 * Use only for testing/development purposes
 */

const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://cks_user:cks_password@localhost:5432/cks_portal';

async function deleteAllUsers() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Start transaction
    await client.query('BEGIN');

    // Delete from archive_relationships first (foreign key constraints)
    console.log('Deleting archive relationships...');
    const archiveResult = await client.query('DELETE FROM archive_relationships');
    console.log(`  Deleted ${archiveResult.rowCount} archive relationships`);

    // Delete from system_activity (audit trail)
    console.log('Deleting system activity logs...');
    const activityResult = await client.query('DELETE FROM system_activity');
    console.log(`  Deleted ${activityResult.rowCount} activity records`);

    // Delete in reverse hierarchy order to avoid foreign key violations
    console.log('\nDeleting all users in hierarchy order...');

    // 1. Delete crew (bottom of hierarchy)
    console.log('Deleting crew members...');
    const crewResult = await client.query('DELETE FROM crew');
    console.log(`  Deleted ${crewResult.rowCount} crew members`);

    // 2. Delete centers
    console.log('Deleting centers...');
    const centersResult = await client.query('DELETE FROM centers');
    console.log(`  Deleted ${centersResult.rowCount} centers`);

    // 3. Delete customers
    console.log('Deleting customers...');
    const customersResult = await client.query('DELETE FROM customers');
    console.log(`  Deleted ${customersResult.rowCount} customers`);

    // 4. Delete contractors
    console.log('Deleting contractors...');
    const contractorsResult = await client.query('DELETE FROM contractors');
    console.log(`  Deleted ${contractorsResult.rowCount} contractors`);

    // 5. Delete managers (top of hierarchy)
    console.log('Deleting managers...');
    const managersResult = await client.query('DELETE FROM managers');
    console.log(`  Deleted ${managersResult.rowCount} managers`);

    // Optional: Reset sequences to start from 1 again
    console.log('\nResetting ID sequences...');
    await client.query("ALTER SEQUENCE cks_manager_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE cks_contractor_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE cks_customer_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE cks_center_seq RESTART WITH 1");
    await client.query("ALTER SEQUENCE cks_crew_seq RESTART WITH 1");
    console.log('  All sequences reset to 1');

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Successfully deleted all users and reset sequences');

    // Show summary
    const totalDeleted =
      crewResult.rowCount +
      centersResult.rowCount +
      customersResult.rowCount +
      contractorsResult.rowCount +
      managersResult.rowCount;

    console.log(`\nSummary: Deleted ${totalDeleted} total users across all tables`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting users:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will permanently delete ALL users from the database!');
console.log('This includes: managers, contractors, customers, centers, and crew.');
console.log('ID sequences will be reset to start from 1.\n');

rl.question('Type "DELETE ALL" to confirm: ', async (answer) => {
  if (answer === 'DELETE ALL') {
    await deleteAllUsers();
  } else {
    console.log('Cancelled. No changes were made.');
  }
  rl.close();
  process.exit(0);
});