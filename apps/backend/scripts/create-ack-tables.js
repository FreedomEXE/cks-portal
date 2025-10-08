const { Client } = require('pg');

async function createAckTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected\n');

    // Create report_acknowledgments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_acknowledgments (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(50) NOT NULL,
        acknowledged_by_id VARCHAR(50) NOT NULL,
        acknowledged_by_role VARCHAR(50) NOT NULL,
        acknowledged_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(report_id, acknowledged_by_id)
      )
    `);
    console.log('✓ Created report_acknowledgments');

    // Create feedback_acknowledgments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback_acknowledgments (
        id SERIAL PRIMARY KEY,
        feedback_id VARCHAR(50) NOT NULL,
        acknowledged_by_id VARCHAR(50) NOT NULL,
        acknowledged_by_role VARCHAR(50) NOT NULL,
        acknowledged_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(feedback_id, acknowledged_by_id)
      )
    `);
    console.log('✓ Created feedback_acknowledgments');

    console.log('\n✓ Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

createAckTables();
