require('dotenv/config');
const { Client } = require('pg');

async function checkOrderNotes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const result = await client.query(`
      SELECT order_id, notes, status
      FROM orders
      WHERE archived_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`Found ${result.rows.length} orders:`);
    result.rows.forEach(row => {
      console.log(`\nOrder: ${row.order_id}`);
      console.log(`Status: ${row.status}`);
      console.log(`Notes: ${row.notes || '(null/empty)'}`);
      console.log(`Notes length: ${row.notes ? row.notes.length : 0}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkOrderNotes();