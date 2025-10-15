const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkCUS015() {
  const needsSSL = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(needsSSL ? { ssl: { rejectUnauthorized: false } } : {})
  });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    const customer = await client.query(`
      SELECT customer_id, name, contractor_id
      FROM customers
      WHERE UPPER(customer_id) = 'CUS-015'
    `);

    if (customer.rowCount === 0) {
      console.log('❌ CUS-015 not found\n');
    } else {
      const row = customer.rows[0];
      console.log('Customer CUS-015:');
      console.log(`  Name: ${row.name}`);
      console.log(`  Contractor: ${row.contractor_id || 'NONE'}\n`);
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
  }
}

checkCUS015();
