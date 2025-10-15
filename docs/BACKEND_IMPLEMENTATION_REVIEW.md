# Backend Implementation Review - Activity Routing System

## Context
Based on our previous discussion about implementing a modular tombstone solution for deleted entities, I've completed the backend implementation. This allows activities to link to active, archived, or deleted data with a unified endpoint.

**Previous recommendation from ChatGPT:**
- Store snapshots in deletion activity metadata (not a new table)
- Create unified entity fetch endpoint with server-side fallback
- Centralize the logic on the backend to keep frontend simple

---

## What Was Implemented

### 1. Updated `hardDeleteEntity()` to Store Snapshots

**File:** `apps/backend/server/domains/archive/store.ts` (lines 777-809)

**Changes:**
```typescript
// BEFORE deletion
export async function hardDeleteEntity(operation: ArchiveOperation & { confirm: boolean }) {
  // ... validation code ...

  // NEW: Capture entity snapshot BEFORE deleting
  const snapshotResult = await query(
    `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`,
    [normalizedId]
  );
  const snapshot = snapshotResult.rows[0] || null;

  // Perform hard delete
  await query(
    `DELETE FROM ${tableName} WHERE ${idColumn} = $1`,
    [normalizedId]
  );

  // Clean up relationships
  await query(
    `DELETE FROM archive_relationships
     WHERE entity_type = $1 AND entity_id = $2`,
    [operation.entityType, normalizedId]
  );

  // NEW: Record deletion activity with full snapshot in metadata
  await recordActivity(
    `${operation.entityType}_hard_deleted`,
    `Permanently deleted ${operation.entityType} ${normalizedId}`,
    normalizedId,
    operation.entityType,
    operation.actor,
    {
      reason: operation.reason,
      snapshot,  // ← Full entity data stored here
      deletedAt: new Date().toISOString()
    }
  );

  return {
    success: true,
    message: `${operation.entityType} ${normalizedId} has been permanently deleted`
  };
}
```

**Impact:**
- Deletion activities now contain full entity snapshot in `metadata.snapshot`
- No new database table needed
- Works for ALL entity types automatically

---

### 2. Created Entity Service with Fallback Logic

**New file:** `apps/backend/server/domains/entities/service.ts`

**Code:**
```typescript
import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';

type EntityState = 'active' | 'archived' | 'deleted';

export interface EntityResult {
  entity: any;
  state: EntityState;
  deletedAt?: string;
  deletedBy?: string;
}

/**
 * Fetch entity with smart fallback logic:
 * 1. Try active (not archived)
 * 2. Try archived
 * 3. If includeDeleted, check deletion activity for snapshot
 */
export async function getEntityWithFallback(
  entityType: string,
  entityId: string,
  includeDeleted: boolean
): Promise<EntityResult> {
  const normalizedId = normalizeIdentity(entityId);
  if (!normalizedId) {
    throw new Error('Invalid entity ID');
  }

  // Determine table and ID column based on entity type
  const { tableName, idColumn } = getTableInfo(entityType);

  // 1. Try live data (not archived)
  const liveResult = await query(
    `SELECT * FROM ${tableName} WHERE ${idColumn} = $1 AND archived_at IS NULL`,
    [normalizedId]
  );

  if (liveResult.rowCount && liveResult.rowCount > 0) {
    return {
      entity: liveResult.rows[0],
      state: 'active'
    };
  }

  // 2. Try archived data
  const archivedResult = await query(
    `SELECT * FROM ${tableName} WHERE ${idColumn} = $1 AND archived_at IS NOT NULL`,
    [normalizedId]
  );

  if (archivedResult.rowCount && archivedResult.rowCount > 0) {
    return {
      entity: archivedResult.rows[0],
      state: 'archived'
    };
  }

  // 3. If includeDeleted, check deletion activity for snapshot
  if (includeDeleted) {
    const deletionActivity = await query(
      `SELECT metadata, actor_id, created_at
       FROM system_activity
       WHERE target_id = $1
         AND target_type = $2
         AND activity_type = $3
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedId, entityType, `${entityType}_hard_deleted`]
    );

    if (deletionActivity.rowCount && deletionActivity.rowCount > 0) {
      const activity = deletionActivity.rows[0];
      const snapshot = activity.metadata?.snapshot;

      if (snapshot) {
        return {
          entity: snapshot,
          state: 'deleted',
          deletedAt: activity.metadata?.deletedAt || activity.created_at,
          deletedBy: activity.actor_id
        };
      }
    }
  }

  throw new Error('Entity not found');
}

/**
 * Map entity type to table name and ID column
 */
function getTableInfo(entityType: string): { tableName: string; idColumn: string } {
  switch (entityType) {
    case 'crew':
      return { tableName: 'crew', idColumn: 'crew_id' };
    case 'product':
      return { tableName: 'inventory_items', idColumn: 'item_id' };
    case 'warehouse':
      return { tableName: 'warehouses', idColumn: 'warehouse_id' };
    case 'service':
      return { tableName: 'services', idColumn: 'service_id' };
    case 'order':
      return { tableName: 'orders', idColumn: 'order_id' };
    case 'report':
      return { tableName: 'reports', idColumn: 'report_id' };
    case 'feedback':
      return { tableName: 'feedback', idColumn: 'feedback_id' };
    case 'manager':
      return { tableName: 'managers', idColumn: 'manager_id' };
    case 'contractor':
      return { tableName: 'contractors', idColumn: 'contractor_id' };
    case 'customer':
      return { tableName: 'customers', idColumn: 'customer_id' };
    case 'center':
      return { tableName: 'centers', idColumn: 'center_id' };
    default:
      // Fallback: assume plural table name and entity_id column
      return { tableName: `${entityType}s`, idColumn: `${entityType}_id` };
  }
}
```

**Impact:**
- Single function handles all entity types
- Centralizes fallback logic on server (not frontend)
- Returns state explicitly for frontend routing decisions

---

### 3. Created Entity Routes Endpoint

**New file:** `apps/backend/server/domains/entities/routes.fastify.ts`

**Code:**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { getEntityWithFallback } from './service';

const entityRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/entity/:type/:id?includeDeleted=1
   *
   * Fetch entity with smart fallback:
   * - Returns active entity if available
   * - Returns archived entity if not active
   * - Returns deleted entity snapshot if includeDeleted=1 and entity was hard deleted
   *
   * Response:
   * {
   *   entity: { ...entity data... },
   *   state: 'active' | 'archived' | 'deleted',
   *   deletedAt?: string,    // Only for deleted
   *   deletedBy?: string     // Only for deleted
   * }
   */
  fastify.get<{
    Params: { type: string; id: string };
    Querystring: { includeDeleted?: string };
  }>('/entity/:type/:id', async (request, reply) => {
    const { type, id } = request.params;
    const includeDeleted = request.query.includeDeleted === '1';

    try {
      const result = await getEntityWithFallback(type, id, includeDeleted);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Entity not found';
      reply.code(404).send({ error: message });
    }
  });
};

export default entityRoutes;
```

**Impact:**
- Single endpoint for all entity types
- Frontend just calls one URL format
- Query param controls whether to include deleted entities

---

### 4. Registered Routes in Server

**File:** `apps/backend/server/index.ts`

**Changes:**
```typescript
// Line 29: Added import
import entityRoutes from "./domains/entities/routes.fastify";

// Line 264: Registered route
await server.register(entityRoutes, { prefix: '/api' });
```

**Impact:**
- Endpoint available at `/api/entity/:type/:id`
- Follows same pattern as other domain routes

---

## How It Works (End-to-End Flow)

### Example 1: Active Order
```
Request: GET /api/entity/order/CRW-006-PO-105?includeDeleted=1

Backend logic:
1. Query orders table WHERE order_id = 'CRW-006-PO-105' AND archived_at IS NULL
2. Found → Return immediately

Response:
{
  "entity": {
    "order_id": "CRW-006-PO-105",
    "order_type": "product",
    "status": "pending",
    // ... all order fields ...
  },
  "state": "active"
}
```

### Example 2: Archived Order
```
Request: GET /api/entity/order/CEN-010-PO-106?includeDeleted=1

Backend logic:
1. Query WHERE archived_at IS NULL → Not found
2. Query WHERE archived_at IS NOT NULL → Found!

Response:
{
  "entity": {
    "order_id": "CEN-010-PO-106",
    "archived_at": "2025-10-14T21:30:00Z",
    // ... all order fields including archive timestamp ...
  },
  "state": "archived"
}
```

### Example 3: Deleted Order
```
Request: GET /api/entity/order/MGR-004-PO-999?includeDeleted=1

Backend logic:
1. Query WHERE archived_at IS NULL → Not found
2. Query WHERE archived_at IS NOT NULL → Not found
3. includeDeleted=true → Query system_activity for deletion event
4. Found activity with metadata.snapshot → Return snapshot

Response:
{
  "entity": {
    "order_id": "MGR-004-PO-999",
    "order_type": "service",
    // ... full snapshot of order before deletion ...
  },
  "state": "deleted",
  "deletedAt": "2025-10-14T22:00:00Z",
  "deletedBy": "ADMIN"
}
```

---

## Questions for Review

### 1. Is the implementation clean and following best practices?
- Using existing `system_activity` table instead of new table
- Snapshot stored in JSONB metadata field
- Single endpoint with query param for control

### 2. Are there any security concerns?
- Should we add auth checks before returning deleted data?
- Should certain user roles NOT see deleted data?
- Should PII be redacted from deleted user entity snapshots?

### 3. Performance considerations?
- We're doing 3 potential queries per request (active → archived → deleted)
- Should we optimize with a single UNION query instead?
- Is querying `system_activity` table for snapshots performant enough?

### 4. Edge cases we might have missed?
- What if snapshot is NULL (deletion happened before this feature)?
- What if activity type naming changes?
- What about very large entity snapshots (orders with 100+ items)?

### 5. Alternative approaches?
- Should we cache deleted entities for 24 hours in memory/Redis?
- Should we have a retention policy (purge snapshots older than 90 days)?
- Should we index `system_activity.target_id` for faster lookups?

### 6. TypeScript typing improvements?
- Should `entity` have a generic type instead of `any`?
- Should we create specific interfaces for each entity type?

### 7. Testing strategy?
- Unit tests for `getEntityWithFallback()`?
- Integration tests for the endpoint?
- Test coverage for all entity types?

---

## What's Next (Not Yet Implemented)

### Frontend Implementation (~6 hours)
1. Create `DeletedBanner` component
2. Create activity router with navigation logic
3. Update `ActivityItem` to accept `onClick`
4. Wire up all hubs (CrewHub, ManagerHub, etc.)
5. Update modals to show deleted banner

### Potential Improvements
1. Add retention policy cron job (purge old snapshots after 90 days)
2. Add PII redaction for user entity snapshots (GDPR compliance)
3. Add database index on `system_activity(target_id, activity_type)` for performance
4. Add comprehensive test suite

---

## Request for Feedback

Please review this backend implementation and provide:

1. **Code quality assessment** - Is this clean, maintainable TypeScript/Node.js code?
2. **Architecture validation** - Is storing snapshots in activity metadata the right choice?
3. **Performance concerns** - Will this scale? Should we optimize the query pattern?
4. **Security review** - Any auth/access control issues?
5. **Edge cases** - What scenarios could break this?
6. **Suggestions** - Any improvements or alternative approaches?

Thank you!
