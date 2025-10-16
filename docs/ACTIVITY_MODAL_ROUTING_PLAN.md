# Activity Feed Modal Routing - Implementation Plan

## Problem Statement

Activity feed currently opens Order Details Modal directly, which:
1. Doesn't match Directory UX (which uses Action Modal first)
2. Missing product items data (incomplete order structure)
3. No action buttons (dead-end UX)

## Correct UX Flow

### From Directory (Current - Working)
```
Click "View" → ActionModal opens with buttons:
  - View Details → OrderDetailsModal (full data with items)
  - Edit Order
  - Cancel Order
  - Delete Order
```

### From Activity Feed (Target - Fix This)
**Three different flows based on order state:**

#### 1. Active Orders (state === 'active')
```
Click Activity → ActionModal opens with buttons:
  - View Details → OrderDetailsModal
  - Edit Order
  - Cancel Order
  - Delete Order
```

#### 2. Archived Orders (state === 'archived')
```
Click Activity → ActionModal opens with buttons:
  - 📄 View Order Details → OrderDetailsModal
  - ✓ Restore to Unassigned
  - 🔗 View Relationships
  - ⚠️ Permanently Delete
```

#### 3. Deleted Orders (state === 'deleted')
```
Click Activity → OrderDetailsModal with DeletedBanner
  (No actions available - read-only)
```

---

## Technical Implementation

### Current Architecture

**ActivityFeed Component (Updated 2025‑10‑16)**:\n- Fetches order via canonical GET /api/order/{id}/details (single DTO used by modals and feed)\n- Derives state client‑side for routing (rchived if rchivedAt exists; otherwise ctive).\n- Legacy /entity/order/{id}?includeDeleted=1 is used only as a 404 fallback to show deleted banners until canonical covers deleted.\n- Calls onOpenOrderActions for active/archived; onOpenOrderModal only for deleted (read‑only).\n\n**AdminHub**:
- Receives: `orderData` via `setSelectedOrderForDetails`
- Opens: OrderDetailsModal ❌
- Result: No action buttons, incomplete data

---

### New Architecture

**ActivityFeed Component (Updated 2025‑10‑16)**:\n- Fetches order via canonical GET /api/order/{id}/details (single DTO used by modals and feed)\n- Derives state client‑side for routing (rchived if rchivedAt exists; otherwise ctive).\n- Legacy /entity/order/{id}?includeDeleted=1 is used only as a 404 fallback to show deleted banners until canonical covers deleted.\n- Calls onOpenOrderActions for active/archived; onOpenOrderModal only for deleted (read‑only).\n\n**AdminHub**:
- Receives active/archived orders via new callback
- Sets proper data structure for ActionModal
- Opens ActionModal with context-appropriate actions

---

## Data Structure Requirements

### For ActionModal (Active/Archived Orders)

```typescript
selectedEntity = {
  // Row-level data (for table display)
  orderId: "CRW-006-PO-107",
  status: "pending-warehouse",
  requestedBy: "CRW-006",
  destination: "CEN-010",

  // Full order data (for modals)
  _fullOrder: {
    id: "CRW-006-PO-107",
    orderId: "CRW-006-PO-107",
    orderType: "product",
    status: "pending-warehouse",
    items: [
      { productCode: "P001", quantity: 10, ... }
    ],
    // ... all other order fields
  },

  // State flags
  isArchived: false,  // true for archived orders
  archivedAt: null,   // timestamp for archived
  archivedBy: null,   // admin ID who archived
}
```

### For OrderDetailsModal (Deleted Orders)

```typescript
orderData = {
  ...entity,
  isDeleted: true,
  deletedAt: "2025-10-14T...",
  deletedBy: "ADMIN"
}
```

---

## Implementation Steps

### Step 1: Update ActivityFeed Component

**Add new prop**:
```typescript
export interface ActivityFeedProps {
  // ... existing props
  onOpenOrderActions?: (data: { entity: any; state: string }) => void;
  onOpenOrderModal?: (order: any) => void;  // Keep for deleted orders
}
```

**Update click handler**:
```typescript
// Fetch order
const result = await fetchOrderForActivity(targetId);
const { entity, state, deletedAt, deletedBy } = result;

if (state === 'deleted') {
  // Deleted: Open details modal with banner
  onOpenOrderModal?.({
    ...entity,
    isDeleted: true,
    deletedAt,
    deletedBy
  });
} else {
  // Active or Archived: Open action modal
  onOpenOrderActions?.({
    entity,
    state,
    deletedAt,  // for archived orders
    deletedBy   // for archived orders
  });
}
```

---

### Step 2: Update AdminHub

**Add new callback handler**:
```typescript
const handleOrderActions = useCallback((data: { entity: any; state: string; deletedAt?: string; deletedBy?: string }) => {
  const { entity, state, deletedAt, deletedBy } = data;

  // Prepare entity for ActionModal
  setSelectedEntity({
    orderId: entity.orderId || entity.id,
    status: entity.status,
    orderType: entity.orderType || entity.order_type,
    // ... other row fields

    _fullOrder: entity,  // Complete order data

    // State flags
    isArchived: state === 'archived',
    archivedAt: deletedAt,
    archivedBy: deletedBy,
  });

  // Open ActionModal
  setShowActionModal(true);
}, []);
```

**Pass to ActivityFeed**:
```tsx
<ActivityFeed
  activities={activityFeed}
  hub="admin"
  onOpenOrderActions={handleOrderActions}  // NEW
  onOpenOrderModal={setSelectedOrderForDetails}  // For deleted only
  onError={...}
/>
```

---

### Step 3: Extend ActionModal Logic in AdminHub

**Current ActionModal actions** (lines 1455-1526):
- Checks `directoryTab === 'orders'`
- Shows: View Details, Edit Order, Cancel Order, Delete Order

**Add archived order check**:
```typescript
if (directoryTab === 'orders') {
  const row = selectedEntity as any;
  const isArchived = row?.isArchived === true;

  if (isArchived) {
    // ARCHIVED ORDER ACTIONS
    return [
      {
        label: '📄 View Order Details',
        variant: 'primary',
        onClick: () => {
          setSelectedOrderForDetails(row._fullOrder);
          handleModalClose();
        }
      },
      {
        label: '✓ Restore to Unassigned',
        variant: 'success',
        onClick: async () => {
          // Call archiveAPI.restoreEntity(...)
          await archiveAPI.restoreEntity('order', row.orderId);
          // Refresh data
          mutate('/admin/directory/activities');
          handleModalClose();
        }
      },
      {
        label: '🔗 View Relationships',
        variant: 'secondary',
        onClick: async () => {
          // Call archiveAPI.getRelationships(...)
          const relationships = await archiveAPI.getRelationships('order', row.orderId);
          alert(JSON.stringify(relationships, null, 2));  // TODO: Better UI
        }
      },
      {
        label: '⚠️ Permanently Delete',
        variant: 'danger',
        onClick: async () => {
          if (!confirm('Permanently delete this order? Cannot be undone!')) return;
          await archiveAPI.hardDelete('order', row.orderId);
          mutate('/admin/directory/activities');
          handleModalClose();
        }
      }
    ];
  }

  // ACTIVE ORDER ACTIONS (existing code)
  const status = (row?.status || '').toString().trim().toLowerCase();
  // ... existing View Details, Edit, Cancel, Delete logic
}
```

---

## Success Criteria

### Test Case 1: Active Order from Activity Feed
1. Click "Product order CRW-006-PO-107 created" in activity feed
2. **Expected**: Order Actions Modal opens
3. **Buttons shown**: View Details, Edit Order, Cancel Order, Delete Order
4. Click "View Details"
5. **Expected**: Order Details Modal opens with **complete data** (including product items table)

### Test Case 2: Archived Order from Activity Feed
1. Click "Archived order CEN-010-PO-106" in activity feed
2. **Expected**: Order Actions Modal opens
3. **Buttons shown**: View Order Details, Restore to Unassigned, View Relationships, Permanently Delete
4. **Info shown**: Archived by: ADMIN, Archived on: Oct 15, 2025, Reason: Manual archive, Scheduled deletion: Nov 13, 2025
5. Click "View Order Details"
6. **Expected**: Order Details Modal opens with full data

### Test Case 3: Deleted Order from Activity Feed
1. Click "Permanently deleted order CRW-006-PO-100" in activity feed
2. **Expected**: Order Details Modal opens immediately (no action modal)
3. **Banner shown**: Red "DeletedBanner" with deletion info
4. **Modal is**: Read-only (no edit buttons)

### Test Case 4: Consistency with Directory
1. Open same order from Directory tab
2. Open same order from Activity feed
3. **Expected**: Identical UX flow and data display

---

## Dependencies

1. **archiveAPI** must be accessible at AdminHub level
   - Currently passed to `<ArchiveSection archiveAPI={archiveAPI} />`
   - Need to use it in ActionModal actions for archived orders

2. **fetchAdminOrderById** may be needed
   - If `entity` from `/entity/order/{id}` doesn't include items
   - Fallback to fetch full order with items

3. **Mutations** for data refresh
   - `mutate('/admin/directory/activities')` after restore/delete
   - `mutate('/admin/directory/orders')` after any order action

---

## Edge Cases

1. **Archived order that's also deleted** (shouldn't exist, but handle gracefully)
   - Treat as deleted (show banner, read-only)

2. **Permission denied (403)** when fetching order
   - Already handled by `parseActivityError`
   - Shows: "You do not have permission to view this entity"

3. **Order not found (404)**
   - Shows: "Entity not found"

4. **Missing `items` in order data**
   - Fetch full order using `fetchAdminOrderById(orderId)`
   - Cache result to avoid double-fetch

---

## Code Changes Summary

| File | Changes |
|------|---------|
| `ActivityFeed.tsx` | Add `onOpenOrderActions` prop, route by state |
| `AdminHub.tsx` | Add `handleOrderActions` callback, extend ActionModal logic |
| `activityHelpers.ts` | No changes needed (already returns state) |

**Total Lines**: ~100 lines added, ~5 lines modified

---

## Rollback Plan

If issues arise:
1. Remove `onOpenOrderActions` prop
2. Keep `onOpenOrderModal` for all states
3. Revert AdminHub ActionModal changes
4. Falls back to current behavior (details modal for all)

**Risk**: Low - Changes are additive and isolated

---

## Post-MVP Improvements

1. **Better Relationships UI**: Replace `alert()` with proper modal showing relationships
2. **Restore confirmation**: Add modal asking where to restore (which workflow stage)
3. **Deletion reason**: Prompt for reason when hard-deleting
4. **Undo/Toast notifications**: Show success toasts with undo option
5. **Optimistic updates**: Update UI immediately, rollback on error

---

**Status**: Ready to implement
**Estimated Time**: ~45 minutes
**Risk Level**: Low

