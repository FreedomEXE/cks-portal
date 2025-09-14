"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.queryOne = queryOne;
exports.transaction = transaction;
exports.testConnection = testConnection;
/**
 * File: connection.ts
 *
 * Description: Database connection utility using node-postgres
 * Function: Provide database connection pool and query helpers
 * Importance: Central database access for all repositories
 * Connects to: All repository files, PostgreSQL database
 *
 * Notes: Simple connection pool setup for Manager role implementation
 */
const pg_1 = require("pg");
// Database connection configuration
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'cks_portal_v2',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20, // Maximum connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // Enable SSL for Render or production environments
    ssl: (process.env.NODE_ENV === 'production' || (process.env.DB_HOST || '').includes('render.com'))
        ? { rejectUnauthorized: false }
        : false,
};
// Create connection pool
const pool = new pg_1.Pool(poolConfig);
// Handle pool errors
pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
});
// Query helper with error handling
async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rows;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
// Query helper that returns single row
async function queryOne(text, params) {
    const rows = await query(text, params);
    return rows.length > 0 ? rows[0] : null;
}
// Transaction helper
async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
// Connection test
async function testConnection() {
    try {
        await query('SELECT 1 as test');
        console.log('Database connection successful');
        return true;
    }
    catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}
exports.default = pool;
//# sourceMappingURL=connection.js.map