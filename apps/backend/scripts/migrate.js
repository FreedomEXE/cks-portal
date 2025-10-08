#!/usr/bin/env node
const path = require('path');
const fs = require('fs/promises');
const { Pool } = require('pg');

const BACKEND_DIR = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'database', 'migrations');
const SEEDS_DIR = path.join(BACKEND_DIR, 'server', 'db', 'seeds');
const MIGRATIONS_TABLE = 'schema_migrations';

function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required to run migrations.');
  }

  const sslEnv = String(process.env.DATABASE_SSL ?? 'true').toLowerCase();
  const useSsl = sslEnv !== 'false' && sslEnv !== '0' && sslEnv !== 'disable';
  return {
    connectionString,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

async function ensureDirectories() {
  await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
  await fs.mkdir(SEEDS_DIR, { recursive: true });
}

function extractSql(content, marker) {
  const markerRegex = new RegExp(`--\s+\+migrate\s+${marker}`, 'i');
  const match = markerRegex.exec(content);
  if (!match) {
    return content.trim();
  }
  const sliceFromMarker = content.slice(match.index + match[0].length);
  const otherMarker = marker.toLowerCase() === 'up' ? 'down' : 'up';
  const otherRegex = new RegExp(`--\s+\+migrate\s+${otherMarker}`, 'i');
  const endMatch = otherRegex.exec(sliceFromMarker);
  const block = endMatch ? sliceFromMarker.slice(0, endMatch.index) : sliceFromMarker;
  return block.trim();
}

async function applyMigration(pool, file) {
  const filePath = path.join(MIGRATIONS_DIR, file);
  const content = await fs.readFile(filePath, 'utf8');
  const upSql = extractSql(content, 'Up');
  if (!upSql) {
    console.warn(`[migrate] skipping ${file}, no Up block found`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(upSql);
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (name, applied_at) VALUES ($1, NOW()) ON CONFLICT (name) DO NOTHING`,
      [file],
    );
    await client.query('COMMIT');
    console.log(`[migrate] applied ${file}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[migrate] failed on ${file}`, error);
    throw error;
  } finally {
    client.release();
  }
}

async function applyMigrations(pool) {
  await ensureDirectories();
  await pool.query(
    `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );

  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const { rows } = await pool.query(`SELECT 1 FROM ${MIGRATIONS_TABLE} WHERE name = $1`, [file]);
    if (rows.length) {
      continue;
    }
    await applyMigration(pool, file);
  }
}

async function applySeeds(pool) {
  const files = (await fs.readdir(SEEDS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(SEEDS_DIR, file);
    const content = (await fs.readFile(filePath, 'utf8')).trim();
    if (!content) {
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(content);
      await client.query('COMMIT');
      console.log(`[seed] executed ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[seed] failed on ${file}`, error);
      throw error;
    } finally {
      client.release();
    }
  }
}

async function main() {
  const runSeeds = process.argv.includes('--seed');
  const pool = new Pool(buildPoolConfig());

  try {
    await pool.query('SELECT 1');
    await applyMigrations(pool);
    if (runSeeds) {
      await applySeeds(pool);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[migrate] fatal error', error);
  process.exit(1);
});
