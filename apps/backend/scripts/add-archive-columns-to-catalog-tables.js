/**
 * Add archive columns to catalog_products and catalog_services tables
 */

const { Client } = require('pg');
require('dotenv').config();

async function addArchiveColumnsToCatalog() {
  // Use same SSL logic as backend connection.ts
  const sslEnv = String(process.env.DATABASE_SSL ?? 'true').toLowerCase();
  const useSsl = sslEnv !== 'false' && sslEnv !== '0' && sslEnv !== 'disable';

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ...(useSsl && {
      ssl: {
        rejectUnauthorized: false
      }
    })
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Start transaction
    await client.query('BEGIN');

    // Add archive columns to catalog_products
    console.log('\nAdding archive columns to catalog_products...');
    try {
      await client.query('ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ');
      await client.query('ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50)');
      await client.query('ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS archive_reason TEXT');
      await client.query('ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ');
      await client.query('ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(50)');
      await client.query('ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ');
      await client.query('ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50)');
      console.log('  ✓ Archive columns added to catalog_products');
    } catch (err) {
      console.log('  ⚠ Error adding columns to catalog_products:', err.message);
    }

    // Add archive columns to catalog_services
    console.log('\nAdding archive columns to catalog_services...');
    try {
      await client.query('ALTER TABLE catalog_services ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ');
      await client.query('ALTER TABLE catalog_services ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50)');
      await client.query('ALTER TABLE catalog_services ADD COLUMN IF NOT EXISTS archive_reason TEXT');
      await client.query('ALTER TABLE catalog_services ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ');
      await client.query('ALTER TABLE catalog_services ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(50)');
      await client.query('ALTER TABLE catalog_services ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ');
      await client.query('ALTER TABLE catalog_services ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50)');
      console.log('  ✓ Archive columns added to catalog_services');
    } catch (err) {
      console.log('  ⚠ Error adding columns to catalog_services:', err.message);
    }

    // Create indexes for better query performance
    console.log('\nCreating indexes...');
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_catalog_products_archived_at ON catalog_products(archived_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_catalog_products_deleted_at ON catalog_products(deleted_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_catalog_services_archived_at ON catalog_services(archived_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_catalog_services_deleted_at ON catalog_services(deleted_at)');
      console.log('  ✓ Indexes created');
    } catch (err) {
      console.log('  ⚠ Some indexes may already exist:', err.message);
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Successfully added archive columns to catalog tables');

    // Check current state
    console.log('\nVerifying columns...');

    const productColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'catalog_products'
      AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by')
      ORDER BY column_name
    `);
    console.log('catalog_products archive columns:', productColumns.rows.map(r => r.column_name).join(', '));

    const serviceColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'catalog_services'
      AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by')
      ORDER BY column_name
    `);
    console.log('catalog_services archive columns:', serviceColumns.rows.map(r => r.column_name).join(', '));

    await client.end();
    console.log('\nDatabase connection closed');

  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // ignore
    }
    console.error('\n❌ Error adding archive columns:', error);
    try {
      await client.end();
    } catch (endErr) {
      // ignore
    }
    process.exit(1);
  }
}

// Run immediately
console.log('Adding archive columns to catalog tables (catalog_products, catalog_services)...');
addArchiveColumnsToCatalog();
