/**
 * File: db/pool.ts
 *
 * Descriptio:
 *   PostgreSQL connection pool factory and typed query helper.
 * Functionality:
 *   Builds connection string from env, applies dynamic SSL rules, exports singleton Pool + generic query<T>().
 * Importance:
 *   Core data access primitive for raw SQL before/alongside Prisma adoption.
 * Conections:
 *   Used across routes (entities, profiles, me) and internal helpers; referenced by Express server.
 * Notes:
 *   Replace ad-hoc SQL with repository layer / Prisma gradually to reduce duplication.
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import { Pool, QueryResultRow } from 'pg';

function buildConnString(): string {
  const raw = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING || process.env.PG_URL;
  if (raw) return raw;
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const db   = process.env.DB_NAME || process.env.PGDATABASE || 'cks_portal_db';
  const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
  const pass = process.env.DB_PASSWORD || process.env.PGPASSWORD || '';
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}
function pickSSL(cs?: string): false | { rejectUnauthorized: boolean } {
  if (typeof process.env.PG_SSL !== 'undefined')
    return String(process.env.PG_SSL).toLowerCase() === 'false' ? false : { rejectUnauthorized: false };
  if (typeof process.env.DATABASE_SSL !== 'undefined')
    return String(process.env.DATABASE_SSL).toLowerCase() === 'true' ? { rejectUnauthorized: false } : false;
  if (cs && /sslmode=require/i.test(cs)) return { rejectUnauthorized: false };
  if (cs && /render\.com/i.test(cs)) return { rejectUnauthorized: false };
  return false;
}
const connectionString = buildConnString();
const ssl = pickSSL(connectionString);
export const pool = new Pool({ connectionString, ssl });

export async function query<T extends QueryResultRow = any>(text: string, params: any[] = []) {
  const c = await pool.connect();
  try {
    return await c.query<T>(text, params);
  } finally {
    c.release();
  }
}

export default pool;
