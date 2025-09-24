#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

async function applyArchiveColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Add missing columns to all user tables
    const tables = ['managers', 'contractors', 'customers', 'centers', 'crew'];

    for (const table of tables) {
      console.log(`\nAdding archive columns to ${table}...`);

      const addColumns = [
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP`,
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50)`,
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS archive_reason TEXT`,
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP`,
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50)`,
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP`
      ];

      for (const sql of addColumns) {
        try {
          await client.query(sql);
          console.log(`  ✓ ${sql.substring(sql.indexOf('ADD COLUMN') + 11, sql.lastIndexOf(' '))}`);
        } catch (err) {
          if (err.code === '42701') { // Column already exists
            console.log(`  - Column already exists: ${sql.substring(sql.indexOf('ADD COLUMN') + 11, sql.lastIndexOf(' '))}`);
          } else {
            throw err;
          }
        }
      }
    }

    // Create archive_relationships table
    console.log('\nCreating archive_relationships table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS archive_relationships (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50) NOT NULL,
        parent_type VARCHAR(50),
        parent_id VARCHAR(50),
        relationship_data JSONB,
        archived_at TIMESTAMP NOT NULL DEFAULT NOW(),
        archived_by VARCHAR(50),
        restored BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✓ archive_relationships table created');

    // Create indexes
    console.log('\nCreating indexes...');
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_managers_archived_at ON managers(archived_at) WHERE archived_at IS NOT NULL`,
      `CREATE INDEX IF NOT EXISTS idx_contractors_archived_at ON contractors(archived_at) WHERE archived_at IS NOT NULL`,
      `CREATE INDEX IF NOT EXISTS idx_customers_archived_at ON customers(archived_at) WHERE archived_at IS NOT NULL`,
      `CREATE INDEX IF NOT EXISTS idx_centers_archived_at ON centers(archived_at) WHERE archived_at IS NOT NULL`,
      `CREATE INDEX IF NOT EXISTS idx_crew_archived_at ON crew(archived_at) WHERE archived_at IS NOT NULL`,
      `CREATE INDEX IF NOT EXISTS idx_archive_relationships_entity ON archive_relationships(entity_type, entity_id)`,
      `CREATE INDEX IF NOT EXISTS idx_archive_relationships_archived_at ON archive_relationships(archived_at)`
    ];

    for (const sql of indexes) {
      try {
        await client.query(sql);
        const indexName = sql.match(/INDEX IF NOT EXISTS (\w+)/)[1];
        console.log(`  ✓ ${indexName}`);
      } catch (err) {
        console.log(`  - Index might already exist: ${err.message}`);
      }
    }

    // Create archived_entities view
    console.log('\nCreating archived_entities view...');
    await client.query(`
      CREATE OR REPLACE VIEW archived_entities AS
      SELECT
        'manager' as entity_type,
        manager_id as entity_id,
        manager_name as name,
        archived_at,
        archived_by,
        archive_reason,
        deletion_scheduled
      FROM managers
      WHERE archived_at IS NOT NULL
      UNION ALL
      SELECT
        'contractor' as entity_type,
        contractor_id as entity_id,
        company_name as name,
        archived_at,
        archived_by,
        archive_reason,
        deletion_scheduled
      FROM contractors
      WHERE archived_at IS NOT NULL
      UNION ALL
      SELECT
        'customer' as entity_type,
        customer_id as entity_id,
        company_name as name,
        archived_at,
        archived_by,
        archive_reason,
        deletion_scheduled
      FROM customers
      WHERE archived_at IS NOT NULL
      UNION ALL
      SELECT
        'center' as entity_type,
        center_id as entity_id,
        name,
        archived_at,
        archived_by,
        archive_reason,
        deletion_scheduled
      FROM centers
      WHERE archived_at IS NOT NULL
      UNION ALL
      SELECT
        'crew' as entity_type,
        crew_id as entity_id,
        name,
        archived_at,
        archived_by,
        archive_reason,
        deletion_scheduled
      FROM crew
      WHERE archived_at IS NOT NULL
    `);
    console.log('  ✓ archived_entities view created');

    await client.query('COMMIT');
    console.log('\n✅ Archive columns successfully applied to all tables!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error applying archive columns:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyArchiveColumns().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});