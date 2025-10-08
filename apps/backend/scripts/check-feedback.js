const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check if feedback table exists
    const feedbackCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'feedback'
      );
    `);
    console.log('=== Feedback table exists:', feedbackCheck.rows[0].exists);
    
    // If exists, check columns
    if (feedbackCheck.rows[0].exists) {
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'feedback'
        ORDER BY ordinal_position;
      `);
      console.log('\n=== Feedback table columns ===');
      columns.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    }
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
