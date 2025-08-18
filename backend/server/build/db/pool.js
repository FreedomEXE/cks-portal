"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
const pg_1 = require("pg");
function buildConnString() {
    const raw = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING || process.env.PG_URL;
    if (raw)
        return raw;
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const db = process.env.DB_NAME || process.env.PGDATABASE || 'cks_portal_db';
    const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
    const pass = process.env.DB_PASSWORD || process.env.PGPASSWORD || '';
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}
function pickSSL(cs) {
    if (typeof process.env.PG_SSL !== 'undefined')
        return String(process.env.PG_SSL).toLowerCase() === 'false' ? false : { rejectUnauthorized: false };
    if (typeof process.env.DATABASE_SSL !== 'undefined')
        return String(process.env.DATABASE_SSL).toLowerCase() === 'true' ? { rejectUnauthorized: false } : false;
    if (cs && /sslmode=require/i.test(cs))
        return { rejectUnauthorized: false };
    if (cs && /render\.com/i.test(cs))
        return { rejectUnauthorized: false };
    return false;
}
const connectionString = buildConnString();
const ssl = pickSSL(connectionString);
exports.pool = new pg_1.Pool({ connectionString, ssl });
async function query(text, params = []) {
    const c = await exports.pool.connect();
    try {
        return await c.query(text, params);
    }
    finally {
        c.release();
    }
}
exports.default = exports.pool;
