/* Modular schema runner: applies bootstrap then unapplied migrations */
import fs from 'fs';
import path from 'path';
import pool from './db/pool';

async function run() {
  const db = pool as any;
  // Apply bootstrap
  const bootstrapPath = path.join(__dirname, 'bootstrap.sql');
  const bootstrap = fs.readFileSync(bootstrapPath, 'utf-8');
  console.log('Applying bootstrap.sql...');
  await db.query(bootstrap);

  // Ensure schema_migrations exists
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Collect migrations
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const applied = new Set<string>();
  const res = await db.query(`SELECT filename FROM schema_migrations ORDER BY filename`);
  res.rows.forEach((r: any) => applied.add(r.filename));

  for (const file of files) {
    if (applied.has(file)) continue;
    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, 'utf-8');
    console.log('Applying migration:', file);
    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [file]);
      await db.query('COMMIT');
    } catch (e) {
      await db.query('ROLLBACK');
      console.error('Migration failed:', file, e);
      process.exit(1);
    }
  }

  console.log('Schema up to date.');
  await db.end();
}

run().catch(e => { console.error(e); process.exit(1); });

