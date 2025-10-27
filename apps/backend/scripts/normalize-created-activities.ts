#!/usr/bin/env tsx
import 'dotenv/config';
import { query } from '../server/db/connection';

async function main() {
  const updates: Array<{ type: string; count: number } > = [];

  // Ensure origin=seed for catalog services that look like seeds; normalize description
  const svc = await query(
    `UPDATE system_activity sa
     SET
       metadata = COALESCE(sa.metadata, '{}'::jsonb) || jsonb_build_object('origin','seed'),
       description = 'Seeded ' || sa.target_id
     WHERE sa.activity_type = 'catalog_service_created'
       AND sa.target_type = 'catalogService'
       AND (sa.description ILIKE 'Seeded%' OR sa.description ILIKE 'Seeded CatalogService%')
       AND (sa.metadata->>'origin' IS DISTINCT FROM 'seed')
     RETURNING activity_id`
  );
  updates.push({ type: 'catalog_service_created', count: svc.rowCount || 0 });

  const prd = await query(
    `UPDATE system_activity sa
     SET
       metadata = COALESCE(sa.metadata, '{}'::jsonb) || jsonb_build_object('origin','seed'),
       description = 'Seeded ' || sa.target_id
     WHERE sa.activity_type = 'product_created'
       AND sa.target_type = 'product'
       AND (sa.description ILIKE 'Seeded%' OR sa.description ILIKE 'Seeded Product%')
       AND (sa.metadata->>'origin' IS DISTINCT FROM 'seed')
     RETURNING activity_id`
  );
  updates.push({ type: 'product_created', count: prd.rowCount || 0 });

  console.log('[normalize] Updated rows:', updates);
}

main().catch((err) => {
  console.error('[normalize] Failed', err);
  process.exit(1);
});

