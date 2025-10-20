# Current Order Implementation Analysis

## File Structure

### Modal Components
- `packages/ui/src/modals/ActivityModal/ActivityModal.tsx` - Main modal with tabs (Quick Actions, Details)
- `packages/ui/src/modals/OrderDetailsModal/OrderDetailsModal.tsx` - Old view-only modal (being phased out)
- `packages/ui/src/cards/OrderCard/OrderCard.tsx` - Card component shown in modal header

### Gateway & Hooks
- `apps/frontend/src/components/ActivityModalGateway.tsx` - Wrapper that connects orderId → ActivityModal
- `apps/frontend/src/hooks/useOrderDetails.ts` - Fetches and normalizes order data

### API Layer
- `apps/frontend/src/shared/api/orderDetails.ts` - Calls `/order/:id/details`
- `apps/frontend/src/shared/api/hub.ts` - Contains `applyHubOrderAction()` function

### Hub Integration (7 files)
- `apps/frontend/src/hubs/CrewHub.tsx` - Order action handlers
- `apps/frontend/src/hubs/ManagerHub.tsx` - Order action handlers
- `apps/frontend/src/hubs/ContractorHub.tsx` - Order action handlers
- `apps/frontend/src/hubs/CustomerHub.tsx` - Order action handlers
- `apps/frontend/src/hubs/CenterHub.tsx` - Order action handlers
- `apps/frontend/src/hubs/WarehouseHub.tsx` - Order action handlers
- `apps/frontend/src/hubs/AdminHub.tsx` - Admin order actions (edit, archive, delete)

## Current Flow (User Perspective)

### 1. User Clicks Order
**From Activity Feed:**
```tsx
// apps/frontend/src/components/ActivityFeed.tsx
<RecentActivity
  activities={activities}
  onClick={(activity) => {
    const result = await fetchOrderForActivity(targetId);
    onOpenActionableOrder(result.entity); // Has availableActions
  }}
/>
```

**From Orders Section:**
```tsx
// packages/domain-widgets/src/OrdersSection/OrdersSection.tsx
<OrderCard
  onAction={(action) => {
    if (action === 'View Details') {
      setSelectedOrderId(orderId);
    }
  }}
/>
```

### 2. Hub Sets State
```tsx
// apps/frontend/src/hubs/CrewHub.tsx
const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
const [actionOrder, setActionOrder] = useState<any | null>(null);

// Activity feed triggers this
setActionOrder(order); // Order with availableActions array

// Orders section triggers this
setSelectedOrderId(orderId); // Just the ID
```

### 3. Gateway Fetches Data
```tsx
// apps/frontend/src/components/ActivityModalGateway.tsx
export function ActivityModalGateway({ orderId, userAvailableActions }) {
  const details = useOrderDetails({ orderId }); // ← 5 SECOND DELAY HERE

  // Map backend actions to UI actions
  const actions = userAvailableActions.map(label => ({
    label,
    variant: /accept|approve/i.test(label) ? 'primary' : 'secondary',
    onClick: () => onAction(orderId, label)
  }));

  return <ActivityModal order={details.order} actions={actions} />;
}
```

### 4. Hook Fetches Details
```tsx
// apps/frontend/src/hooks/useOrderDetails.ts
export function useOrderDetails({ orderId }) {
  useEffect(() => {
    const fresh = await fetchOrderDetails(orderId); // ← API CALL
    const normalized = normalizeOrder(fresh);
    setOrderData(normalized);
  }, [orderId]);
}

// apps/frontend/src/shared/api/orderDetails.ts
export async function fetchOrderDetails(orderId: string) {
  const res = await apiFetch(`/order/${orderId}/details?includeDeleted=1`);
  return res.data;
}
```

**Backend Response:**
```json
{
  "orderId": "CRW-006-PO-110",
  "orderType": "product",
  "title": "Product Order",
  "status": "pending",
  "requestedBy": "CRW-006",
  "destination": "CEN-010",
  "items": [...],
  "metadata": {
    "availability": {...},
    "contacts": {
      "requestor": {...},
      "destination": {...}
    },
    "managedById": "MGR-005",
    "fulfilledById": "WAR-002"
  },
  "approvalStages": [
    { "role": "manager", "status": "pending" },
    { "role": "warehouse", "status": "waiting" }
  ]
}
```

### 5. Modal Renders
```tsx
// packages/ui/src/modals/ActivityModal/ActivityModal.tsx
export default function ActivityModal({ order, actions }) {
  const [activeTab, setActiveTab] = useState('actions');

  const tabs = [
    { id: 'actions', label: 'Quick Actions', visible: actions.length > 0 },
    { id: 'details', label: 'Details', visible: true }
  ];

  return (
    <ModalRoot>
      <OrderCard
        orderId={order.orderId}
        status={order.status}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'actions' && (
        <div className={styles.actions}>
          {actions.map(action => (
            <Button
              variant={action.variant}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {activeTab === 'details' && (
        order.orderType === 'product'
          ? <ProductOrderContent order={order} />
          : <ServiceOrderContent order={order} />
      )}
    </ModalRoot>
  );
}
```

### 6. User Clicks Action
```tsx
// User clicks "Accept" button
onClick: () => onAction(orderId, "Accept")

// Callback in hub
const handleOrderAction = async (orderId, action) => {
  if (action === 'Accept') {
    await applyHubOrderAction(orderId, { action: 'accept' });
    mutate(`/hub/orders/${code}`); // Refresh data
  }
  if (action === 'Reject') {
    const reason = prompt('Reason?');
    await applyHubOrderAction(orderId, { action: 'reject', notes: reason });
    mutate(`/hub/orders/${code}`);
  }
  // ... more action handlers
};
```

### 7. Backend Processes Action
```tsx
// apps/frontend/src/shared/api/hub.ts
export async function applyHubOrderAction(orderId, payload) {
  const response = await apiFetch(`/orders/${orderId}/actions`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return response.data;
}
```

**Backend Endpoint:** `POST /orders/:id/actions`
```json
// Request
{
  "action": "accept",
  "notes": "Optional notes"
}

// Response
{
  "success": true,
  "message": "Order accepted",
  "data": { /* updated order */ }
}
```

## What Works Well ✅

1. **Backend RBAC** - Server returns only valid actions for user role
2. **Action validation** - Backend validates state transitions
3. **Generic action endpoint** - `/orders/:id/actions` works for all action types
4. **Data normalization** - `useOrderDetails` hook handles field mapping
5. **Progressive disclosure** - Activity feed shows actions, details on expand
6. **Deleted order handling** - Modal shows deleted banner when appropriate

## What's Broken ❌

1. **5 second modal delay** - Fetches full details on every click (no caching)
2. **Duplicated action handlers** - All 7 hubs have ~50 lines of identical code:
   ```tsx
   const handleOrderAction = async (orderId, action) => {
     if (action === 'Accept') { /* ... */ }
     if (action === 'Reject') { /* ... */ }
     if (action === 'Cancel') { /* ... */ }
     // Repeated in CrewHub, ManagerHub, ContractorHub, etc.
   };
   ```
3. **Inconsistent action mapping** - Frontend maps "Accept" → `{ action: 'accept' }`
4. **UI prompts in business logic** - `window.prompt()` calls scattered in hubs
5. **Modal state duplication** - Each hub has `selectedOrderId`, `actionOrder` state
6. **No prefetching** - Could fetch on hover but don't

## Pain Points for Developers

### Adding New Action Type
**Current:** Must update 7+ files
1. Backend adds action to policy
2. Backend returns action in `availableActions`
3. Update `handleOrderAction` in CrewHub
4. Update `handleOrderAction` in ManagerHub
5. Update `handleOrderAction` in ContractorHub
6. Update `handleOrderAction` in CustomerHub
7. Update `handleOrderAction` in CenterHub
8. Update `handleOrderAction` in WarehouseHub
9. Update `handleOrderAction` in AdminHub (different pattern)

**Target:** Should be ZERO frontend changes
1. Backend adds action to policy
2. Backend returns in `availableActions`
3. **Done!** Frontend automatically shows button

### Adding New Entity Type (e.g., Procedures)
**Current:** Must create ~12 files
1. Modal component
2. Card component
3. Gateway component
4. Details hook
5. API fetch function
6. Add to all 7 hubs (state, handlers, renders)

**Target:** Should be ~2 files
1. Backend creates `/procedures/:id/details` endpoint
2. Backend creates `/procedures/:id/actions` endpoint
3. **Done!** EntityModal auto-detects from ID

## Backend Contract Analysis

### What Backend Already Provides ✅
```typescript
// GET /order/:id/details
{
  orderId: string,
  orderType: 'service' | 'product',
  status: string,
  // ... all order fields

  metadata: {
    // Enriched data
    contacts: { requestor: {...}, destination: {...} },
    availability: {...},
    serviceDetails: {...}
  },

  approvalStages: [...], // Workflow state
  availableActions: ['Accept', 'Reject'], // ← CRITICAL for RBAC
}
```

### What Backend Still Needs ❌
```typescript
// Should add to response:
{
  // ... existing fields

  ui: {
    tabs: [
      { id: 'actions', label: 'Quick Actions' },
      { id: 'details', label: 'Details' },
      { id: 'workflow', label: 'Approval Workflow' }
    ],

    fields: {
      crew: { visible: false }, // Hide crew for warehouse orders
      cancellationReason: { visible: true, value: "..." }
    },

    actions: [
      {
        id: 'accept',
        label: 'Accept Order',
        variant: 'primary',
        requiresInput: false
      },
      {
        id: 'reject',
        label: 'Reject',
        variant: 'danger',
        requiresInput: true,
        inputPrompt: 'Please provide a rejection reason'
      }
    ]
  }
}
```

## Migration Path to EntityModal

### Phase 1: Centralize Action Handlers (4 hours)
**Goal:** Remove duplication, keep existing modals

```tsx
// hooks/useEntityActions.ts (NEW)
export function useEntityActions() {
  return async (entityId: string, actionId: string, params?: any) => {
    const { type } = parseEntityId(entityId);

    let endpoint = '';
    if (type === 'order') endpoint = `/orders/${entityId}/actions`;
    if (type === 'service') endpoint = `/services/${entityId}/actions`;

    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ action: actionId, ...params })
    });

    if (response.success) {
      toast.success(response.message);
      mutate(key => key.includes(entityId));
    } else {
      toast.error(response.error);
    }

    return response;
  };
}

// All 7 hubs change from this:
const handleOrderAction = async (orderId, action) => {
  if (action === 'Accept') { /* 50 lines */ }
  if (action === 'Reject') { /* 50 lines */ }
  // ...
};

// To this:
const { handleAction } = useEntityActions();
```

**Files Changed:** 7 hub files, +1 new hook file
**Lines Removed:** ~350 lines of duplicate code
**Lines Added:** ~80 lines (centralized hook)
**Net:** -270 lines, 100% action coverage maintained

### Phase 2: EntityModal Wrapper (3 hours)
**Goal:** Centralize modal state, delegate to existing modals

```tsx
// components/EntityModal.tsx (NEW)
export function EntityModal({ entityId, isOpen, onClose }) {
  const { type } = parseEntityId(entityId);
  const { handleAction } = useEntityActions();

  if (type === 'order') {
    return <ActivityModalGateway
      orderId={entityId}
      isOpen={isOpen}
      onClose={onClose}
      onAction={handleAction}
    />;
  }

  if (type === 'service') {
    return <ServiceViewModal
      serviceId={entityId}
      isOpen={isOpen}
      onClose={onClose}
    />;
  }

  // ... other types
}

// Hubs change from this:
const [selectedOrderId, setSelectedOrderId] = useState(null);
const [actionOrder, setActionOrder] = useState(null);
{selectedOrderId && <ActivityModalGateway orderId={selectedOrderId} />}
{actionOrder && <ActivityModalGateway orderId={actionOrder.id} />}

// To this:
const [selectedEntityId, setSelectedEntityId] = useState(null);
<EntityModal entityId={selectedEntityId} />
```

**Files Changed:** 7 hub files, +1 new component
**Lines Removed:** ~140 lines (modal state management)
**Lines Added:** ~100 lines (EntityModal wrapper)
**Net:** -40 lines, cleaner hub code

### Phase 3: Backend UI Config (8 hours + backend work)
**Goal:** Backend returns tabs/actions config

Backend adds to `/order/:id/details`:
```typescript
{
  // ... existing fields
  ui: {
    tabs: [...],
    actions: [...]
  }
}
```

Frontend reads config:
```tsx
// EntityModal becomes data-driven
const { data } = useEntityDetails(entityId);
const tabs = data.ui.tabs;
const actions = data.ui.actions.map(action => ({
  label: action.label,
  variant: action.variant,
  onClick: () => handleAction(entityId, action.id)
}));
```

**Files Changed:** Backend routes, EntityModal component
**Benefit:** Can change UI without frontend deploy

### Phase 4: Performance (3 hours)
**Goal:** Eliminate 5 second delay

**Option A: Prefetch on hover**
```tsx
<OrderCard
  onMouseEnter={() => {
    // Start fetching before click
    queryClient.prefetchQuery(['order', orderId]);
  }}
/>
```

**Option B: Load full data in lists**
```tsx
// Backend returns more data in list endpoints
GET /hub/orders/:code
{
  orders: [
    {
      orderId: "...",
      // Include most fields needed for modal
      items: [...],
      contacts: {...}
    }
  ]
}

// useOrderDetails uses this as initial data
useOrderDetails({ orderId, initial: orderFromList })
```

**Option C: Optimistic rendering**
```tsx
// Show modal immediately with list data
// Fetch full details in background
// Update when ready
```

## Recommendations

### Immediate (This Week)
1. ✅ Document current architecture (this file)
2. Create `useEntityActions()` hook
3. Migrate CrewHub to use centralized actions (proof of concept)
4. Measure impact (lines saved, bugs fixed)

### Short-term (Next Sprint)
4. Roll out `useEntityActions()` to all 7 hubs
5. Create `EntityModal` wrapper component
6. Migrate 1-2 hubs to use EntityModal

### Medium-term (Next Month)
7. Coordinate with backend on UI config contract
8. Implement backend UI config for orders
9. Update EntityModal to read backend config
10. Add prefetch/caching for performance

### Long-term (Quarter)
11. Extend to all entity types (services, reports, users)
12. Delete old modal components
13. Document pattern for new entity types

## Success Metrics

**Code Reduction:**
- Current: ~500 lines modal code per hub × 7 = 3,500 lines
- Target: ~50 lines per hub × 7 = 350 lines
- **Savings: 3,150 lines (90% reduction)**

**Performance:**
- Current: 5 seconds to open order modal
- Target: <500ms (prefetch or cached data)
- **Improvement: 10x faster**

**Developer Experience:**
- Current: 8 hours to add new entity type
- Target: <1 hour (just backend changes)
- **Improvement: 8x faster**

**Maintainability:**
- Current: Bug fixes require 7+ file changes
- Target: Bug fixes in 1 file (EntityModal)
- **Improvement: 7x fewer changes**

---

**Document Status:** Complete
**Last Updated:** 2025-10-19
**Next Step:** Create `useEntityActions()` hook
