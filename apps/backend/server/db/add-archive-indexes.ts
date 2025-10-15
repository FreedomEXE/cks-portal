/**
 * Add performance indexes for archive/tombstone system
 *
 * Purpose:
 * - Speed up deleted entity lookups in system_activity table
 * - Speed up archive queries on all entity tables
 *
 * Run with: node --loader ts-node/esm add-archive-indexes.ts
 * or: pnpm tsx add-archive-indexes.ts
 */

import { query, getConnection } from './connection';

async function addArchiveIndexes() {
  console.log('[indexes] Starting archive index creation...');

  try {
    // 1. Index for deleted entity lookups
    // Used by: apps/backend/server/domains/entities/service.ts
    // Query pattern: WHERE target_type = ? AND target_id = ? AND activity_type = ? ORDER BY created_at DESC
    console.log('[indexes] Creating index on system_activity for deleted entity lookups...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_activity_deleted_lookup
      ON system_activity(target_type, target_id, activity_type, created_at DESC)
    `);
    console.log('[indexes] ✓ idx_activity_deleted_lookup created');

    // 2. Indexes for archived_at on all entity tables
    // Used for: active/archived filtering across all domains
    const entityTables = [
      { table: 'managers', column: 'archived_at' },
      { table: 'contractors', column: 'archived_at' },
      { table: 'customers', column: 'archived_at' },
      { table: 'centers', column: 'archived_at' },
      { table: 'crew', column: 'archived_at' },
      { table: 'warehouses', column: 'archived_at' },
      { table: 'services', column: 'archived_at' },
      { table: 'orders', column: 'archived_at' },
      { table: 'inventory_items', column: 'archived_at' },
      { table: 'reports', column: 'archived_at' },
      { table: 'feedback', column: 'archived_at' },
    ];

    for (const { table, column } of entityTables) {
      // Check if column exists before creating index
      const columnCheck = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `, [table, column]);

      if (columnCheck.rowCount === 0) {
        console.log(`[indexes] ⚠️  Skipping ${table}.${column} - column does not exist`);
        continue;
      }

      console.log(`[indexes] Creating index on ${table}.${column}...`);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_${table}_archived_at
        ON ${table}(${column})
      `);
      console.log(`[indexes] ✓ idx_${table}_archived_at created`);
    }

    // 3. Optional: Add partial indexes for active-only queries (WHERE archived_at IS NULL)
    // These can significantly speed up queries that filter for non-archived entities
    console.log('[indexes] Creating partial indexes for active-only queries...');
    for (const { table, column } of entityTables) {
      const columnCheck = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      `, [table, column]);

      if (columnCheck.rowCount === 0) {
        continue;
      }

      await query(`
        CREATE INDEX IF NOT EXISTS idx_${table}_active_only
        ON ${table}(${column})
        WHERE ${column} IS NULL
      `);
      console.log(`[indexes] ✓ idx_${table}_active_only created`);
    }

    console.log('[indexes] ✅ All archive indexes created successfully');
  } catch (error) {
    console.error('[indexes] ❌ Failed to create indexes:', error);
    throw error;
  }
}

async function main() {
  try {
    const pool = await getConnection();
    console.log('[indexes] Connected to database');

    await addArchiveIndexes();

    console.log('[indexes] Done. Closing connection...');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('[indexes] Fatal error:', error);
    process.exit(1);
  }
}

main();
