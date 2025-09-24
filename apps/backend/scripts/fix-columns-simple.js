const { Client } = require('pg');
require('dotenv').config();

async function fixColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');

    // Try each fix separately to see which one fails
    try {
      console.log('Checking crew table...');
      const crewResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'crew'
      `);

      const crewColumns = crewResult.rows.map(r => r.column_name);
      console.log('Crew columns:', crewColumns.join(', '));

      if (!crewColumns.includes('emergency_contact')) {
        if (crewColumns.includes('role')) {
          console.log('Renaming role to emergency_contact...');
          await client.query('ALTER TABLE crew RENAME COLUMN role TO emergency_contact');
        } else {
          console.log('Adding emergency_contact column...');
          await client.query('ALTER TABLE crew ADD COLUMN emergency_contact VARCHAR(255)');
        }
        console.log('✓ Fixed crew.emergency_contact');
      } else {
        console.log('✓ crew.emergency_contact already exists');
      }
    } catch (err) {
      console.log('Error with crew table:', err.message);
    }

    try {
      console.log('Checking warehouses table...');
      const whResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'warehouses'
      `);

      const whColumns = whResult.rows.map(r => r.column_name);

      if (!whColumns.includes('main_contact')) {
        console.log('Adding main_contact column...');
        await client.query('ALTER TABLE warehouses ADD COLUMN main_contact VARCHAR(255)');
        console.log('✓ Fixed warehouses.main_contact');
      } else {
        console.log('✓ warehouses.main_contact already exists');
      }
    } catch (err) {
      console.log('Error with warehouses table:', err.message);
    }

    try {
      console.log('Checking managers table...');
      const mgrResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'managers'
      `);

      const mgrColumns = mgrResult.rows.map(r => r.column_name);
      const toAdd = [];

      if (!mgrColumns.includes('role')) toAdd.push('ADD COLUMN role VARCHAR(255)');
      if (!mgrColumns.includes('reports_to')) toAdd.push('ADD COLUMN reports_to VARCHAR(255)');
      if (!mgrColumns.includes('address')) toAdd.push('ADD COLUMN address VARCHAR(255)');

      if (toAdd.length > 0) {
        console.log('Adding manager columns...');
        await client.query(`ALTER TABLE managers ${toAdd.join(', ')}`);
        console.log('✓ Fixed managers columns');
      } else {
        console.log('✓ All manager columns already exist');
      }
    } catch (err) {
      console.log('Error with managers table:', err.message);
    }

    console.log('\nAll done!');
  } catch (error) {
    console.error('Connection error:', error.message);
    console.error('Make sure your database is running and DATABASE_URL is correct');
  } finally {
    await client.end();
  }
}

fixColumns();