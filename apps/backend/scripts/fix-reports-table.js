const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    // Add missing columns to reports table
    console.log('\nAdding missing columns to reports table...');
    await client.query(`
      ALTER TABLE reports 
      ADD COLUMN IF NOT EXISTS service_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS tags TEXT[];
    `);
    console.log('✓ Added service_id and tags columns to reports');
    
    // Add missing indexes
    console.log('\nAdding indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_by_center ON reports(center_id);
      CREATE INDEX IF NOT EXISTS idx_reports_by_customer ON reports(customer_id);
      CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by_id, created_by_role);
    `);
    console.log('✓ Added indexes');
    
    // Check if feedback table exists, if not create it
    const feedbackExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'feedback'
      );
    `);
    
    if (!feedbackExists.rows[0].exists) {
      console.log('\nCreating feedback table...');
      await client.query(`
        CREATE TABLE feedback (
          feedback_id VARCHAR(16) PRIMARY KEY,
          kind VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          center_id VARCHAR(50),
          customer_id VARCHAR(50),
          status VARCHAR(20) NOT NULL DEFAULT 'open',
          created_by_role VARCHAR(20) NOT NULL,
          created_by_id VARCHAR(50) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          archived_at TIMESTAMPTZ
        );
        
        CREATE INDEX idx_feedback_status ON feedback(status);
        CREATE INDEX idx_feedback_by_center ON feedback(center_id);
        CREATE INDEX idx_feedback_by_customer ON feedback(customer_id);
        CREATE INDEX idx_feedback_created_by ON feedback(created_by_id, created_by_role);
      `);
      console.log('✓ Created feedback table');
    } else {
      console.log('\n✓ Feedback table already exists');
    }
    
    console.log('\n✅ Database schema fixed successfully!');
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
