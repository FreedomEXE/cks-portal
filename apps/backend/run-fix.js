require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sql = fs.readFileSync(path.join(__dirname, '../../fix_managed_by.sql'), 'utf8');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    await client.query(sql);
    console.log('✓ Migration completed successfully');

    const result = await client.query('SELECT service_id, name, managed_by FROM catalog_services ORDER BY service_id');
    console.log('\n📋 Catalog services:');
    console.table(result.rows);

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
