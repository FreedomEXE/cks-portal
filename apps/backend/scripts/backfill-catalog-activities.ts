#!/usr/bin/env tsx

/**
 * Backfill catalog activity log entries for existing rows.
 *
 * - Inserts `catalog_service_created` for each row in `catalog_services`
 *   that does not already have a created activity.
 * - Inserts `product_created` for each row in `catalog_products`
 *   that does not already have a created activity.
 *
 * Idempotent: Uses NOT EXISTS checks before insert.
 */

import 'dotenv/config';
import { query } from '../server/db/connection';

async function backfillServices() {
  const rows = await query<{
    service_id: string;
    name: string | null;
    created_at: Date | string | null;
  }>(
    `SELECT service_id, name, created_at
     FROM catalog_services
     ORDER BY service_id`,
  );

  let inserted = 0;
  for (const row of rows.rows) {
    const id = (row.service_id || '').trim();
    if (!id) continue;

    const exists = await query(
      `SELECT 1 FROM system_activity
       WHERE activity_type = 'catalog_service_created'
         AND UPPER(target_id) = UPPER($1)
         AND target_type = 'catalogService'
       LIMIT 1`,
      [id],
    );
    if (exists.rowCount && exists.rowCount > 0) {
      continue;
    }

    const createdAt = row.created_at ? new Date(row.created_at) : new Date();
    const serviceName = row.name || id;

    await query(
      `INSERT INTO system_activity (
         activity_type, description, actor_id, actor_role,
         target_id, target_type, metadata, created_at
       ) VALUES (
         'catalog_service_created',
         $1,
         'ADMIN',
         'admin',
         $2,
         'catalogService',
         $3::jsonb,
         $4
       )`,
      [
        `Seeded ${id}`,
        id,
        JSON.stringify({ serviceName, origin: 'seed' }),
        createdAt.toISOString(),
      ],
    );
    inserted++;
  }
  return inserted;
}

async function backfillProducts() {
  const rows = await query<{
    product_id: string;
    name: string | null;
    created_at: Date | string | null;
  }>(
    `SELECT product_id, name, created_at
     FROM catalog_products
     ORDER BY product_id`,
  );

  let inserted = 0;
  for (const row of rows.rows) {
    const id = (row.product_id || '').trim();
    if (!id) continue;

    const exists = await query(
      `SELECT 1 FROM system_activity
       WHERE activity_type = 'product_created'
         AND UPPER(target_id) = UPPER($1)
         AND target_type = 'product'
       LIMIT 1`,
      [id],
    );
    if (exists.rowCount && exists.rowCount > 0) {
      continue;
    }

    const createdAt = row.created_at ? new Date(row.created_at) : new Date();
    const name = row.name || id;

    await query(
      `INSERT INTO system_activity (
         activity_type, description, actor_id, actor_role,
         target_id, target_type, metadata, created_at
       ) VALUES (
         'product_created',
         $1,
         'ADMIN',
         'admin',
         $2,
         'product',
         $3::jsonb,
         $4
       )`,
      [
        `Seeded ${id}`,
        id,
        JSON.stringify({ productName: name, origin: 'seed' }),
        createdAt.toISOString(),
      ],
    );
    inserted++;
  }
  return inserted;
}

async function main() {
  try {
    const svc = await backfillServices();
    const prd = await backfillProducts();
    console.log(`[backfill] Inserted ${svc} service and ${prd} product creation activities.`);
    process.exit(0);
  } catch (error) {
    console.error('[backfill] Failed:', error);
    process.exit(1);
  }
}

main();
