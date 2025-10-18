import { query } from '../db/connection';
import { clerkClient } from '../core/clerk/client';

async function main() {
  const res = await query<{
    warehouse_id: string;
    name: string | null;
    main_contact: string | null;
    clerk_user_id: string | null;
  }>(
    `SELECT warehouse_id, name, main_contact, clerk_user_id
     FROM warehouses
     WHERE main_contact IS NULL OR TRIM(main_contact) = ''
     ORDER BY warehouse_id`
  );

  let updated = 0;
  for (const row of res.rows) {
    const id = row.warehouse_id;

    // Try to locate the Clerk user either by stored clerk_user_id or by externalId
    let user: any = null;
    try {
      if (row.clerk_user_id) {
        user = await clerkClient.users.getUser(row.clerk_user_id);
      } else {
        const list = await (clerkClient.users as any).getUserList?.({ externalId: [id] });
        user = list?.data?.[0] ?? null;
      }
    } catch (err) {
      console.warn('[backfill] Clerk lookup failed', { id, err });
    }

    const meta = (user?.publicMetadata ?? {}) as Record<string, unknown>;
    const candidate = (meta['mainContact'] as string | undefined) || (user?.firstName as string | undefined) || null;

    if (candidate && candidate.trim()) {
      await query('UPDATE warehouses SET main_contact = $1, updated_at = NOW() WHERE warehouse_id = $2', [candidate.trim(), id]);
      updated += 1;
      console.log(`[backfill] Updated ${id} → main_contact = ${candidate.trim()}`);
    } else {
      console.log(`[backfill] Skipped ${id} (no candidate in Clerk)`);
    }
  }

  console.log(`[backfill] Done. Updated ${updated} warehouse record(s).`);
}

main().catch((err) => {
  console.error('[backfill] Fatal error', err);
  process.exitCode = 1;
});

