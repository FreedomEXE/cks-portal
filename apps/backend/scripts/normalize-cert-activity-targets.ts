#!/usr/bin/env tsx
import 'dotenv/config';
import { query } from '../server/db/connection';

async function normalize() {
  // Ensure target_type, target_id, and metadata.serviceId are consistent for cert events
  const result = await query(
    `WITH x AS (
       SELECT activity_id,
              COALESCE(target_id, '') AS tid,
              substring(description from '([Ss][Rr][Vv]-[0-9]+)') AS id_from_desc
       FROM system_activity
       WHERE activity_type IN ('catalog_service_certified','catalog_service_decertified')
     )
     UPDATE system_activity sa
     SET target_type = 'catalogService',
         target_id = UPPER(COALESCE(NULLIF(x.tid, ''), x.id_from_desc, sa.target_id)),
         metadata = COALESCE(sa.metadata, '{}'::jsonb) || jsonb_build_object(
           'serviceId', UPPER(COALESCE(NULLIF(x.tid, ''), x.id_from_desc, sa.target_id))
         )
     FROM x
     WHERE sa.activity_id = x.activity_id
       AND (
         sa.target_type IS DISTINCT FROM 'catalogService' OR
         sa.target_id IS NULL OR sa.target_id = '' OR
         (NOT (UPPER(sa.target_id) LIKE 'SRV-%')) OR
         NOT (sa.metadata ? 'serviceId')
       )
     RETURNING sa.activity_id`);

  console.log('[normalize-cert-targets] updated rows:', result.rowCount || 0);
}

normalize().catch((e) => {
  console.error('[normalize-cert-targets] failed', e);
  process.exit(1);
});

