"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pool_1 = __importDefault(require("./db/pool"));
async function run() {
    const db = pool_1.default;
    const bootstrapPath = path_1.default.join(__dirname, 'bootstrap.sql');
    const bootstrap = fs_1.default.readFileSync(bootstrapPath, 'utf-8');
    console.log('Applying bootstrap.sql...');
    await db.query(bootstrap);
    await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
    const migrationsDir = path_1.default.join(__dirname, 'migrations');
    if (!fs_1.default.existsSync(migrationsDir))
        fs_1.default.mkdirSync(migrationsDir, { recursive: true });
    const files = fs_1.default.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort((a, b) => a.localeCompare(b));
    const applied = new Set();
    const res = await db.query(`SELECT filename FROM schema_migrations ORDER BY filename`);
    res.rows.forEach((r) => applied.add(r.filename));
    for (const file of files) {
        if (applied.has(file))
            continue;
        const full = path_1.default.join(migrationsDir, file);
        const sql = fs_1.default.readFileSync(full, 'utf-8');
        console.log('Applying migration:', file);
        await db.query('BEGIN');
        try {
            await db.query(sql);
            await db.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [file]);
            await db.query('COMMIT');
        }
        catch (e) {
            await db.query('ROLLBACK');
            console.error('Migration failed:', file, e);
            process.exit(1);
        }
    }
    console.log('Schema up to date.');
    await db.end();
}
run().catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=runner.js.map