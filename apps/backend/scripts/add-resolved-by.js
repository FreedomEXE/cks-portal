const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const migrationPath = path.join(__dirname, '../../../database/migrations/20251008_01_add_resolved_by.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: add resolved_by_id and resolved_at columns...');
    await client.query(sql);
    console.log('✓ Migration completed successfully\n');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
