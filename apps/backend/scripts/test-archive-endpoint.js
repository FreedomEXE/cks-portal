require('dotenv').config();
const { Client } = require('pg');

async function testArchiveQuery() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Simulate what the archive endpoint does for orders
    const queryText = `
      SELECT
        order_id as id,
        'order' as entity_type,
        order_id as name,
        archived_at,
        archived_by,
        archive_reason,
        deletion_scheduled,
        order_type
      FROM orders
      WHERE archived_at IS NOT NULL
      ORDER BY archived_at DESC
      LIMIT 100
    `;

    console.log('=== TESTING ARCHIVE QUERY FOR ORDERS ===\n');
    console.log('Query:', queryText);
    console.log('\n');

    const result = await client.query(queryText);

    console.log(`Found ${result.rows.length} archived orders:\n`);

    if (result.rows.length === 0) {
      console.log('❌ NO ARCHIVED ORDERS FOUND');
    } else {
      result.rows.forEach(row => {
        console.log(`Order: ${row.id}`);
        console.log(`  Type: ${row.order_type}`);
        console.log(`  Archived At: ${row.archived_at}`);
        console.log(`  Archived By: ${row.archived_by}`);
        console.log(`  Reason: ${row.archive_reason || 'N/A'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

testArchiveQuery();
