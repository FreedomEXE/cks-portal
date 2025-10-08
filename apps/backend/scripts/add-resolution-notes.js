const { Client } = require('pg');

async function addResolutionNotes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Add resolution_notes column to reports table
    console.log('Adding resolution_notes to reports table...');
    await client.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_notes TEXT');
    console.log('✓ Added resolution_notes to reports table');

    // Add resolution_notes column to feedback table
    console.log('Adding resolution_notes to feedback table...');
    await client.query('ALTER TABLE feedback ADD COLUMN IF NOT EXISTS resolution_notes TEXT');
    console.log('✓ Added resolution_notes to feedback table');

    console.log('\n✓ Migration complete!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

addResolutionNotes();
