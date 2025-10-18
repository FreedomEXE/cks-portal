# Activity Feed: Actionable Orders Implementation Plan for GPT-5

## Context

**This is Phase 2** - Implement AFTER completing the activity feed modal routing from `ACTIVITY_MODAL_ROUTING_PLAN_GPT5.md`.

**Phase 1** (Current): Make all hubs' activity feeds open view-only modals
**Phase 2** (This doc): Add actionable order support with OrderCard action buttons

---

## Problem Statement

**After Phase 1:**
- ✅ Users can click activities in all hubs
- ✅ OrderDetailsModal opens (view-only)
- ❌ Users cannot take actions (Accept, Decline, Cancel, etc.) from activity feed
- ❌ Must navigate to Orders tab to see action buttons

**Goal:**
When user clicks an activity:
- **If order needs action** (has `availableActions`) → Show OrderCard with action buttons in modal
- **If order is view-only** (completed, no actions) → Show OrderDetailsModal (current behavior)

---

## Architecture Decision: Option 1 (OrderCard in Modal)

### Why This Option:
1. ✅ 100% code reuse of existing OrderCard component
2. ✅ Stays in Recent Activity section (no navigation)
3. ✅ Exact same UX as Orders page
4. ✅ Clean separation: Actionable vs View-only

### How It Works:
```
User clicks activity
↓
Fetch order data (includes availableActions array)
↓
Decision Logic:
├─ availableActions.length > 0 → Show OrderActionModal (NEW)
│  └─ Displays OrderCard with action buttons
│     └─ User clicks action → Execute → Close modal → Refresh
└─ availableActions.length === 0 → Show OrderDetailsModal (existing)
   └─ Read-only view
```

---

## Components to Create

### 1. OrderActionModal Component

**Location**: `packages/ui/src/modals/OrderActionModal/OrderActionModal.tsx`

**Purpose**: Wrapper that displays a single OrderCard in a modal with action buttons

**Code Template**:
```tsx
import React from 'react';
import { ModalRoot } from '../ModalRoot';
import { OrderCard } from '../../cards/OrderCard/OrderCard';

export interface OrderActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    orderId: string;
    orderType: 'service' | 'product';
    title: string;
    requestedBy?: string;
    destination?: string;
    requestedDate: string;
    expectedDate?: string;
    serviceStartDate?: string;
    deliveryDate?: string;
    status: string;
    approvalStages?: Array<{
      role: string;
      status: string;
      user?: string;
      timestamp?: string;
    }>;
    availableActions?: string[];  // e.g., ['Accept', 'Decline', 'Cancel']
    transformedId?: string;
  };
  onAction: (orderId: string, action: string) => void;
}

export function OrderActionModal({
  isOpen,
  onClose,
  order,
  onAction,
}: OrderActionModalProps) {
  if (!isOpen || !order) return null;

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        minWidth: '600px',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <OrderCard
          orderId={order.orderId}
          orderType={order.orderType}
          title={order.title}
          requestedBy={order.requestedBy}
          destination={order.destination}
          requestedDate={order.requestedDate}
          expectedDate={order.expectedDate}
          serviceStartDate={order.serviceStartDate}
          deliveryDate={order.deliveryDate}
          status={order.status}
          approvalStages={order.approvalStages || []}
          actions={order.availableActions || []}
          onAction={(action) => {
            onAction(order.orderId, action);
            onClose();
          }}
          showWorkflow={true}
          collapsible={false}
          defaultExpanded={true}
          transformedId={order.transformedId}
        />
      </div>
    </ModalRoot>
  );
}
```

**Export from index**:
```tsx
// packages/ui/src/index.ts
export { OrderActionModal } from './modals/OrderActionModal/OrderActionModal';
export type { OrderActionModalProps } from './modals/OrderActionModal/OrderActionModal';
```

---

## Components to Modify

### 2. ActivityFeed Component

**Location**: `apps/frontend/src/components/ActivityFeed.tsx`

**Changes**:

#### Add New Prop:
```tsx
export interface ActivityFeedProps {
  // ... existing props
  onOpenActionableOrder?: (order: any) => void;  // NEW
}
```

#### Update Click Handler Logic:
```tsx
// Current logic (lines ~64-100)
if (targetType === 'order') {
  const result = await fetchOrderForActivity(targetId);
  const { entity, state, deletedAt, deletedBy } = result;

  if (state === 'deleted') {
    // Deleted orders: Go straight to OrderDetailsModal with banner
    const orderData = {
      ...entity,
      isDeleted: true,
      deletedAt,
      deletedBy,
    };
    onOpenOrderModal?.(orderData);
  } else {
    // Active or Archived orders: Open ActionModal first (ADMIN ONLY)
    onOpenOrderActions?.({
      entity,
      state,
      deletedAt,
      deletedBy,
    });
  }
}

// NEW LOGIC: Replace the "else" block above
} else {
  // Active or Archived orders: Check if actionable
  const hasActions = entity.availableActions && entity.availableActions.length > 0;

  if (hasActions) {
    // Actionable order: Show OrderActionModal with buttons
    if (!onOpenActionableOrder) {
      console.warn('[ActivityFeed] onOpenActionableOrder not provided, falling back to ActionModal');
      // Fallback to old behavior (ActionModal)
      onOpenOrderActions?.({ entity, state, deletedAt, deletedBy });
      return;
    }
    console.log('[ActivityFeed] Opening actionable order modal:', { orderId: targetId });
    onOpenActionableOrder(entity);
  } else {
    // View-only order: Show OrderDetailsModal directly
    console.log('[ActivityFeed] Opening view-only order modal:', { orderId: targetId });
    onOpenOrderModal?.(entity);
  }
}
```

---

### 3. All Hub Files (7 hubs)

**Files to Modify**:
1. `apps/frontend/src/hubs/AdminHub.tsx`
2. `apps/frontend/src/hubs/CrewHub.tsx`
3. `apps/frontend/src/hubs/CenterHub.tsx`
4. `apps/frontend/src/hubs/CustomerHub.tsx`
5. `apps/frontend/src/hubs/ContractorHub.tsx`
6. `apps/frontend/src/hubs/ManagerHub.tsx`
7. `apps/frontend/src/hubs/WarehouseHub.tsx`

**Changes for Each Hub**:

#### Add State Variable:
```tsx
const [actionableOrder, setActionableOrder] = useState<any>(null);
```

#### Import OrderActionModal:
```tsx
import { OrderActionModal } from '@cks/ui';
```

#### Wire Up ActivityFeed:
```tsx
<ActivityFeed
  activities={activities}
  hub="{hub-name}"
  onOpenOrderActions={handleOrderActions}  // existing
  onOpenOrderModal={(order) => setSelectedOrderId(order?.orderId || order?.id || null)}  // existing
  onOpenActionableOrder={setActionableOrder}  // NEW
  onOpenServiceModal={setSelectedServiceCatalog}  // existing (if applicable)
  isLoading={activitiesLoading}
  error={activitiesError}
  onError={(msg) => toast.error(msg)}
/>
```

#### Add Modal Rendering:
```tsx
{/* NEW: OrderActionModal for actionable orders from ActivityFeed */}
{actionableOrder && (
  <OrderActionModal
    isOpen={true}
    onClose={() => setActionableOrder(null)}
    order={actionableOrder}
    onAction={async (orderId, action) => {
      await handleOrderAction(orderId, action);
      setActionableOrder(null);
      // Refresh activity feed
      mutate?.();  // or however activities are refreshed in this hub
    }}
  />
)}

{/* Existing: OrderDetailsGateway for view-only orders */}
<OrderDetailsGateway
  orderId={selectedOrderId}
  onClose={() => setSelectedOrderId(null)}
/>
```

**Note**: `handleOrderAction` already exists in all hubs - it's used by the OrdersSection component.

---

## Decision Logic Reference

**Backend Provides**:
```tsx
interface Order {
  availableActions?: string[];  // e.g., ['Accept', 'Decline', 'Cancel', 'View Details']
}
```

**Frontend Logic**:
```tsx
if (order.availableActions && order.availableActions.length > 0) {
  // Has actions → Show OrderActionModal
  setActionableOrder(order);
} else {
  // No actions → Show OrderDetailsModal
  setSelectedOrderId(order.orderId);
}
```

---

## Special Handling: "View Details" Action

The `availableActions` array often includes "View Details" as an action. We need to filter this out or handle it specially.

**Option A: Filter it out**:
```tsx
// In OrderActionModal
<OrderCard
  actions={order.availableActions?.filter(a => a !== 'View Details') || []}
  // ...
/>
```

**Option B: Handle it in onAction**:
```tsx
onAction={(action) => {
  if (action === 'View Details') {
    // Switch to OrderDetailsModal
    setActionableOrder(null);
    setSelectedOrderId(order.orderId);
    return;
  }
  onAction(order.orderId, action);
  onClose();
}}
```

**Recommendation**: Use Option B - it allows users to switch from actionable view to details view.

---

## Testing Checklist

After implementation, verify:

### For Each Hub (Admin, Crew, Center, Customer, Contractor, Manager, Warehouse):

**Actionable Orders**:
- [ ] Click activity for pending order → OrderActionModal opens with action buttons
- [ ] Click "Accept" → Action executes → Modal closes → Activity feed refreshes
- [ ] Click "Decline" → Action executes → Modal closes → Activity feed refreshes
- [ ] Click "Cancel" → Action executes → Modal closes → Activity feed refreshes
- [ ] Click "View Details" (if present) → OrderDetailsModal opens

**View-Only Orders**:
- [ ] Click activity for completed order → OrderDetailsModal opens (read-only)
- [ ] Click activity for delivered order → OrderDetailsModal opens (read-only)
- [ ] Click activity for cancelled order → OrderDetailsModal opens (read-only)

**Deleted Orders**:
- [ ] Click activity for deleted order → OrderDetailsModal opens with DeletedBanner

---

## AdminHub Special Case

AdminHub currently uses ActionModal (different from OrderActionModal). We need to decide:

**Option A: Keep AdminHub as-is**
- AdminHub continues to use ActionModal for archived orders
- Only non-admin hubs get OrderActionModal

**Option B: Migrate AdminHub to OrderActionModal**
- All hubs use same pattern
- More consistent UX

**Recommendation**: Option A - Keep AdminHub behavior for now, focus on fixing non-admin hubs.

---

## Implementation Order

1. **Create OrderActionModal component** (`packages/ui/src/modals/OrderActionModal/`)
2. **Update ActivityFeed component** (add decision logic)
3. **Test with one hub** (e.g., CrewHub)
4. **Batch to remaining 5 hubs** (Center, Customer, Contractor, Manager, Warehouse)
5. **Verify AdminHub still works** (existing behavior)
6. **Test all scenarios** (actionable, view-only, deleted)

---

## Success Criteria

✅ Users can take actions (Accept, Decline, Cancel, etc.) from activity feed in all hubs
✅ OrderCard action buttons work identically to Orders section
✅ No navigation away from Recent Activity section
✅ View-only orders still open OrderDetailsModal
✅ Deleted orders still show DeletedBanner
✅ Build passes with no TypeScript errors
✅ All 7 hubs have consistent behavior

---

## Dependencies

- ✅ Phase 1 must be complete (activity feed modal routing)
- ✅ OrderCard component exists (`packages/ui/src/cards/OrderCard/`)
- ✅ OrdersSection already uses OrderCard with actions
- ✅ All hubs already have `handleOrderAction` function
- ✅ Backend already provides `availableActions` array

---

## Notes for GPT-5

1. **Start with OrderActionModal component** - it's self-contained
2. **Test with CrewHub first** - easier to verify one hub before batching
3. **ActivityFeed decision logic is critical** - make sure it checks `availableActions.length`
4. **Reuse existing action handlers** - all hubs already have `handleOrderAction`
5. **"View Details" needs special handling** - see "Special Handling" section above
6. **AdminHub can stay different** - focus on fixing non-admin hubs first
7. **Build incrementally** - component → logic → one hub → batch rest

---

## File Summary

**New Files**:
- `packages/ui/src/modals/OrderActionModal/OrderActionModal.tsx`

**Modified Files**:
- `packages/ui/src/index.ts` (export OrderActionModal)
- `apps/frontend/src/components/ActivityFeed.tsx` (decision logic)
- `apps/frontend/src/hubs/AdminHub.tsx` (wire up, optional)
- `apps/frontend/src/hubs/CrewHub.tsx` (wire up)
- `apps/frontend/src/hubs/CenterHub.tsx` (wire up)
- `apps/frontend/src/hubs/CustomerHub.tsx` (wire up)
- `apps/frontend/src/hubs/ContractorHub.tsx` (wire up)
- `apps/frontend/src/hubs/ManagerHub.tsx` (wire up)
- `apps/frontend/src/hubs/WarehouseHub.tsx` (wire up)

**Total**: 1 new file, 9 modified files

---

## Estimated Effort

- Create OrderActionModal: 30 minutes
- Update ActivityFeed: 15 minutes
- Test with CrewHub: 15 minutes
- Batch to 5 remaining hubs: 30 minutes
- Testing all scenarios: 30 minutes

**Total**: ~2 hours
