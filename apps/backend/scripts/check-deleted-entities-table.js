const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkDeletedEntitiesTable() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    // Check if deleted_entities table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'deleted_entities'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;
    console.log('deleted_entities table exists:', tableExists);

    if (tableExists) {
      console.log('\nTable structure:');
      const structure = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'deleted_entities'
        ORDER BY ordinal_position;
      `);

      structure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });

      console.log('\nSample data (first 5 rows):');
      const sample = await client.query(`
        SELECT entity_id, entity_type, deleted_at, deleted_by
        FROM deleted_entities
        ORDER BY deleted_at DESC
        LIMIT 5;
      `);

      if (sample.rowCount === 0) {
        console.log('  (empty table)');
      } else {
        sample.rows.forEach(row => {
          console.log(`  ${row.entity_type}:${row.entity_id} deleted by ${row.deleted_by} at ${row.deleted_at}`);
        });
      }
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

checkDeletedEntitiesTable();
