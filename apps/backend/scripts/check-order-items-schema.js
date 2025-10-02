require('dotenv/config');
const { Client } = require('pg');

async function checkSchema() {
  const sslConfig = process.env.DATABASE_URL.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : false;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position
    `);
    
    console.log('order_items table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
