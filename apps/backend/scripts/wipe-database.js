/**
 * Database Wipe Script - For Clean Testing
 *
 * DANGER: This script PERMANENTLY DELETES ALL DATA from the database.
 * Only use this for testing and development.
 *
 * Usage:
 *   node scripts/wipe-database.js
 */

require('dotenv').config();
const { Client } = require('pg');

async function wipeDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Render
    },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Confirm before proceeding
    console.log('\n⚠️  WARNING: This will PERMANENTLY DELETE ALL DATA');
    console.log('Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]);
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🗑️  Starting database wipe...\n');

    // Delete all data from tables (in order to respect foreign keys)
    const tables = [
      'reports',
      'feedback',
      'services',
      'orders',
      'users',
      'products',
      'procedures',
      'service_procedures',
      'service_products',
      'crew_assignments',
      'activity_log',
      'snapshots',
      // Add other tables as needed
    ];

    for (const table of tables) {
      try {
        const result = await client.query(`DELETE FROM ${table}`);
        console.log(`✓ Deleted ${result.rowCount || 0} rows from ${table}`);
      } catch (err) {
        // Table might not exist, skip it
        console.log(`⚠️  Skipped ${table} (might not exist)`);
      }
    }

    // Reset sequences (auto-increment IDs)
    console.log('\n🔄 Resetting sequences...');
    try {
      await client.query(`
        DO $$
        DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public')
          LOOP
            EXECUTE 'ALTER SEQUENCE ' || r.sequence_name || ' RESTART WITH 1';
          END LOOP;
        END $$;
      `);
      console.log('✓ Sequences reset');
    } catch (err) {
      console.log('⚠️  Could not reset sequences:', err.message);
    }

    console.log('\n✅ Database wiped successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Create test users via /auth/register');
    console.log('  2. Test modals to verify they use EntityModalView');
    console.log('  3. Check that RBAC tab visibility works correctly\n');

  } catch (error) {
    console.error('❌ Error wiping database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the wipe
wipeDatabase().catch(console.error);
