# Activity Feed Modal Routing Implementation Plan for GPT-5

## Problem Statement

**Current State:**
- ✅ **AdminHub**: ActivityFeed modals work - users can click activities and open modals
- ❌ **All Other Hubs** (Crew, Center, Customer, Contractor, Manager, Warehouse): ActivityFeed clicks do nothing
- ✅ **All Hubs**: Order section modals work via OrderDetailsGateway

**Root Cause:**
AdminHub wires up ActivityFeed with required handlers (`onOpenOrderActions`, `onOpenOrderModal`, `onOpenServiceModal`), but all other hubs are missing these handlers.

---

## Reference Implementation: AdminHub

### ActivityFeed Usage (AdminHub.tsx:1262-1270)
```tsx
<ActivityFeed
  activities={activityFeed}
  hub="admin"
  onClear={handleClearActivity}
  onOpenOrderActions={handleOrderActions}
  onOpenOrderModal={(order) => setSelectedOrderId(order?.orderId || order?.id || null)}
  onOpenServiceModal={setSelectedServiceCatalog}
  isLoading={activitiesLoading}
  error={activitiesError}
/>
```

### Required Handler (AdminHub.tsx:~1205)
```tsx
const handleOrderActions = useCallback((data: { entity: any; state: string; deletedAt?: string; deletedBy?: string }) => {
  const { entity, state } = data;
  console.log('[AdminHub] Order actions requested:', { orderId: entity?.orderId, state });

  setSelectedOrderId(entity?.orderId || entity?.id || null);
  setSelectedOrderForActions(entity);
  setOrderState(state);
}, []);
```

### Required State Variables
```tsx
const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
const [selectedOrderForActions, setSelectedOrderForActions] = useState<any>(null);
const [orderState, setOrderState] = useState<string>('active');
const [selectedServiceCatalog, setSelectedServiceCatalog] = useState<any>(null);
```

### Modal Rendering Pattern
```tsx
{/* ActionModal for active/archived orders */}
{selectedOrderForActions && !selectedOrderForActions.isDeleted && (
  <ActionModal
    isOpen={true}
    onClose={() => {
      setSelectedOrderForActions(null);
      setOrderState('active');
    }}
    entity={selectedOrderForActions}
    title={`Actions for ${selectedOrderForActions.orderId}`}
    actions={buildOrderActions(...)}
    archiveMetadata={orderState === 'archived' ? extractArchiveMetadata(...) : null}
  />
)}

{/* OrderDetailsGateway for viewing order details */}
<OrderDetailsGateway
  orderId={selectedOrderId}
  onClose={() => setSelectedOrderId(null)}
/>
```

---

## Implementation Steps for GPT-5

### Phase 1: Add Required State to All Hubs (6 hubs)

For each hub (CrewHub, CenterHub, CustomerHub, ContractorHub, ManagerHub, WarehouseHub):

1. Add state variables:
   ```tsx
   const [selectedOrderForActions, setSelectedOrderForActions] = useState<any>(null);
   const [orderState, setOrderState] = useState<string>('active');
   // Note: selectedOrderId already exists in all hubs for OrderDetailsGateway
   // Note: selectedServiceCatalog may already exist in some hubs
   ```

2. Add handler function (copy from AdminHub pattern):
   ```tsx
   const handleOrderActions = useCallback((data: { entity: any; state: string; deletedAt?: string; deletedBy?: string }) => {
     const { entity, state } = data;
     console.log('[{HubName}] Order actions requested:', { orderId: entity?.orderId, state });

     setSelectedOrderId(entity?.orderId || entity?.id || null);
     setSelectedOrderForActions(entity);
     setOrderState(state);
   }, []);
   ```

### Phase 2: Wire Up ActivityFeed Props (6 hubs)

Update each hub's `<ActivityFeed>` component to include:

```tsx
<ActivityFeed
  activities={activities}
  hub="{hub-name}"
  onOpenOrderActions={handleOrderActions}  // ← ADD THIS
  onOpenOrderModal={(order) => setSelectedOrderId(order?.orderId || order?.id || null)}  // ← ADD THIS
  onOpenServiceModal={setSelectedServiceCatalog}  // ← ADD THIS (if service modals exist)
  isLoading={activitiesLoading}
  error={activitiesError}
  onError={(msg) => toast.error(msg)}
/>
```

### Phase 3: Add ActionModal Rendering (6 hubs)

Add ActionModal rendering BEFORE OrderDetailsGateway in each hub:

```tsx
{/* ActionModal for active/archived orders from ActivityFeed */}
{selectedOrderForActions && !selectedOrderForActions.isDeleted && (
  <ActionModal
    isOpen={true}
    onClose={() => {
      setSelectedOrderForActions(null);
      setOrderState('active');
    }}
    entity={selectedOrderForActions}
    title={`Actions for ${selectedOrderForActions.orderId}`}
    actions={buildOrderActions(
      selectedOrderForActions,
      profile?.role || null,
      profile?.cksCode || null,
      (action) => {
        handleOrderAction(selectedOrderForActions.orderId, action);
        setSelectedOrderForActions(null);
      },
      (orderId) => {
        setSelectedOrderId(orderId);
        setSelectedOrderForActions(null);
      }
    )}
    archiveMetadata={orderState === 'archived' ? extractArchiveMetadata(selectedOrderForActions) : null}
  />
)}

{/* OrderDetailsGateway (already exists) */}
<OrderDetailsGateway
  orderId={selectedOrderId}
  onClose={() => setSelectedOrderId(null)}
/>
```

### Phase 4: Import Required Utilities

Ensure all hubs have these imports:

```tsx
import { ActionModal } from '@cks/ui';
import { buildOrderActions } from '@cks/domain-widgets';
import { extractArchiveMetadata } from '../shared/utils/orderEnrichment';
```

**Note**: Some hubs may already have these imports for the Orders section.

---

## Verification Checklist

After implementation, verify each hub:

- [ ] **CrewHub**: Click activity → ActionModal opens → Click "View Details" → OrderDetailsModal opens
- [ ] **CenterHub**: Click activity → ActionModal opens → Click "View Details" → OrderDetailsModal opens
- [ ] **CustomerHub**: Click activity → ActionModal opens → Click "View Details" → OrderDetailsModal opens
- [ ] **ContractorHub**: Click activity → ActionModal opens → Click "View Details" → OrderDetailsModal opens
- [ ] **ManagerHub**: Click activity → ActionModal opens → Click "View Details" → OrderDetailsModal opens
- [ ] **WarehouseHub**: Click activity → ActionModal opens → Click "View Details" → OrderDetailsModal opens
- [ ] **AdminHub**: Continue to work as before (no changes needed)

---

## Files to Modify

1. `apps/frontend/src/hubs/CrewHub.tsx`
2. `apps/frontend/src/hubs/CenterHub.tsx`
3. `apps/frontend/src/hubs/CustomerHub.tsx`
4. `apps/frontend/src/hubs/ContractorHub.tsx`
5. `apps/frontend/src/hubs/ManagerHub.tsx`
6. `apps/frontend/src/hubs/WarehouseHub.tsx`

---

## Expected Outcome

**Before:**
- User clicks activity in non-admin hub → Nothing happens ❌

**After:**
- User clicks activity in any hub → ActionModal opens with order actions ✅
- User clicks "View Details" → OrderDetailsModal opens ✅
- User clicks action button (Cancel, Reject, etc.) → Action executes and modal closes ✅
- Consistent UX across all 7 hubs ✅

---

## Notes for GPT-5

1. **No need to modify AdminHub** - it already works correctly
2. **Pattern is identical** across all 6 non-admin hubs
3. **State variables** `selectedOrderId` already exist in all hubs (from OrderDetailsGateway implementation)
4. **ActionModal** is already imported in most hubs for the Orders section
5. **buildOrderActions** utility may already be imported in some hubs
6. **Follow the AdminHub pattern exactly** - it's the reference implementation
7. **Test incrementally** - do one hub first, verify it works, then batch the rest

---

## Success Criteria

✅ All 6 non-admin hubs have clickable activities that open modals
✅ ActivityFeed behavior is consistent across all 7 hubs
✅ No duplicate modal state or logic
✅ Build passes with no TypeScript errors
✅ User can navigate from activity → ActionModal → OrderDetailsModal seamlessly
