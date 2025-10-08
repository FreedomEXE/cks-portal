const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');
    
    // Add cks_manager column to reports table
    console.log('Adding cks_manager column to reports table...');
    await client.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS cks_manager VARCHAR(50);
    `);
    console.log('✓ Added cks_manager to reports\n');
    
    // Add cks_manager column to feedback table
    console.log('Adding cks_manager column to feedback table...');
    await client.query(`
      ALTER TABLE feedback 
      ADD COLUMN IF NOT EXISTS cks_manager VARCHAR(50);
    `);
    console.log('✓ Added cks_manager to feedback\n');
    
    // Add indexes for performance
    console.log('Adding indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_cks_manager ON reports(cks_manager);
      CREATE INDEX IF NOT EXISTS idx_feedback_cks_manager ON feedback(cks_manager);
    `);
    console.log('✓ Added cks_manager indexes\n');
    
    console.log('✅ Database schema updated successfully!');
    console.log('\nNote: Existing reports/feedback will have NULL cks_manager.');
    console.log('New reports/feedback will need to set cks_manager on creation.');
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
