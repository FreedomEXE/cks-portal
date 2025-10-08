const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check migrations table
    const migrations = await client.query(
      'SELECT name FROM schema_migrations ORDER BY applied_at DESC LIMIT 15'
    );
    console.log('\n=== Applied Migrations ===');
    migrations.rows.forEach(row => console.log(row.name));
    
    // Check if reports table exists
    const reportsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reports'
      );
    `);
    console.log('\n=== Reports table exists:', reportsCheck.rows[0].exists);
    
    // If exists, check columns
    if (reportsCheck.rows[0].exists) {
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'reports'
        ORDER BY ordinal_position;
      `);
      console.log('\n=== Reports table columns ===');
      columns.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    }
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
