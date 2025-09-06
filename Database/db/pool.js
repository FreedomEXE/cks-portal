"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
function buildConnectionString() {
    const raw = process.env.DATABASE_URL ||
        process.env.PG_CONNECTION_STRING ||
        process.env.PG_URL;
    if (raw)
        return raw;
    const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
    const port = process.env.DB_PORT || process.env.PGPORT || process.env.PG_PORT || '5432';
    const database = process.env.DB_NAME || process.env.PGDATABASE || process.env.PGDATABASE || 'cks_portal_db';
    const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
    const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || '';
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}
function getSSLConfig(connectionString) {
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
    if (connectionString && /sslmode=require/i.test(connectionString)) {
        return { rejectUnauthorized: false };
    }
    if (connectionString && /render\.com|heroku|amazonaws/i.test(connectionString)) {
        return { rejectUnauthorized: false };
    }
    return false;
}
const connectionString = buildConnectionString();
const ssl = getSSLConfig(connectionString);
const pool = new pg_1.Pool({
    connectionString,
    ssl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
const safeUrl = connectionString.replace(/:([^@]+)@/, ':****@');
console.log(`📦 Database pool created: ${safeUrl}`);
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});
exports.default = pool;
//# sourceMappingURL=pool.js.map