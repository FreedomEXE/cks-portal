const { Client } = require('pg');
require('dotenv').config({ path: '../apps/backend/.env' });

async function test() {
  const connectionString = process.env.DATABASE_URL ||
    'postgresql://cks_portal_db_user:SN6DBtsYKzDjo9JbfzdDbcoTOda6AH4X@dpg-d2aesdvgi27c73f87q7g-a.oregon-postgres.render.com/cks_portal_db';

  console.log('Testing connection to:', connectionString.substring(0, 50) + '...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Connected successfully!');

    const result = await client.query('SELECT COUNT(*) as count FROM orders');
    console.log('✓ Query worked! Orders count:', result.rows[0].count);

    await client.end();
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
  }
}

test();