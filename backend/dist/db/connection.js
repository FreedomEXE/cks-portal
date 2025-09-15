"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.pool = void 0;
exports.testConnection = testConnection;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ override: true });
require("dotenv/config");
const pg_1 = require("pg");
const url = process.env.DATABASE_URL;
if (!url || url.trim() === '') {
    throw new Error('Missing DATABASE_URL in .env');
}
exports.pool = new pg_1.Pool({
    connectionString: url,
    // Render requires TLS; rejectUnauthorized:false plays nice locally/behind proxies.
    ssl: { rejectUnauthorized: false },
    keepAlive: true,
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: 10_000,
    max: Number(process.env.DB_POOL_MAX ?? 5),
});
const query = (text, params) => exports.pool.query(text, params);
exports.query = query;
async function testConnection() {
    await exports.pool.query('select 1');
}
exports.default = exports.pool;
//# sourceMappingURL=connection.js.map