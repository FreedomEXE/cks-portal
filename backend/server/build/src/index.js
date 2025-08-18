"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// CKS API — unified TypeScript server (schema‑tolerant lists + profiles + clerk link)
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./core/env");
const logger_1 = require("./core/logger");
const errors_1 = require("./core/errors");
const metrics_1 = require("./core/metrics");
const pg_1 = require("pg");
const entities_1 = __importDefault(require("../routes/entities"));
const profiles_routes_1 = __importDefault(require("../routes/profiles.routes"));
const me_1 = __importDefault(require("../routes/me"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, helmet_1.default)());
app.use(logger_1.httpLogger);
app.use(metrics_1.metricsMiddleware);
app.use((0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 1000 }));
// ---------- connection ----------
function buildConnString() {
    const raw = process.env.DATABASE_URL ||
        process.env.PG_CONNECTION_STRING ||
        process.env.PG_URL;
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
        return String(process.env.PG_SSL).toLowerCase() === 'false'
            ? false
            : { rejectUnauthorized: false };
    if (typeof process.env.DATABASE_SSL !== 'undefined')
        return String(process.env.DATABASE_SSL).toLowerCase() === 'true'
            ? { rejectUnauthorized: false }
            : false;
    if (cs && /sslmode=require/i.test(cs))
        return { rejectUnauthorized: false };
    if (cs && /render\.com/i.test(cs))
        return { rejectUnauthorized: false };
    return false;
}
const connectionString = buildConnString();
const ssl = pickSSL(connectionString);
const pool = new pg_1.Pool({ connectionString, ssl });
async function q(text, params = []) {
    const c = await pool.connect();
    try {
        return await c.query(text, params);
    }
    finally {
        c.release();
    }
}
// ---------- helpers ----------
async function getCols(table) {
    const r = await q(`select column_name from information_schema.columns where table_schema='public' and table_name=$1`, [table]);
    return new Set(r.rows.map(x => x.column_name));
}
function pick(colset, ...cands) {
    for (const c of cands)
        if (colset.has(c))
            return c;
    return null;
}
function buildSearchExpr(alias, colsArr, idx) {
    if (!colsArr.length)
        return { where: '', values: [] };
    const pieces = colsArr.map(c => `coalesce(${alias}.${c}::text,'')`);
    const expr = '(' + pieces.join(` || ' ' || `) + `) ilike $${idx}`;
    return { where: `where ${expr}`, values: [] };
}
async function smartList(opts, req, res) {
    try {
        const { table, alias = 't', searchable = [], orderCandidates = [], selectBuilder } = opts;
        const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
        const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
        const term = String(req.query.q ?? '').trim();
        const colset = await getCols(table);
        const orderBy = pick(colset, ...orderCandidates) || [...colset][0] || '1';
        const searchCols = searchable.filter(c => colset.has(c));
        const selectClause = typeof selectBuilder === 'function' ? selectBuilder(colset, alias) : '*';
        const values = [];
        let where = '';
        if (term) {
            values.push(`%${term}%`);
            const srch = buildSearchExpr(alias, searchCols, values.length);
            where = srch.where;
        }
        const sql = `select ${selectClause} from ${table} ${alias} ${where} order by ${orderBy} limit $${values.length + 1} offset $${values.length + 2}`;
        const rows = await q(sql, [...values, limit, offset]);
        const cntSql = `select count(*) from ${table} ${alias} ${where}`;
        const cnt = await q(cntSql, values);
        res.json({ items: rows.rows, total: Number(cnt.rows[0].count) });
    }
    catch (e) {
        if (String(e?.message || e).includes('does not exist')) {
            return res.json({ items: [], total: 0 });
        }
        res.status(500).json({ error: 'DB error', details: String(e?.message || e) });
    }
}
// ---------- health ----------
app.get('/', (_req, res) => res.json({ ok: true, service: 'cks-api' }));
app.get('/metrics', metrics_1.metricsHandler);
app.get('/test-db', async (_req, res) => {
    try {
        await q('select 1');
        res.json({ ok: true, ssl: !!ssl });
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e?.message || e) });
    }
});
app.get('/health', (_req, res) => res.json({ ok: true }));
// DEV: column probe to finish mapping (only active in dev)
if (process.env.NODE_ENV !== 'production') {
    app.get('/__debug/centers/columns', async (_req, res) => {
        const cols = await getCols('centers');
        res.json({ columns: [...cols] });
    });
}
// ---------- admin lists ----------
app.get('/admin/crew', (req, res) => smartList({
    table: 'crew', alias: 'c',
    searchable: ['crew_id', 'name', 'status', 'role', 'email', 'phone', 'assigned_center', 'address'],
    orderCandidates: ['crew_id', 'name']
}, req, res));
app.get('/admin/contractors', (req, res) => smartList({
    table: 'contractors', alias: 'c',
    searchable: ['contractor_id', 'company_name', 'main_contact', 'cks_manager', 'email', 'phone', 'address', 'num_customers'],
    orderCandidates: ['contractor_id', 'company_name']
}, req, res));
app.get('/admin/customers', (req, res) => smartList({
    table: 'customers', alias: 'c',
    searchable: ['customer_id', 'company_name', 'main_contact', 'cks_manager', 'email', 'phone', 'address', 'num_centers'],
    orderCandidates: ['customer_id', 'company_name']
}, req, res));
app.get('/admin/centers', (req, res) => smartList({
    table: 'centers', alias: 'c',
    searchable: [
        'center_id',
        'name', 'center_name',
        'main_contact',
        'cks_manager',
        'address',
        'phone', 'phone_number',
        'email', 'e_mail',
        'contractor_id', 'assigned_contractor',
        'customer_id', 'assigned_customer'
    ],
    orderCandidates: ['center_id', 'name', 'center_name'],
    selectBuilder: (cols, a) => {
        const nm = cols.has('name') ? `${a}.name`
            : cols.has('center_name') ? `${a}.center_name`
                : `null`;
        const contractor = cols.has('contractor_id') ? `${a}.contractor_id`
            : cols.has('assigned_contractor') ? `${a}.assigned_contractor`
                : `null`;
        const customer = cols.has('customer_id') ? `${a}.customer_id`
            : cols.has('assigned_customer') ? `${a}.assigned_customer`
                : `null`;
        const phone = cols.has('phone') ? `${a}.phone`
            : cols.has('phone_number') ? `${a}.phone_number`
                : `null`;
        const email = cols.has('email') ? `${a}.email`
            : cols.has('e_mail') ? `${a}.e_mail`
                : `null`;
        const pieces = [
            `${a}.center_id`,
            `${a}.cks_manager`,
            `${nm} as name`,
            cols.has('main_contact') ? `${a}.main_contact` : `null as main_contact`,
            cols.has('address') ? `${a}.address` : `null as address`,
            `${phone} as phone`,
            `${email} as email`,
            `${contractor} as contractor_id`,
            `${customer} as customer_id`
        ];
        return pieces.join(', ');
    }
}, req, res));
// ---------- entity profiles (read‑only) ----------
app.get('/crew/:id', async (req, res) => {
    try {
        const r = await q(`select crew_id, name, status, role, address, phone, email, assigned_center
       from crew where crew_id = $1`, [req.params.id]);
        if (!r.rows.length)
            return res.status(404).json({ error: 'Not found' });
        res.json(r.rows[0]);
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e?.message || e) });
    }
});
app.get('/contractors/:id', async (req, res) => {
    try {
        const r = await q(`select contractor_id, cks_manager, company_name, num_customers, main_contact, address, phone, email
       from contractors where contractor_id = $1`, [req.params.id]);
        if (!r.rows.length)
            return res.status(404).json({ error: 'Not found' });
        res.json(r.rows[0]);
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e?.message || e) });
    }
});
app.get('/customers/:id', async (req, res) => {
    try {
        const r = await q(`select customer_id, cks_manager, company_name, num_centers, main_contact, address, phone, email
       from customers where customer_id = $1`, [req.params.id]);
        if (!r.rows.length)
            return res.status(404).json({ error: 'Not found' });
        res.json(r.rows[0]);
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e?.message || e) });
    }
});
app.get('/centers/:id', async (req, res) => {
    try {
        const r = await q(`select center_id, cks_manager, name, main_contact, address, phone, email, contractor_id, customer_id
       from centers where center_id = $1`, [req.params.id]);
        if (!r.rows.length)
            return res.status(404).json({ error: 'Not found' });
        res.json(r.rows[0]);
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e?.message || e) });
    }
});
// Mount modular routes
app.use('/', entities_1.default);
app.use('/profiles', profiles_routes_1.default);
app.use('/', me_1.default);
// ---------- auth: bootstrap/link (Clerk passthrough via x-user-id) ----------
function roleFromInternalCode(code = '') {
    if (code === '000-A')
        return 'admin';
    if (/-A$|^A/.test(code))
        return 'crew';
    if (/-B$|^B/.test(code))
        return 'contractor';
    if (/-C$|^C/.test(code))
        return 'customer';
    if (/-D$|^D/.test(code))
        return 'center';
    return null;
}
function requireUser(req, res, next) {
    const uid = req.header('x-user-id');
    if (!uid)
        return res.status(401).json({ error: 'Unauthorized' });
    req.userId = uid;
    next();
}
app.get('/me/bootstrap', requireUser, async (req, res) => {
    try {
        const r = await q(`select clerk_user_id, email, internal_code, role
       from app_users where clerk_user_id = $1`, [req.userId]);
        if (!r.rows.length)
            return res.json({ linked: false });
        const u = r.rows[0];
        res.json({ linked: true, internal_code: u.internal_code, role: u.role });
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e?.message || e) });
    }
});
app.post('/me/link', requireUser, async (req, res) => {
    try {
        const { internal_code, email } = (req.body || {});
        if (!internal_code)
            return res.status(400).json({ error: 'internal_code required' });
        let exists = internal_code === '000-A';
        if (!exists) {
            const checks = [
                ['crew', 'crew_id'],
                ['contractors', 'contractor_id'],
                ['customers', 'customer_id'],
                ['centers', 'center_id'],
            ];
            for (const [t, c] of checks) {
                const r = await q(`select 1 from ${t} where ${c} = $1 limit 1`, [internal_code]);
                if ((r.rowCount ?? 0) > 0) {
                    exists = true;
                    break;
                }
            }
        }
        if (!exists)
            return res.status(404).json({ error: 'Unknown internal_code' });
        const role = roleFromInternalCode(internal_code);
        if (!role)
            return res.status(400).json({ error: 'Unable to derive role from internal_code' });
        await q(`insert into app_users (clerk_user_id, email, role, internal_code, created_at, updated_at)
       values ($1,$2,$3,$4, now(), now())
       on conflict (clerk_user_id) do update
         set role = excluded.role, internal_code = excluded.internal_code, updated_at = now()`, [req.userId, email || null, role, internal_code]);
        res.json({ linked: true, internal_code, role });
    }
    catch (e) {
        res.status(500).json({ error: 'DB error', details: String(e?.message || e) });
    }
});
// ---------- start ----------
// Swagger (generated spec must be produced offline via docs:gen; fallback minimal spec)
app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup({ openapi: '3.0.3', info: { title: 'CKS API', version: '1.0.0' } }));
// 404 + error handlers
app.use(errors_1.notFound);
app.use(errors_1.errorHandler);
const PORT = Number(env_1.env.PORT || 5000);
app.listen(PORT, () => logger_1.logger.info({ port: PORT }, 'CKS API listening'));
