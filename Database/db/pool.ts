/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * pool.ts
 * 
 * Description: PostgreSQL connection pool configuration
 * Function: Creates and exports a shared database connection pool
 * Importance: Critical - Single source of database connectivity
 * Connects to: PostgreSQL database via connection string
 * 
 * Notes: Automatically detects SSL requirements based on environment.
 *        Supports multiple connection string formats.
 */

import { Pool } from 'pg';

/**
 * Build connection string from environment variables
 */
function buildConnectionString(): string {
  // Check for direct connection string
  const raw = 
    process.env.DATABASE_URL ||
    process.env.PG_CONNECTION_STRING ||
    process.env.PG_URL;
    
  if (raw) return raw;
  
  // Build from individual components
  // Respect both DB_* and common PG_* env var names (Docker/Heroku/etc.)
  const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
  const port = process.env.DB_PORT || process.env.PGPORT || process.env.PG_PORT || '5432';
  const database = process.env.DB_NAME || process.env.PGDATABASE || process.env.PGDATABASE || 'cks_portal_db';
  const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || '';
  
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

/**
 * Determine SSL configuration based on environment
 */
function getSSLConfig(connectionString?: string): false | { rejectUnauthorized: boolean } {
  // Check explicit SSL environment variables
  if (typeof process.env.PG_SSL !== 'undefined') {
    return String(process.env.PG_SSL).toLowerCase() === 'false'
      ? false
      : { rejectUnauthorized: false };
  }
  
  if (typeof process.env.DATABASE_SSL !== 'undefined') {
    return String(process.env.DATABASE_SSL).toLowerCase() === 'true'
      ? { rejectUnauthorized: false }
      : false;
  }
  
  // Check connection string for SSL indicators
  if (connectionString && /sslmode=require/i.test(connectionString)) {
    return { rejectUnauthorized: false };
  }
  
  // Check for known cloud providers
  if (connectionString && /render\.com|heroku|amazonaws/i.test(connectionString)) {
    return { rejectUnauthorized: false };
  }
  
  return false;
}

// Build connection configuration
const connectionString = buildConnectionString();
const ssl = getSSLConfig(connectionString);

// Create and export the pool
const pool = new Pool({
  connectionString,
  ssl,
  max: 2, // Lower limit for Render free tier
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
  connectionTimeoutMillis: 10000, // Longer timeout for Render wake-up
  query_timeout: 30000, // Query timeout for slow Render free tier
  statement_timeout: 30000, // Statement timeout
});

// Log connection info (without password)
const safeUrl = connectionString.replace(/:([^@]+)@/, ':****@');
console.log(`📦 Database pool created: ${safeUrl}`);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export default pool;