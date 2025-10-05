const { Client } = require('pg');
require('dotenv/config');

async function addManagedByColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Add managed_by column to services table
    console.log('Adding managed_by column to services table...');
    await client.query(`
      ALTER TABLE services
      ADD COLUMN IF NOT EXISTS managed_by VARCHAR(50) NULL
    `);
    console.log('✅ managed_by column added successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addManagedByColumn();
