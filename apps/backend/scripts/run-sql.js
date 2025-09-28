require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSQL(sqlFile) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync(path.join(__dirname, sqlFile), 'utf8');
    console.log('Running SQL:\n', sql);

    const result = await client.query(sql);
    console.log('Query result:', result);

    if (result && result.length > 0) {
      const lastResult = result[result.length - 1];
      if (lastResult.rows && lastResult.rows.length > 0) {
        console.table(lastResult.rows);
      }
    }

    console.log('SQL executed successfully');
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Get SQL file from command line argument or use default
const sqlFile = process.argv[2] || 'create-sequences.sql';
runSQL(sqlFile).catch(console.error);