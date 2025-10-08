const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Add missing status column to feedback table
    console.log('\nAdding missing status column to feedback table...');
    await client.query(`
      ALTER TABLE feedback 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'open';
    `);
    console.log('✓ Added status column to feedback');
    
    // Add missing index
    console.log('\nAdding index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
    `);
    console.log('✓ Added idx_feedback_status index');
    
    console.log('\n✅ Feedback table schema fixed successfully!');
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
