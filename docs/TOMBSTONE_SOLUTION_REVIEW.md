# Tombstone Solution Review - Request for Third Opinion

## Context
We're building an enterprise management system with activity feeds showing recent actions. Users can archive and hard-delete various entities (orders, services, users, etc.). We need a solution for when users click on activities for deleted entities.

---

## Current State

### What Works
- ✅ Archive flow: Entities can be archived → show greyed out in Archive section → auto-delete after 30 days
- ✅ Entity types: Orders, Services, Crew, Warehouses, Products, Reports, Feedback, Users (Managers, Contractors, Customers, Centers)
- ✅ View modals: All entity types have existing detail view modals
- ✅ Activity recording: System records activities like "Product order CRW-006-PO-105 created" with metadata

### What Doesn't Work
- ❌ Activities NOT clickable yet (no onClick handlers)
- ❌ When entity is hard-deleted, activity still shows in feed but clicking would result in 404
- ❌ No tombstone storage - deleted entities disappear completely from database

### Current Activity Metadata (Example)
```json
{
  "orderId": "CRW-006-PO-105",
  "orderType": "product",
  "customerId": "CUS-015",
  "centerId": "CEN-010",
  "contractorId": "CON-010",
  "managerId": "MGR-012",
  "crewId": "CRW-006",
  "warehouseId": "WHS-004"
}
```

**Problem:** Not enough to show full order details modal (missing product items, requestor info, destination info, dates, etc.)

---

## Requirements

### Must-Haves
1. **Activities must be clickable** - When user clicks activity, show relevant data
2. **Modular solution** - Must work for ALL entity types (orders, services, users, etc.)
3. **Reuse existing modals** - Don't create new view components, use existing OrderDetailsModal, ServiceDetailsModal, etc.
4. **Handle 3 states:**
   - **Active data**: Click → Opens live modal / navigates to section
   - **Archived data**: Click → Opens modal from Archive section
   - **Deleted data**: Click → Opens modal with cached data + banner saying "This data was permanently deleted"

### Constraints
- Only Admin can archive/delete
- Archived entities auto-delete after 30 days (configurable)
- Solution must be simple and maintainable
- No dead links - every activity must be actionable

---

## Proposed Solution

### Backend Changes

**1. Create `deleted_entities` table**
```sql
CREATE TABLE deleted_entities (
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  deleted_at TIMESTAMP DEFAULT NOW(),
  deleted_by TEXT,
  snapshot JSONB NOT NULL,  -- Full entity data
  PRIMARY KEY (entity_id, entity_type)
);
```

**2. Update `hardDeleteEntity()` function** (apps/backend/server/domains/archive/store.ts:721)
```typescript
export async function hardDeleteEntity(operation: ArchiveOperation & { confirm: boolean }) {
  // ... existing validation ...

  // NEW: Store snapshot BEFORE deleting
  const snapshot = await query(
    `SELECT * FROM ${tableName} WHERE ${idColumn} = $1`,
    [normalizedId]
  );

  await query(
    `INSERT INTO deleted_entities (entity_id, entity_type, deleted_by, snapshot)
     VALUES ($1, $2, $3, $4)`,
    [normalizedId, operation.entityType, operation.actor, JSON.stringify(snapshot.rows[0])]
  );

  // THEN: Delete as normal
  await query(`DELETE FROM ${tableName} WHERE ${idColumn} = $1`, [normalizedId]);

  // ... rest of existing code ...
}
```

**3. Add tombstone fetch endpoint**
```typescript
// GET /api/deleted-entities/:entityType/:entityId
export async function getDeletedEntity(entityType: string, entityId: string) {
  const result = await query(
    `SELECT * FROM deleted_entities
     WHERE entity_id = $1 AND entity_type = $2`,
    [entityId, entityType]
  );

  if (result.rowCount === 0) return null;

  return {
    ...result.rows[0],
    snapshot: result.rows[0].snapshot  // Already parsed JSONB
  };
}
```

### Frontend Changes

**1. Make ActivityItem clickable**
```typescript
// packages/domain-widgets/src/activity/RecentActivity/ActivityItem.tsx
interface ActivityItemProps {
  // ... existing props ...
  onClick?: () => void;  // NEW
}

// Update render
<div
  style={{ cursor: onClick ? 'pointer' : 'default' }}
  onClick={onClick}
>
```

**2. Create universal entity fetcher**
```typescript
// apps/frontend/src/shared/hooks/useEntityFetch.ts
export async function fetchEntityOrTombstone(
  entityType: string,
  entityId: string
) {
  // Try live data first
  try {
    const entity = await fetchEntity(entityType, entityId);
    return { entity, isDeleted: false };
  } catch (error) {
    // If 404, check tombstone
    const tombstone = await fetch(`/api/deleted-entities/${entityType}/${entityId}`);
    if (tombstone.ok) {
      const data = await tombstone.json();
      return {
        entity: data.snapshot,
        isDeleted: true,
        deletedAt: data.deleted_at,
        deletedBy: data.deleted_by
      };
    }
    throw new Error('Entity not found');
  }
}
```

**3. Wire up in all Hubs**
```typescript
// apps/frontend/src/hubs/CrewHub.tsx (example - repeat for all hubs)
const handleActivityClick = async (activity: Activity) => {
  const { targetId, targetType } = activity.metadata;

  try {
    const { entity, isDeleted, deletedAt, deletedBy } =
      await fetchEntityOrTombstone(targetType, targetId);

    // Open existing modal with deletion flag
    if (targetType === 'order') {
      setSelectedOrder({ ...entity, isDeleted, deletedAt, deletedBy });
    } else if (targetType === 'service') {
      setSelectedService({ ...entity, isDeleted, deletedAt, deletedBy });
    }
    // ... handle other types ...
  } catch {
    toast.error('Data not found');
  }
};

// Pass to activities
<RecentActivity
  activities={formattedActivities.map(a => ({
    ...a,
    onClick: () => handleActivityClick(a)
  }))}
/>
```

**4. Add DeletedBanner component**
```typescript
// packages/domain-widgets/src/common/DeletedBanner.tsx
export function DeletedBanner({ deletedAt, deletedBy }) {
  return (
    <div style={{
      backgroundColor: '#fee2e2',
      border: '1px solid #ef4444',
      borderRadius: 6,
      padding: 12,
      marginBottom: 16,
      color: '#991b1b'
    }}>
      ⚠️ This data was permanently deleted by {deletedBy} on {
        new Date(deletedAt).toLocaleDateString()
      }
    </div>
  );
}
```

**5. Update existing modals** (minimal changes)
```typescript
// Example: OrderDetailsModal
function OrderDetailsModal({ order }) {
  return (
    <Modal>
      {order.isDeleted && (
        <DeletedBanner deletedAt={order.deletedAt} deletedBy={order.deletedBy} />
      )}

      {/* Existing modal content unchanged */}
      <h2>Order Details</h2>
      {/* ... */}
    </Modal>
  );
}
```

---

## Questions for Review

1. **Is this the simplest modular solution?** Are we over-engineering?

2. **Alternative: Enrich activity metadata on delete?**
   - Instead of separate table, update all related activities to include full entity snapshot in metadata when deleting
   - Pros: No new table, data in one place
   - Cons: Bloats activity table, complex update logic

3. **Alternative: No tombstone, just show message?**
   - Click deleted activity → Simple modal: "This order was deleted on X by Y"
   - No details shown
   - Pros: Extremely simple
   - Cons: Less useful for users

4. **Retention policy:** How long to keep deleted snapshots?
   - Forever (audit trail)?
   - 90 days then purge?
   - Same as archive period (30 days)?

5. **Privacy concerns:** Should deleted user data (managers, contractors) be purged immediately for GDPR/privacy compliance?

6. **Is there a simpler approach we're missing?**

---

## Success Criteria
After implementation, this should work:
- User clicks "Product order created" activity → Shows order modal (active, archived, or deleted)
- User clicks "Service assigned" activity → Shows service modal (active, archived, or deleted)
- User clicks "Manager created" activity → Shows manager profile modal (active, archived, or deleted)
- ALL entity types work with same pattern
- No 404 errors
- Clear visual indication when viewing deleted data

---

## Request
Please review this solution and provide:
1. Simpler alternatives if any exist
2. Potential issues we haven't considered
3. Best practices for tombstone/audit trail patterns
4. Recommendation on retention policy
5. Your assessment of complexity vs. value

Thank you!
