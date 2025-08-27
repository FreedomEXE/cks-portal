#!/usr/bin/env node

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * seed runner
 * 
 * Description: Seeds database with initial data
 * Function: Populates database with services, products, and test data
 * Importance: Sets up initial catalog and test data for development
 * 
 * Usage: npm run seed:run
 */

// Load environment variables from backend server
require('dotenv').config({ path: '../../backend/server/.env' });

const fs = require('fs');
const path = require('path');

async function runSeeds() {
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
    
    console.log('🌱 Running database seeds...');
    
    // Get list of seed files
    const seedsDir = __dirname;
    const files = fs.readdirSync(seedsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} seed files`);
    
    for (const filename of files) {
      console.log(`🌱 Running ${filename}...`);
      const filePath = path.join(seedsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await pool.query(sql);
      console.log(`✅ Completed ${filename}`);
    }
    
    console.log('🎉 All seeds completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };