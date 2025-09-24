require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cks_user:cks_password@localhost:5432/cks_portal'
});

async function deleteAll() {
  try {
    console.log('Connecting to database...');

    // Use transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      console.log('Deleting all data...');

      // Delete in correct order
      let result = await client.query('DELETE FROM archive_relationships');
      console.log(`  Deleted ${result.rowCount} archive relationships`);

      result = await client.query('DELETE FROM system_activity');
      console.log(`  Deleted ${result.rowCount} activity records`);

      result = await client.query('DELETE FROM crew');
      console.log(`  Deleted ${result.rowCount} crew`);

      result = await client.query('DELETE FROM centers');
      console.log(`  Deleted ${result.rowCount} centers`);

      result = await client.query('DELETE FROM customers');
      console.log(`  Deleted ${result.rowCount} customers`);

      result = await client.query('DELETE FROM contractors');
      console.log(`  Deleted ${result.rowCount} contractors`);

      result = await client.query('DELETE FROM managers');
      console.log(`  Deleted ${result.rowCount} managers`);

      // Reset sequences
      console.log('\nResetting sequences...');
      await client.query('ALTER SEQUENCE cks_manager_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE cks_contractor_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE cks_customer_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE cks_center_seq RESTART WITH 1');
      await client.query('ALTER SEQUENCE cks_crew_seq RESTART WITH 1');

      await client.query('COMMIT');
      console.log('\n✅ All data deleted and sequences reset!');

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run immediately
console.log('⚠️  DELETING ALL TEST DATA...\n');
deleteAll();