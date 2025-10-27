#!/usr/bin/env tsx
import 'dotenv/config';
import { query } from '../server/db/connection';

async function run() {
  const results: Record<string, number> = {};

  // 1) Generic lifecycle normalization (remove entity label, keep action + target_id)
  const archived = await query(`UPDATE system_activity SET description = 'Archived ' || target_id WHERE activity_type LIKE '%_archived' RETURNING activity_id`);
  results['archived->Archived ID'] = archived.rowCount || 0;

  const restored = await query(`UPDATE system_activity SET description = 'Restored ' || target_id WHERE activity_type LIKE '%_restored' RETURNING activity_id`);
  results['restored->Restored ID'] = restored.rowCount || 0;

  const deleted = await query(`UPDATE system_activity SET description = 'Deleted ' || target_id WHERE activity_type LIKE '%_deleted' RETURNING activity_id`);
  results['deleted->Deleted ID'] = deleted.rowCount || 0;

  // 2) Created normalization (non-seed)
  const created = await query(
    `UPDATE system_activity
     SET description = 'Created ' || target_id
     WHERE activity_type LIKE '%_created'
       AND (metadata->>'origin') IS DISTINCT FROM 'seed'
     RETURNING activity_id`
  );
  results['created->Created ID'] = created.rowCount || 0;

  // 3) Catalog certifications
  const cert = await query(
    `UPDATE system_activity sa
     SET description = 'Certified ' || (sa.metadata->>'userId') || ' for ' || sa.target_id
     WHERE sa.activity_type = 'catalog_service_certified'
       AND sa.metadata ? 'userId'
     RETURNING activity_id`
  );
  results['catalog_service_certified'] = cert.rowCount || 0;

  const decert = await query(
    `UPDATE system_activity sa
     SET description = 'Uncertified ' || (sa.metadata->>'userId') || ' for ' || sa.target_id
     WHERE sa.activity_type = 'catalog_service_decertified'
       AND sa.metadata ? 'userId'
     RETURNING activity_id`
  );
  results['catalog_service_decertified'] = decert.rowCount || 0;

  console.log('[migrate-descriptions] Updated rows:', results);
}

run().catch((e) => {
  console.error('[migrate-descriptions] failed', e);
  process.exit(1);
});

