# Simplified Tombstone Implementation Plan
**Based on ChatGPT Review Feedback**

## Overview
Implement a **centralized, server-side fallback** for entity fetching that handles active/archived/deleted states uniformly. No new tables, minimal frontend changes.

---

## Implementation Steps

### Step 1: Update Hard Delete to Store Snapshot in Activity (Backend)

**File:** `apps/backend/server/domains/archive/store.ts`

**Current code (line ~790):**
```typescript
await recordActivity(
  `${operation.entityType}_hard_deleted`,
  `Permanently deleted ${operation.entityType} ${normalizedId}`,
  normalizedId,
  operation.entityType,
  operation.actor,
  { reason: operation.reason }  // ← Only reason, not enough!
);
```

**Updated code:**
```typescript
// BEFORE delete, capture full entity snapshot
const snapshot = await query(
  `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`,
  [normalizedId]
);

// Delete the entity
await query(`DELETE FROM ${tableName} WHERE ${idColumn} = $1`, [normalizedId]);

// Clean up relationships
await query(
  `DELETE FROM archive_relationships
   WHERE entity_type = $1 AND entity_id = $2`,
  [operation.entityType, normalizedId]
);

// Record deletion with full snapshot in metadata
await recordActivity(
  `${operation.entityType}_hard_deleted`,
  `Permanently deleted ${operation.entityType} ${normalizedId}`,
  normalizedId,
  operation.entityType,
  operation.actor,
  {
    reason: operation.reason,
    snapshot: snapshot.rows[0],  // ← Full entity data
    deletedAt: new Date().toISOString()
  }
);
```

---

### Step 2: Create Unified Entity Fetch Endpoint (Backend)

**New file:** `apps/backend/server/domains/entities/routes.fastify.ts`

```typescript
import { FastifyPluginAsync } from 'fastify';
import { getEntityWithFallback } from './service';

const entityRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/entity/:type/:id?includeDeleted=1
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
      reply.code(404).send({ error: 'Entity not found' });
    }
  });
};

export default entityRoutes;
```

**New file:** `apps/backend/server/domains/entities/service.ts`

```typescript
import { query } from '../db';
import { normalizeCodeValue } from '../shared/utils';

type EntityState = 'active' | 'archived' | 'deleted';

interface EntityResult {
  entity: any;
  state: EntityState;
  deletedAt?: string;
  deletedBy?: string;
}

export async function getEntityWithFallback(
  entityType: string,
  entityId: string,
  includeDeleted: boolean
): Promise<EntityResult> {
  const normalizedId = normalizeCodeValue(entityId);
  if (!normalizedId) throw new Error('Invalid entity ID');

  // Determine table and ID column
  let tableName: string;
  let idColumn: string;

  if (entityType === 'crew') {
    tableName = 'crew';
    idColumn = 'crew_id';
  } else if (entityType === 'product') {
    tableName = 'inventory_items';
    idColumn = 'item_id';
  } else if (entityType === 'warehouse') {
    tableName = 'warehouses';
    idColumn = 'warehouse_id';
  } else if (entityType === 'service') {
    tableName = 'services';
    idColumn = 'service_id';
  } else if (entityType === 'order') {
    tableName = 'orders';
    idColumn = 'order_id';
  } else if (entityType === 'report') {
    tableName = 'reports';
    idColumn = 'report_id';
  } else if (entityType === 'feedback') {
    tableName = 'feedback';
    idColumn = 'feedback_id';
  } else {
    tableName = `${entityType}s`;
    idColumn = `${entityType}_id`;
  }

  // 1. Try live data (not archived)
  const liveResult = await query(
    `SELECT * FROM ${tableName} WHERE ${idColumn} = $1 AND archived_at IS NULL`,
    [normalizedId]
  );

  if (liveResult.rowCount > 0) {
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

  if (archivedResult.rowCount > 0) {
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

    if (deletionActivity.rowCount > 0) {
      const activity = deletionActivity.rows[0];
      const snapshot = activity.metadata?.snapshot;

      if (snapshot) {
        return {
          entity: snapshot,
          state: 'deleted',
          deletedAt: activity.created_at,
          deletedBy: activity.actor_id
        };
      }
    }
  }

  throw new Error('Entity not found');
}
```

---

### Step 3: Add DeletedBanner Component (Frontend)

**New file:** `packages/domain-widgets/src/common/DeletedBanner.tsx`

```typescript
import React from 'react';

interface DeletedBannerProps {
  deletedAt: string;
  deletedBy: string;
}

export function DeletedBanner({ deletedAt, deletedBy }: DeletedBannerProps) {
  const formattedDate = new Date(deletedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div
      style={{
        backgroundColor: '#fee2e2',
        border: '1px solid #ef4444',
        borderRadius: 6,
        padding: 12,
        marginBottom: 16,
        color: '#991b1b',
        fontSize: 14,
        fontWeight: 500
      }}
    >
      ⚠️ This data was permanently deleted by {deletedBy} on {formattedDate}
    </div>
  );
}
```

**Update:** `packages/domain-widgets/src/index.ts`
```typescript
export { DeletedBanner } from './common/DeletedBanner';
```

---

### Step 4: Create Centralized Activity Click Handler (Frontend)

**New file:** `apps/frontend/src/shared/utils/activityRouter.ts`

```typescript
interface ActivityClickPayload {
  targetId: string;
  targetType: string;
}

interface EntityWithState {
  entity: any;
  state: 'active' | 'archived' | 'deleted';
  deletedAt?: string;
  deletedBy?: string;
}

export async function fetchEntityForActivity(
  targetType: string,
  targetId: string
): Promise<EntityWithState> {
  const response = await fetch(
    `/api/entity/${targetType}/${targetId}?includeDeleted=1`
  );

  if (!response.ok) {
    throw new Error('Entity not found');
  }

  return response.json();
}

export function createActivityClickHandler(
  onOpenOrder: (order: any, state: EntityWithState) => void,
  onOpenService: (service: any, state: EntityWithState) => void,
  onOpenUser: (user: any, state: EntityWithState) => void,
  // Add other entity type handlers as needed
  onError: (message: string) => void
) {
  return async (activity: { metadata: { targetId?: string; targetType?: string } }) => {
    const { targetId, targetType } = activity.metadata;

    if (!targetId || !targetType) {
      onError('Cannot open: missing target information');
      return;
    }

    try {
      const result = await fetchEntityForActivity(targetType, targetId);

      // Route to appropriate modal based on type
      switch (targetType) {
        case 'order':
          onOpenOrder(result.entity, result);
          break;
        case 'service':
          onOpenService(result.entity, result);
          break;
        case 'manager':
        case 'contractor':
        case 'customer':
        case 'center':
        case 'crew':
        case 'warehouse':
          onOpenUser(result.entity, result);
          break;
        default:
          onError(`Unknown entity type: ${targetType}`);
      }
    } catch (error) {
      onError('Could not load data');
    }
  };
}
```

---

### Step 5: Update Hubs to Use Centralized Handler (Frontend)

**Example:** `apps/frontend/src/hubs/CrewHub.tsx`

```typescript
import { createActivityClickHandler } from '../shared/utils/activityRouter';
import { DeletedBanner } from '@cks/domain-widgets';

// Inside CrewHub component:

// Add state for entity modal with deletion info
const [selectedOrderState, setSelectedOrderState] = useState<{
  order: any;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
} | null>(null);

// Create activity click handler
const handleActivityClick = createActivityClickHandler(
  // onOpenOrder
  (order, state) => {
    setSelectedOrderState({
      order,
      isDeleted: state.state === 'deleted',
      deletedAt: state.deletedAt,
      deletedBy: state.deletedBy
    });
  },
  // onOpenService
  (service, state) => { /* ... */ },
  // onOpenUser
  (user, state) => { /* ... */ },
  // onError
  (message) => toast.error(message)
);

// Pass to RecentActivity
<RecentActivity
  activities={formattedActivities.map(a => ({
    ...a,
    onClick: () => handleActivityClick(a)
  }))}
  // ... other props
/>

// Update modal to show banner
{selectedOrderState && (
  <OrderDetailsModal
    order={selectedOrderState.order}
    onClose={() => setSelectedOrderState(null)}
  >
    {selectedOrderState.isDeleted && (
      <DeletedBanner
        deletedAt={selectedOrderState.deletedAt!}
        deletedBy={selectedOrderState.deletedBy!}
      />
    )}
  </OrderDetailsModal>
)}
```

---

### Step 6: Make ActivityItem Accept onClick (Frontend)

**File:** `packages/domain-widgets/src/activity/RecentActivity/ActivityItem.tsx`

```typescript
interface ActivityItemProps {
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'action';
  role?: string;
  title?: string;
  onClick?: () => void;  // NEW
}

export function ActivityItem({
  message,
  timestamp,
  type = 'info',
  role = 'default',
  title,
  onClick  // NEW
}: ActivityItemProps) {
  // ...

  return (
    <div
      style={{
        // ... existing styles ...
        cursor: onClick ? 'pointer' : 'default',  // NEW
      }}
      onClick={onClick}  // NEW
      // ... rest
    >
```

---

### Step 7: Update RecentActivity to Pass onClick

**File:** `packages/domain-widgets/src/activity/RecentActivity/RecentActivity.tsx`

```typescript
export interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'action';
  metadata?: {
    role?: string;
    title?: string;
    targetId?: string;     // NEW
    targetType?: string;   // NEW
    [key: string]: any;
  };
  onClick?: () => void;    // NEW
}

// In render:
activities.map((activity) => (
  <ActivityItem
    key={activity.id}
    message={activity.message}
    timestamp={activity.timestamp}
    type={activity.type}
    role={activity.metadata?.role}
    title={activity.metadata?.title}
    onClick={activity.onClick}  // NEW
  />
))
```

---

## Implementation Order

1. ✅ **Backend: Update `hardDeleteEntity()`** to store snapshot in deletion activity
2. ✅ **Backend: Create unified `/api/entity/:type/:id`** endpoint with fallback logic
3. ✅ **Frontend: Create `DeletedBanner`** component
4. ✅ **Frontend: Create `activityRouter.ts`** with centralized click handler
5. ✅ **Frontend: Update `ActivityItem`** to accept `onClick`
6. ✅ **Frontend: Update `RecentActivity`** to pass `onClick` through
7. ✅ **Frontend: Update all Hubs** to use centralized handler (CrewHub, CenterHub, ManagerHub, etc.)
8. ✅ **Frontend: Update all modals** to conditionally show `DeletedBanner`

---

## Testing Checklist

- [ ] Create product order → Archive → Wait/force hard delete → Click activity → See tombstone with banner
- [ ] Create service order → Archive → Hard delete → Click activity → See tombstone
- [ ] Archive order → Click activity → Opens from Archive section (greyed)
- [ ] Active order → Click activity → Opens normal modal
- [ ] Test with all entity types (orders, services, users)
- [ ] Verify no console errors
- [ ] Verify modal shows correct data even when deleted

---

## Retention Policy (To Implement Later)

```sql
-- Cron job or scheduled function to purge old tombstone snapshots (90 days)
DELETE FROM system_activity
WHERE activity_type LIKE '%_hard_deleted'
  AND created_at < NOW() - INTERVAL '90 days';
```

---

## Privacy/GDPR Note

For user entities (managers, contractors, customers), consider redacting PII from snapshot:
```typescript
if (entityType === 'manager' || entityType === 'contractor' || entityType === 'customer') {
  snapshot = {
    ...snapshot,
    email: '[REDACTED]',
    phone: '[REDACTED]',
    address: '[REDACTED]',
    // Keep only: id, name, role, key relationships
  };
}
```

---

## Estimated Effort
- Backend: ~2 hours
- Frontend: ~3 hours
- Testing: ~1 hour
- **Total: ~6 hours**
