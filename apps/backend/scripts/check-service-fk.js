require('dotenv').config();
const { Client } = require('pg');

async function checkServiceFK() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const r = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'services'
      ORDER BY tc.table_name
    `);

    console.log('TABLES WITH FK TO SERVICES:');
    r.rows.forEach(x => {
      console.log(`  - ${x.table_name}.${x.column_name} → ${x.foreign_table}.${x.foreign_column}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkServiceFK();
