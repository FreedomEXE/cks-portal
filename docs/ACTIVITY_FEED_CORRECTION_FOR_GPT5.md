# Activity Feed Implementation Correction for GPT-5

## Current Problem

**What was implemented (Phase 1):**
- Non-admin hubs show ActionModal with "View Details" + "Cancel Order" buttons
- User must click "View Details" → THEN OrderDetailsModal opens
- This is a double-modal flow

**Example (CrewHub):**
```
User clicks activity
↓
ActionModal opens: "Actions for CRW-006-PO-108"
├─ View Details button
└─ Cancel Order button
↓
User clicks "View Details"
↓
OrderDetailsModal opens
```

**Why this is wrong:**
- ActionModal with "View Details" button is an **AdminHub-only pattern**
- Non-admin users should see actionable UI directly, not an intermediate modal
- Creates unnecessary extra click

---

## What We Actually Want (Phase 2 - Skip Phase 1)

**Correct Flow for Non-Admin Hubs:**
```
User clicks activity
↓
Check if order has actions
├─ HAS ACTIONS (Accept/Decline/Cancel) → OrderActionModal
│  └─ Shows OrderCard with action buttons inline
│  └─ User clicks "Accept" → Action executes
└─ NO ACTIONS (completed/delivered) → OrderDetailsModal
   └─ Read-only view
```

**Key Point:** Skip ActionModal entirely for non-admin hubs. Go straight to either:
1. OrderActionModal (with OrderCard action buttons) - for actionable orders
2. OrderDetailsModal (read-only) - for view-only orders

---

## Correction Instructions for GPT-5

### Step 1: Remove ActionModal from Non-Admin Hubs

**Files to modify:**
1. `apps/frontend/src/hubs/CrewHub.tsx`
2. `apps/frontend/src/hubs/CenterHub.tsx`
3. `apps/frontend/src/hubs/CustomerHub.tsx`
4. `apps/frontend/src/hubs/ContractorHub.tsx`
5. `apps/frontend/src/hubs/ManagerHub.tsx`
6. `apps/frontend/src/hubs/WarehouseHub.tsx`

**What to remove from each hub:**
```tsx
// REMOVE THIS ENTIRE BLOCK
{showActionModal && selectedOrderForActions && (
  <ActionModal
    isOpen={showActionModal}
    onClose={() => {
      setShowActionModal(false);
      setSelectedOrderForActions(null);
      setOrderState('active');
    }}
    entity={selectedOrderForActions}
    title={`Actions for ${selectedOrderForActions.orderId}`}
    actions={buildOrderActions(...)}
    archiveMetadata={...}
  />
)}
```

**What to remove from state:**
```tsx
// REMOVE THESE
const [showActionModal, setShowActionModal] = useState(false);
const [selectedOrderForActions, setSelectedOrderForActions] = useState<any>(null);
const [orderState, setOrderState] = useState<string>('active');
```

**What to remove from ActivityFeed:**
```tsx
// REMOVE THIS PROP
onOpenOrderActions={handleOrderActions}
```

**What to remove from handlers:**
```tsx
// REMOVE THIS ENTIRE FUNCTION
const handleOrderActions = useCallback((data: { entity: any; state: string; ... }) => {
  // ...
}, []);
```

---

### Step 2: Implement OrderActionModal Component

**Create new file:** `packages/ui/src/modals/OrderActionModal/OrderActionModal.tsx`

**Full implementation:**
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

  // Filter out "View Details" from actions - we'll handle it specially
  const actionButtons = (order.availableActions || []).filter(a => a !== 'View Details');

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
          actions={actionButtons}
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

**Export from packages/ui/src/index.ts:**
```tsx
export { OrderActionModal } from './modals/OrderActionModal/OrderActionModal';
export type { OrderActionModalProps } from './modals/OrderActionModal/OrderActionModal';
```

---

### Step 3: Update ActivityFeed Component

**File:** `apps/frontend/src/components/ActivityFeed.tsx`

**Add new prop:**
```tsx
export interface ActivityFeedProps {
  // ... existing props
  onOpenActionableOrder?: (order: any) => void;  // NEW
}
```

**Update handler logic (around lines 64-100):**
```tsx
// Handle order activities
if (targetType === 'order') {
  try {
    const result = await fetchOrderForActivity(targetId);
    const { entity, state, deletedAt, deletedBy } = result;

    if (state === 'deleted') {
      // Deleted orders: Go straight to OrderDetailsModal with banner
      if (!onOpenOrderModal) {
        console.warn('[ActivityFeed] onOpenOrderModal not provided, ignoring deleted order click');
        return;
      }

      const orderData = {
        ...entity,
        isDeleted: true,
        deletedAt,
        deletedBy,
      };

      console.log('[ActivityFeed] Opening deleted order modal:', { orderId: targetId });
      onOpenOrderModal(orderData);
    } else {
      // Active or Archived orders: Check if actionable
      const hasActions = entity.availableActions && entity.availableActions.length > 0;

      if (hasActions && onOpenActionableOrder) {
        // Actionable order: Show OrderActionModal with buttons
        console.log('[ActivityFeed] Opening actionable order modal:', { orderId: targetId });
        onOpenActionableOrder(entity);
      } else {
        // View-only order: Show OrderDetailsModal directly
        console.log('[ActivityFeed] Opening view-only order modal:', { orderId: targetId });
        if (!onOpenOrderModal) {
          console.warn('[ActivityFeed] onOpenOrderModal not provided');
          return;
        }
        onOpenOrderModal(entity);
      }
    }
  } catch (err) {
    console.error('[ActivityFeed] Failed to fetch order:', err);
    onError?.(parseActivityError(err));
  }
}
```

---

### Step 4: Update All Non-Admin Hubs

**For each hub (Crew, Center, Customer, Contractor, Manager, Warehouse):**

#### Add imports:
```tsx
import { OrderActionModal } from '@cks/ui';
```

#### Add state:
```tsx
const [actionableOrder, setActionableOrder] = useState<any>(null);
// Keep existing: selectedOrderId state
```

#### Update ActivityFeed props:
```tsx
<ActivityFeed
  activities={activities}
  hub="{hub-name}"
  onOpenActionableOrder={setActionableOrder}  // NEW
  onOpenOrderModal={(order) => setSelectedOrderId(order?.orderId || order?.id || null)}
  // Remove: onOpenOrderActions (delete this line)
  onOpenServiceModal={setSelectedServiceCatalog}  // if service modals exist
  isLoading={activitiesLoading}
  error={activitiesError}
  onError={(msg) => toast.error(msg)}
/>
```

#### Add OrderActionModal rendering:
```tsx
{/* OrderActionModal for actionable orders from ActivityFeed */}
{actionableOrder && (
  <OrderActionModal
    isOpen={true}
    onClose={() => setActionableOrder(null)}
    order={actionableOrder}
    onAction={async (orderId, action) => {
      // Use existing hub's order action handler
      await handleOrderAction(orderId, action);  // or whatever the hub calls it
      setActionableOrder(null);
      // Refresh orders
      mutate?.();  // or however orders are refreshed in this hub
    }}
  />
)}

{/* OrderDetailsGateway for view-only orders (keep existing) */}
<OrderDetailsGateway
  orderId={selectedOrderId}
  onClose={() => setSelectedOrderId(null)}
/>
```

**Note:** Each hub already has `handleOrderAction` or similar function from OrdersSection integration. Reuse that.

---

### Step 5: Keep AdminHub As-Is

**Important:** Do NOT modify AdminHub. It should continue using ActionModal pattern:
```tsx
// AdminHub keeps this pattern:
Activity click → ActionModal → View Details → OrderDetailsModal
```

---

## Summary of Changes

### Remove from 6 Non-Admin Hubs:
- ❌ ActionModal component rendering
- ❌ `showActionModal`, `selectedOrderForActions`, `orderState` state
- ❌ `handleOrderActions` callback
- ❌ `onOpenOrderActions` prop on ActivityFeed

### Add to 6 Non-Admin Hubs:
- ✅ OrderActionModal import from `@cks/ui`
- ✅ `actionableOrder` state
- ✅ `onOpenActionableOrder` prop on ActivityFeed
- ✅ OrderActionModal rendering with action handler

### New Files:
- ✅ `packages/ui/src/modals/OrderActionModal/OrderActionModal.tsx`

### Modified Files:
- ✅ `packages/ui/src/index.ts` (export)
- ✅ `apps/frontend/src/components/ActivityFeed.tsx` (decision logic)
- ✅ All 6 non-admin hub files

---

## Expected Behavior After Correction

### CrewHub Example (and all non-admin hubs):

**Scenario 1: Actionable Order (has Accept/Decline buttons)**
```
User clicks activity
↓
OrderActionModal opens
├─ Shows OrderCard with workflow
├─ Accept button
├─ Decline button
└─ Cancel button
↓
User clicks "Accept"
↓
Action executes → Modal closes → Orders refresh
```

**Scenario 2: View-Only Order (completed/delivered)**
```
User clicks activity
↓
OrderDetailsModal opens (read-only)
└─ No action buttons, just details
```

**Scenario 3: Deleted Order**
```
User clicks activity
↓
OrderDetailsModal opens with DeletedBanner
└─ Shows deletion info
```

---

## AdminHub (No Changes)

AdminHub keeps existing behavior:
```
Activity click → ActionModal → User clicks "View Details" → OrderDetailsModal
```

This is intentional - AdminHub has different needs (archive actions, etc.)

---

## Testing Checklist

After implementing corrections:

### For Each Non-Admin Hub:
- [ ] Click activity for pending order → OrderActionModal opens with action buttons
- [ ] Click "Accept" → Action executes, modal closes
- [ ] Click "Decline" → Action executes, modal closes
- [ ] Click activity for completed order → OrderDetailsModal opens (read-only, no actions)
- [ ] Click activity for deleted order → OrderDetailsModal with DeletedBanner

### AdminHub:
- [ ] Activity click → ActionModal still opens (existing behavior)
- [ ] Click "View Details" → OrderDetailsModal still opens

---

## Why This Approach

**User's Goal:**
> "I want them to be able to just reuse the existing code we have for order actions... I want that when they click the recent activity it either opens that page within the recent activity section"

**OrderCard already has:**
- ✅ Action buttons (Accept, Decline, Cancel, etc.)
- ✅ Approval workflow display
- ✅ Order details inline
- ✅ All the UI logic

**OrderActionModal:**
- ✅ Wraps OrderCard in a modal
- ✅ 100% code reuse
- ✅ Stays in Recent Activity section
- ✅ No extra "View Details" click needed

**Result:** Users see actionable orders with action buttons immediately, just like in the Orders section.
