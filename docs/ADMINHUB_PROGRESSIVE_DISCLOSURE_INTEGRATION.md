# AdminHub Integration: Progressive Disclosure Pattern

## Overview

AdminHub will use the **same progressive disclosure pattern** as all other hubs, but with admin-specific actions. The key difference is that admin actions (Edit, Archive, Delete, Restore, etc.) are shown at the top instead of user actions (Accept, Decline).

---

## Current AdminHub Flow (Double-Modal)

```
User clicks activity in ActivityFeed
  ↓
handleActivityClick(activity) called
  ↓
setSelectedEntity(activity.entity)
setShowActionModal(true)
  ↓
ActionModal opens → Shows list of action buttons
  ├── Edit Order
  ├── Archive Order
  ├── Delete Order
  ├── View Details  ← User clicks this
  └── Cancel
  ↓
onViewDetails() callback fires
  ↓
setSelectedOrderId(orderId)
  ↓
OrderDetailsGateway opens (SECOND MODAL)
  ├── Shows ProductOrderModal OR ServiceOrderModal
  └── Full order details displayed
  ↓
User wants to edit/archive → Must close modal and click activity again
```

**Problem**: Same as other hubs - requires modal switching to see details and take actions.

---

## New AdminHub Flow (Progressive Disclosure)

```
User clicks activity in ActivityFeed
  ↓
handleActivityClick(activity) called
  ↓
setSelectedOrderId(activity.entityId)
  ↓
ActivityModal opens → Shows OrderCard + admin action buttons (compact)
  ├── OrderCard (order summary)
  └── Admin Actions:
      ├── [Edit Order]
      ├── [Archive Order]
      ├── [Delete Order]
      └── [▼ View Details]  ← User clicks this
  ↓
setExpanded(true)
  ↓
Modal expands IN PLACE to show full details
  ├── OrderCard (still visible at top)
  ├── Admin Actions (sticky header, always visible)
  └── Detail Sections:
      ├── Archived Banner (if archived)
      ├── Deleted Banner (if deleted)
      ├── Requestor Information
      ├── Delivery Information
      ├── Product Items
      ├── Special Instructions
      └── Cancellation/Rejection Info
  ↓
User can now Edit/Archive/Delete while viewing full details
NO MODAL SWITCHING NEEDED ✅
```

---

## Admin Actions vs User Actions

### User Actions (CrewHub, CenterHub, etc.)
```tsx
[Accept Order]  [Decline Order]  [Cancel]  [View Details]
```
**Purpose**: Workflow actions (approve, reject, cancel)

### Admin Actions (AdminHub)
```tsx
[Edit Order]  [Archive Order]  [Restore Order]  [Delete Order]  [View Details]
```
**Purpose**: Administrative actions (manage, archive, delete)

**Both follow the same progressive disclosure pattern!**

---

## AdminHub ActivityModal Structure

### Compact Mode (Initial State)

```
┌─────────────────────────────────────────────────┐
│ Product Order #CEN-010-PO-106         [Admin] [X]│
├─────────────────────────────────────────────────┤
│                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ PRODUCT ORDER                             ┃  │
│  ┃ ─────────────                             ┃  │
│  ┃ Order ID: CEN-010-PO-106                  ┃  │
│  ┃ Product: 10x Cement Bags                  ┃  │
│  ┃ Requestor: CUS-001 - Customer One         ┃  │
│  ┃ Destination: WH-A - Warehouse Alpha       ┃  │
│  ┃ Status: 🟡 Pending Approval               ┃  │
│  ┃ Requested: Jan 15, 2025                   ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                 │
│  ┌────────────────────────────────────────────┐│
│  │ ADMIN ACTIONS                              ││
│  ├────────────────────────────────────────────┤│
│  │ [✏️ Edit Order]        [🗄️ Archive Order]  ││
│  │ [🗑️ Delete Order]       [▼ View Details]   ││
│  └────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Expanded Mode (After Clicking "View Details")

```
┌─────────────────────────────────────────────────┐
│ Product Order #CEN-010-PO-106         [Admin] [X]│
├─────────────────────────────────────────────────┤
│                                                 │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ PRODUCT ORDER                             ┃  │
│  ┃ Order ID: CEN-010-PO-106                  ┃  │
│  ┃ Status: 🟡 Pending Approval               ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                 │
├═════════════════════════════════════════════════┤ ← Sticky when scrolling
│  [✏️ Edit]  [🗄️ Archive]  [🗑️ Delete]  [▲ Hide]│
├─────────────────────────────────────────────────┤
│                                                 │
│  🗂️ ARCHIVED ORDER BANNER (if archived)        │
│  ───────────────────────────────────────────   │
│  Archived: Jan 14, 2025, 11:30 PM              │
│  By: ADM-001 - Admin User                      │
│  Scheduled deletion: Feb 13, 2025              │
│                                                 │
│  📋 DETAILED INFORMATION                        │
│  ══════════════════════                         │
│                                                 │
│  Requestor Information                          │
│  ───────────────────────                        │
│  [All requestor details...]                     │
│                                                 │
│  Delivery Information                           │
│  [All delivery details...]                      │
│                                                 │
│  Product Items                                  │
│  [Product table...]                             │
│                                                 │
│  Special Instructions                           │
│  [Instructions text...]                         │
│                                                 │
├─────────────────────────────────────────────────┤
│  [✏️ Edit Order]  [🗄️ Archive]  [Close]        │ ← Bottom actions
└─────────────────────────────────────────────────┘
```

---

## Action Button Mapping

### Active Order Actions (Not Archived/Deleted)

| Action        | Icon | Variant | Callback          | Behavior                                    |
|---------------|------|---------|-------------------|---------------------------------------------|
| Edit Order    | ✏️   | secondary | onEdit          | Opens EditOrderModal                        |
| Archive Order | 🗄️   | secondary | onArchive       | Prompts for reason, archives order          |
| Delete Order  | 🗑️   | danger  | onDelete          | Confirms deletion, soft-deletes order       |
| View Details  | ▼/▲  | ghost   | toggleExpanded    | Expands/collapses modal                     |

### Archived Order Actions

| Action         | Icon | Variant | Callback          | Behavior                                    |
|----------------|------|---------|-------------------|---------------------------------------------|
| Restore Order  | ↩️   | primary | onRestore         | Unarchives order, returns to active state   |
| Delete Order   | 🗑️   | danger  | onDelete          | Confirms deletion, soft-deletes order       |
| View Details   | ▼/▲  | ghost   | toggleExpanded    | Expands/collapses modal                     |

### Deleted Order Actions (Read-Only)

| Action         | Icon | Variant | Callback          | Behavior                                    |
|----------------|------|---------|-------------------|---------------------------------------------|
| View Details   | ▼/▲  | ghost   | toggleExpanded    | Expands/collapses modal (details only)      |

---

## buildOrderActions Integration

The `buildOrderActions` function from `@cks/domain-widgets` already exists and returns admin actions based on order state.

**Current Usage** (in ActionModal):
```tsx
const actions = buildOrderActions({
  order: {
    orderId: row.orderId,
    status: row.status,
    orderType: row.orderType,
  },
  state: isArchived ? 'archived' : 'active',
  role: 'admin',
  callbacks: {
    onViewDetails: () => {
      setSelectedOrderId(orderId);
      setShowOrderDetails(true);
    },
    onEdit: () => {
      setEditingOrder(order);
      setShowEditModal(true);
    },
    onArchive: async () => {
      const reason = prompt('Reason for archiving?');
      await archiveAPI.archive('order', orderId, reason);
    },
    onRestore: async () => {
      await archiveAPI.restore('order', orderId);
    },
    onDelete: async () => {
      if (confirm('Permanently delete this order?')) {
        await deleteOrder(orderId);
      }
    },
  },
});

return actions; // Array of ActionItem[]
```

**New Usage** (in ActivityModal):
```tsx
const actions = buildOrderActions({
  order: orderData,
  state: orderData.isArchived ? 'archived' : orderData.isDeleted ? 'deleted' : 'active',
  role: 'admin',
  callbacks: {
    onViewDetails: () => setExpanded(!expanded), // ← Toggle expansion instead of opening new modal
    onEdit: () => {
      setShowEditModal(true);
      setEditingOrder(orderData);
    },
    onArchive: async () => {
      const reason = prompt('Reason for archiving?');
      await archiveAPI.archive('order', orderData.orderId, reason);
      mutate(); // Refresh data
    },
    onRestore: async () => {
      await archiveAPI.restore('order', orderData.orderId);
      mutate();
    },
    onDelete: async () => {
      if (confirm('Permanently delete this order?')) {
        await deleteOrder(orderData.orderId);
        onClose();
      }
    },
  },
});
```

**Key Change**: `onViewDetails` toggles modal expansion instead of opening OrderDetailsGateway.

---

## AdminHub Implementation Changes

### 1. Remove ActionModal Usage

**Before**:
```tsx
// State
const [showActionModal, setShowActionModal] = useState(false);
const [selectedEntity, setSelectedEntity] = useState<Record<string, any> | null>(null);

// Activity click handler
const handleActivityClick = useCallback((data: { entity: any; state: 'active' | 'archived' }) => {
  const { entity } = data;
  setSelectedEntity(entity);
  setShowActionModal(true);
}, []);

// Modal rendering
<ActionModal
  isOpen={showActionModal}
  onClose={handleModalClose}
  entity={selectedEntity}
  actions={buildOrderActions({...})}
/>

<OrderDetailsGateway
  orderId={selectedOrderId}
  onClose={() => setSelectedOrderId(null)}
/>
```

**After**:
```tsx
// State (simplified)
const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
const [selectedOrderState, setSelectedOrderState] = useState<'active' | 'archived'>('active');

// Activity click handler
const handleActivityClick = useCallback((data: { entity: any; state: 'active' | 'archived' }) => {
  setSelectedOrderId(data.entity.orderId);
  setSelectedOrderState(data.state);
}, []);

// Modal rendering (single modal)
{selectedOrderId && (
  <ActivityModal
    orderId={selectedOrderId}
    orderState={selectedOrderState}
    role="admin"
    onClose={() => {
      setSelectedOrderId(null);
      setSelectedOrderState('active');
    }}
    defaultExpanded={false}
  />
)}

// ActionModal and OrderDetailsGateway NO LONGER NEEDED
```

---

## ActivityModal Props for AdminHub

```typescript
interface ActivityModalProps {
  // Core
  isOpen: boolean;
  onClose: () => void;
  orderId: string;

  // Role-specific behavior
  role: 'admin' | 'user'; // 'admin' shows admin actions, 'user' shows workflow actions
  orderState?: 'active' | 'archived' | 'deleted'; // Determines available actions

  // Data (from useOrderDetails hook)
  order?: OrderData; // If not provided, modal will fetch using orderId

  // Progressive disclosure
  defaultExpanded?: boolean;

  // Callbacks for admin actions
  onEdit?: (order: OrderData) => void;
  onArchive?: (orderId: string, reason: string) => Promise<void>;
  onRestore?: (orderId: string) => Promise<void>;
  onDelete?: (orderId: string) => Promise<void>;

  // Callbacks for user actions
  onAction?: (action: string) => void; // For Accept, Decline, Cancel
}
```

---

## Admin-Specific Features

### 1. Edit Order Integration

When admin clicks "Edit Order" in expanded mode:
```tsx
const handleEdit = () => {
  setShowEditModal(true);
  setEditingOrder(orderData);
  // Keep ActivityModal open (or close it, depending on UX preference)
};
```

**Options**:
- **Option A**: Keep ActivityModal open while EditOrderModal is open (stacked modals)
- **Option B**: Close ActivityModal, open EditOrderModal, then reopen ActivityModal on save
- **Recommendation**: Option A (stacked modals) - less disruptive

### 2. Archive Order Flow

```tsx
const handleArchive = async () => {
  const reason = window.prompt('Please provide a reason for archiving this order:');
  if (!reason || reason.trim() === '') {
    alert('Archive reason is required.');
    return;
  }

  try {
    await archiveAPI.archive('order', orderData.orderId, reason.trim());
    mutate(); // Refresh order data
    alert('Order archived successfully.');
    // Modal stays open, now shows "Archived" banner and "Restore" action
  } catch (err) {
    console.error('Failed to archive order:', err);
    alert('Failed to archive order. Please try again.');
  }
};
```

### 3. Restore Order Flow

```tsx
const handleRestore = async () => {
  try {
    await archiveAPI.restore('order', orderData.orderId);
    mutate();
    alert('Order restored successfully.');
    // Modal stays open, banner disappears, actions change to active order actions
  } catch (err) {
    console.error('Failed to restore order:', err);
    alert('Failed to restore order.');
  }
};
```

### 4. Delete Order Flow

```tsx
const handleDelete = async () => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this order? This action cannot be undone.'
  );
  if (!confirmed) return;

  try {
    await deleteOrder(orderData.orderId);
    alert('Order deleted successfully.');
    onClose(); // Close modal after deletion
  } catch (err) {
    console.error('Failed to delete order:', err);
    alert('Failed to delete order.');
  }
};
```

---

## Action Bar Styling (Admin vs User)

### User Action Bar (CrewHub, etc.)
```tsx
<div className={styles.actionBar}>
  <button className={styles.acceptButton}>Accept</button>
  <button className={styles.declineButton}>Decline</button>
  <button className={styles.viewDetailsButton}>
    {expanded ? '▲ Hide Details' : '▼ View Details'}
  </button>
</div>
```

### Admin Action Bar (AdminHub)
```tsx
<div className={styles.actionBar + ' ' + styles.adminActionBar}>
  <button className={styles.editButton}>✏️ Edit</button>
  <button className={styles.archiveButton}>🗄️ Archive</button>
  <button className={styles.deleteButton}>🗑️ Delete</button>
  <button className={styles.viewDetailsButton}>
    {expanded ? '▲ Hide' : '▼ Details'}
  </button>
</div>
```

**CSS Differences**:
- Admin action bar uses secondary/danger variants
- User action bar uses primary/danger variants
- Both have same sticky behavior when expanded

---

## Files to Modify for AdminHub

### 1. AdminHub.tsx

**Changes**:
- Remove `showActionModal`, `setShowActionModal`, `selectedEntity`, `setSelectedEntity` state
- Simplify `handleActivityClick` to just set `selectedOrderId`
- Replace `ActionModal` rendering with `ActivityModal`
- Remove `OrderDetailsGateway` rendering (integrated into ActivityModal)
- Update `buildOrderActions` callbacks to work with ActivityModal

**Before** (lines ~1200-1240):
```tsx
const handleActivityClick = useCallback((data: { entity: any; state: 'active' | 'archived' }) => {
  const { entity, state } = data;
  const archiveMeta = getArchiveMetadataFromEntity(entity);
  const selectedEntityData = {
    orderId: entity.orderId || entity.order_id,
    // ... lots of field mapping
  };
  setSelectedEntity(selectedEntityData);
  setShowActionModal(true);
}, []);
```

**After**:
```tsx
const handleActivityClick = useCallback((data: { entity: any; state: 'active' | 'archived' }) => {
  const { entity, state } = data;
  setSelectedOrderId(entity.orderId || entity.order_id || entity.id);
  setSelectedOrderState(state);
}, []);
```

### 2. ActivityModal Component

**New Prop**: `role: 'admin' | 'user'`

**Behavior**:
- When `role === 'admin'`:
  - Use `buildOrderActions` from `@cks/domain-widgets`
  - Show admin actions (Edit, Archive, Delete, Restore)
  - Pass admin callbacks
- When `role === 'user'`:
  - Use `order.availableActions` from backend
  - Show user actions (Accept, Decline, Cancel)
  - Pass user action callback

---

## Testing Checklist (AdminHub-Specific)

### Admin Action Testing
- ✅ Edit Order button opens EditOrderModal
- ✅ Archive Order prompts for reason and archives successfully
- ✅ Restore Order unarchives order and updates UI
- ✅ Delete Order confirms and deletes successfully
- ✅ View Details toggles expansion smoothly

### State-Based Action Testing
- ✅ Active order shows: Edit, Archive, Delete, View Details
- ✅ Archived order shows: Restore, Delete, View Details
- ✅ Deleted order shows: View Details only (read-only)

### Banner Testing
- ✅ Archived order shows grey ArchivedBanner in expanded view
- ✅ Banner disappears after restore
- ✅ Deleted order shows red DeletedBanner

### Modal Interaction Testing
- ✅ ActivityModal + EditOrderModal can be open simultaneously
- ✅ Saving EditOrderModal refreshes ActivityModal data
- ✅ Archive/Restore actions update modal in real-time
- ✅ Modal closes properly after delete action

---

## Benefits for AdminHub

### Before (Double-Modal)
❌ Admin clicks activity → ActionModal opens → Clicks "View Details" → OrderDetailsModal opens
❌ Admin wants to edit → Must close both modals, click activity again, click "Edit"
❌ Admin wants to archive after viewing → Same friction

### After (Progressive Disclosure)
✅ Admin clicks activity → ActivityModal opens (compact)
✅ Admin clicks "View Details" → Modal expands in place
✅ Admin can Edit/Archive/Delete while viewing full details
✅ Actions always visible (sticky header)
✅ No modal switching needed

**Same seamless UX as all other hubs!**

---

## Migration Path

### Phase 1: Create ActivityModal with Admin Support
- Add `role` prop to ActivityModal
- Integrate `buildOrderActions` for admin role
- Test with sample admin actions

### Phase 2: Update AdminHub
- Replace ActionModal + OrderDetailsGateway with ActivityModal
- Update handleActivityClick to use new flow
- Test all admin actions

### Phase 3: Verify Backward Compatibility
- Ensure EditOrderModal still works
- Ensure archive/restore APIs still work
- Ensure activity feed still updates correctly

---

## Key Implementation Notes

1. **Same Component, Different Actions**: ActivityModal works for both admin and users by accepting a `role` prop
2. **buildOrderActions Reuse**: Leverage existing `buildOrderActions` function for admin actions
3. **No Data Duplication**: ActivityModal uses same `useOrderDetails` hook as OrderDetailsGateway
4. **Progressive Enhancement**: Start with basic actions, add more (Reports, Feedback) later

---

## Summary

AdminHub will use the **exact same ActivityModal component** as all other hubs, with these differences:

| Feature          | User Hubs (Crew, Center, etc.) | AdminHub                    |
|------------------|--------------------------------|-----------------------------|
| Modal Component  | ActivityModal                  | ActivityModal               |
| Role Prop        | `role="user"`                  | `role="admin"`              |
| Actions Shown    | Accept, Decline, Cancel        | Edit, Archive, Delete, Restore |
| Action Source    | `order.availableActions`       | `buildOrderActions()`       |
| Callbacks        | `onAction(action: string)`     | `onEdit`, `onArchive`, etc. |

**Result**: Consistent UX across entire application with role-appropriate actions.

---

**Status**: Ready for GPT-5 Implementation
**Priority**: HIGH (same as other hubs)
**Estimated Effort**: +1 hour (on top of base ActivityModal implementation)
