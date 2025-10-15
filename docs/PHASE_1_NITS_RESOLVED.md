# Phase 1 Nits - Resolved ✅

**Date:** 2025-10-14
**Status:** All nits from ChatGPT review addressed

---

## 1. Older Deletions Without Snapshots ✅

**Issue:** What happens when deletion activity exists but `metadata.snapshot` is null (pre-enrichment deletions)?

**Resolution:** Return minimal tombstone instead of 404

**File:** `apps/backend/server/domains/entities/service.ts:189-202`

```typescript
if (snapshot) {
  return {
    entity: snapshot,
    state: 'deleted',
    deletedAt: activity.metadata?.deletedAt || activity.created_at,
    deletedBy: activity.actor_id
  };
} else {
  // Deletion activity exists but no snapshot (pre-enrichment deletion)
  // Return minimal tombstone info for frontend to show "Entity was deleted" banner
  return {
    entity: {
      [`${getTableInfo(entityType).idColumn}`]: normalizedId,
      _tombstone: true,
      _note: 'Deletion occurred before snapshot enrichment was implemented'
    },
    state: 'deleted',
    deletedAt: activity.metadata?.deletedAt || activity.created_at,
    deletedBy: activity.actor_id
  };
}
```

**Frontend Behavior:**
- Can detect minimal tombstone via `entity._tombstone === true`
- Shows "Entity was deleted" banner with date/actor
- No detailed fields, but user understands why

**Example Response:**
```json
{
  "entity": {
    "order_id": "PO-123",
    "_tombstone": true,
    "_note": "Deletion occurred before snapshot enrichment was implemented"
  },
  "state": "deleted",
  "deletedAt": "2025-09-15T10:30:00Z",
  "deletedBy": "ADMIN"
}
```

---

## 2. Ecosystem Scope Uniformity ✅

**Issue:** Does ecosystem scope apply uniformly for active/archived and deleted fetches?

**Confirmation:** YES

**File:** `apps/backend/server/domains/entities/routes.fastify.ts:48-62`

```typescript
// SCOPE: Check ecosystem access
// Admin bypasses this check, other roles must have entity in their ecosystem
const hasAccess = await checkEntityAccess(
  account.role as any,
  account.cksCode,
  type,
  id
);

if (!hasAccess) {
  return reply.code(403).send({
    error: 'Forbidden',
    reason: 'Entity not in your ecosystem scope'
  });
}

try {
  const result = await getEntityWithFallback(type, id, includeDeleted);
  return result;
}
```

**Flow:**
1. Auth check (requireActiveRole)
2. Deleted-only gate (admin-only for includeDeleted=1)
3. **Ecosystem scope check** ← applies to ALL fetches (active/archived/deleted)
4. Entity fetch with fallback

**Result:** CRW-006 cannot fetch MGR-012's entities regardless of state (active/archived/deleted) unless in same ecosystem

---

## 3. Activity Categorization: `delivery_started` ✅

**Issue:** Confirm `delivery_started` is categorized correctly in frontend

**Backend:** `apps/backend/server/domains/orders/store.ts:2260`
```typescript
case "start-delivery":
  activityType = 'delivery_started';
  activityDescription = `Delivery started for ${orderType === 'product' ? 'product' : 'service'} order ${input.orderId}`;
  break;
```

**Frontend:** `apps/frontend/src/shared/activity/useFormattedActivities.ts:31-32`

**Before:**
```typescript
const ACTIVITY_TYPE_MAP: Record<string, Activity['type']> = {
  // ... no 'started' or 'delivery' mapping
};
```

**After:**
```typescript
const ACTIVITY_TYPE_MAP: Record<string, Activity['type']> = {
  // Success states
  delivered: 'success',
  completed: 'success',
  // ...
  // Action states
  assigned: 'action',
  created: 'action',
  started: 'action',  // delivery_started, service_started ← ADDED
  delivery: 'action', // ← ADDED
};
```

**Categorization Logic:**
```typescript
function toActivityType(category?: string | null): Activity['type'] {
  const normalized = category.toLowerCase().trim();

  // 1. Check exact match
  if (ACTIVITY_TYPE_MAP[normalized]) {
    return ACTIVITY_TYPE_MAP[normalized];
  }

  // 2. Check keyword inclusion (substring match)
  for (const [keyword, type] of Object.entries(ACTIVITY_TYPE_MAP)) {
    if (normalized.includes(keyword)) {
      return type;
    }
  }

  return 'info';
}
```

**Result:**
- `delivery_started` → matches `started` → `'action'`
- Shows as blue badge in activity feed
- Intended behavior ✅

---

## Index Script Note

**File:** `apps/backend/server/db/add-archive-indexes.ts`

**To Run:**
```bash
cd apps/backend
export DATABASE_URL=<your-database-url>  # or set in .env
pnpm tsx server/db/add-archive-indexes.ts
```

**Expected Output:**
```
[indexes] Starting archive index creation...
[indexes] Creating index on system_activity for deleted entity lookups...
[indexes] ✓ idx_activity_deleted_lookup created
[indexes] Creating index on managers.archived_at...
[indexes] ✓ idx_managers_archived_at created
[indexes] Creating partial indexes for active-only queries...
[indexes] ✓ idx_managers_active_only created
...
[indexes] ✅ All archive indexes created successfully
```

**Note:** Script is **idempotent** (safe to run multiple times)

---

## Summary

All three nits from ChatGPT review have been addressed:

1. ✅ **Older deletions:** Return minimal tombstone with `_tombstone: true` flag
2. ✅ **Ecosystem scope:** Applies uniformly to all entity states (active/archived/deleted)
3. ✅ **Activity categorization:** `delivery_started` maps to `'action'` (blue badge)

**Phase 1 is complete and ready for testing.**

---

## Next Steps (from ChatGPT)

### A) Test Now
1. Run index script (when DATABASE_URL is available)
2. Create new product + service orders → deliver/cancel/complete → verify activities
3. Archive + hard delete an order → GET `/api/entity/order/:id?includeDeleted=1`
   - As admin: returns deleted snapshot with items
   - As non-admin without scope: gets 403

### B) Phase 2: Retention + Multi-Tier
1. Cron: auto-archive N days after delivered/completed
2. Retention: purge snapshots >90 days

### C) Phase 3: Frontend
1. Activity click routing (`activityRouter.ts`)
2. DeletedBanner component
3. Wire up onClick handlers in hubs
