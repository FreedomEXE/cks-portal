/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: server/db/connection.ts
 *
 * Description:
 * Postgres Pool (single) with Render SSL handling
 *
 * Function:
 * Provide shared Pool, query helper, and testConnection()
 *
 * Importance:
 * Central DB connection for repositories
 *
 * Role in system:
 * Used by repositories and services to perform queries
 *
 * Notes:
 * Respects DATABASE_URL with ?sslmode=require
 * and Render domains (TLS enabled).
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import dotenv from 'dotenv';
dotenv.config({ override: true });
import 'dotenv/config';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url || url.trim() === '') {
  throw new Error('Missing DATABASE_URL in .env');
}

export const pool = new Pool({
  connectionString: url,
  // Render requires TLS; rejectUnauthorized:false plays nice locally/behind proxies.
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  connectionTimeoutMillis: 8_000,
  idleTimeoutMillis: 10_000,
  max: Number(process.env.DB_POOL_MAX ?? 5),
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export async function testConnection() {
  await pool.query('select 1');
}

export default pool;
