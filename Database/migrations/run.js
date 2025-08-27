#!/usr/bin/env node

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * migration runner
 * 
 * Description: Simple migration runner for database schema changes
 * Function: Applies SQL migration files in order
 * Importance: Manages database schema evolution
 * 
 * Usage: npm run migration:run
 */

// Load environment variables from backend server
require('dotenv').config({ path: '../../backend/server/.env' });

const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    // Import pool from compiled output or use require hook for .ts files
    const { Pool } = require('pg');
    
    // Build connection string from environment variables (replicated from pool.ts)
    function buildConnectionString() {
      const raw = 
        process.env.DATABASE_URL ||
        process.env.PG_CONNECTION_STRING ||
        process.env.PG_URL;
        
      if (raw) return raw;
      
      const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
      const port = process.env.DB_PORT || process.env.PGPORT || process.env.PG_PORT || '5432';
      const database = process.env.DB_NAME || process.env.PGDATABASE || process.env.PGDATABASE || 'cks_portal_db';
      const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
      const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || '';
      
      return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    }
    
    // Create pool instance
    const connectionString = buildConnectionString();
    const ssl = connectionString && /render\.com|heroku|amazonaws/i.test(connectionString) 
      ? { rejectUnauthorized: false } 
      : false;
    
    const pool = new Pool({ connectionString, ssl });
    
    console.log('🚀 Running database migrations...');
    
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of applied migrations
    const appliedResult = await pool.query('SELECT filename FROM migrations ORDER BY filename');
    const appliedMigrations = new Set(appliedResult.rows.map(r => r.filename));
    
    // Get list of migration files
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files, ${appliedMigrations.size} already applied`);
    
    for (const filename of files) {
      if (appliedMigrations.has(filename)) {
        console.log(`⏭️  Skipping ${filename} (already applied)`);
        continue;
      }
      
      console.log(`🔄 Applying ${filename}...`);
      const filePath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Run in transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
        console.log(`✅ Applied ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    console.log('🎉 All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };