/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * init.ts
 * 
 * Description: Database initialization and schema setup
 * Function: Creates all tables and relationships for CKS Portal
 * Importance: Critical - Sets up the complete database structure
 * Connects to: Database pool, schema.sql
 * 
 * Notes: Run this script to initialize the database with all required tables.
 *        Safe to run multiple times - uses IF NOT EXISTS clauses.
 */

import fs from 'fs';
import path from 'path';
import pool from './pool';

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing CKS Portal database...');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (error: any) {
          // Log non-critical errors but continue
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate key')) {
            console.warn(`⚠️  Warning executing statement: ${error.message}`);
            console.warn(`SQL: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
    
    console.log('✅ Database initialization completed successfully!');
    
    // Verify tables were created
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const result = await pool.query(tablesQuery);
    console.log(`📊 Created ${result.rows.length} tables:`);
    result.rows.forEach((row: any) => {
      console.log(`   • ${row.table_name}`);
    });
    
    return true;
    
  } catch (error: any) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

// Allow running this script directly
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { initializeDatabase };