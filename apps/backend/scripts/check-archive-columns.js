#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

async function checkColumns() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check if archive columns exist in managers table
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'managers'
      AND column_name IN ('archived_at', 'archived_by', 'archive_reason', 'deletion_scheduled')
    `);

    console.log('Archive columns found in managers table:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}`);
    });

    const missingColumns = ['archived_at', 'archived_by', 'archive_reason', 'deletion_scheduled']
      .filter(col => !result.rows.some(row => row.column_name === col));

    if (missingColumns.length > 0) {
      console.log('\nMissing columns:');
      missingColumns.forEach(col => {
        console.log(`  ✗ ${col}`);
      });
      console.log('\nYou need to run the migration: 20250924_add_archive_columns.sql');
    } else {
      console.log('\n✅ All archive columns are present!');
    }
  } catch (error) {
    console.error('Error checking columns:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();