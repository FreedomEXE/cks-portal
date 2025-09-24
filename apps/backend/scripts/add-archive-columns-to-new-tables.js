/**
 * Add archive columns to warehouses, services, and products tables
 */

const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://cks_user:cks_password@localhost:5432/cks_portal';

async function addArchiveColumns() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to database');

    // Start transaction
    await client.query('BEGIN');

    // Add archive columns to warehouses
    console.log('Adding archive columns to warehouses...');
    try {
      await client.query('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP');
      await client.query('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50)');
      await client.query('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS archive_reason TEXT');
      await client.query('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP');
      await client.query('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP');
      await client.query('ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50)');
      console.log('  ✓ Archive columns added to warehouses');
    } catch (err) {
      console.log('  ⚠ Some columns may already exist in warehouses:', err.message);
    }

    // Add archive columns to services
    console.log('Adding archive columns to services...');
    try {
      await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP');
      await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50)');
      await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS archive_reason TEXT');
      await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP');
      await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP');
      await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50)');
      console.log('  ✓ Archive columns added to services');
    } catch (err) {
      console.log('  ⚠ Some columns may already exist in services:', err.message);
    }

    // Add archive columns to products
    console.log('Adding archive columns to products...');
    try {
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP');
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS archived_by VARCHAR(50)');
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS archive_reason TEXT');
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS deletion_scheduled TIMESTAMP');
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS restored_at TIMESTAMP');
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS restored_by VARCHAR(50)');
      console.log('  ✓ Archive columns added to products');
    } catch (err) {
      console.log('  ⚠ Some columns may already exist in products:', err.message);
    }

    // Create indexes for better query performance
    console.log('\nCreating indexes...');
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_warehouses_archived_at ON warehouses(archived_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_services_archived_at ON services(archived_at)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_products_archived_at ON products(archived_at)');
      console.log('  ✓ Indexes created');
    } catch (err) {
      console.log('  ⚠ Some indexes may already exist:', err.message);
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Successfully added archive columns to warehouses, services, and products tables');

    // Check current state
    console.log('\nVerifying columns...');

    const warehouseColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'warehouses'
      AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deletion_scheduled')
    `);
    console.log('Warehouse archive columns:', warehouseColumns.rows.map(r => r.column_name).join(', '));

    const serviceColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'services'
      AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deletion_scheduled')
    `);
    console.log('Service archive columns:', serviceColumns.rows.map(r => r.column_name).join(', '));

    const productColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deletion_scheduled')
    `);
    console.log('Product archive columns:', productColumns.rows.map(r => r.column_name).join(', '));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding archive columns:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

// Run immediately
console.log('Adding archive columns to new tables...\n');
addArchiveColumns();