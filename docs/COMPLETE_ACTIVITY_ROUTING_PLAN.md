# Complete Activity Routing Implementation Plan
**End-to-End: Active → Archived → Deleted with Navigation**

## Overview
Implement full activity click routing that:
1. **Active/Pending data** → Navigate to appropriate tab and open/highlight entity
2. **Archived data** → Navigate to Archive tab and open/highlight entity
3. **Deleted data** → Open modal with deleted banner (fallback only)

---

## Routing Logic Priority

```
User clicks activity
    ↓
Fetch entity with state (active/archived/deleted)
    ↓
┌─────────────────────────┐
│ state === 'active'?     │ → Navigate to main section + open modal
├─────────────────────────┤
│ state === 'archived'?   │ → Navigate to Archive tab + open modal
├─────────────────────────┤
│ state === 'deleted'?    │ → Open tombstone modal (no navigation)
└─────────────────────────┘
```

---

## Current Navigation Pattern (CKS Catalog Example)

**From:** `apps/frontend/src/pages/CKSCatalog.tsx:908`
```typescript
navigate('/hub', { state: { openTab: 'orders' } });
```

**To:** `apps/frontend/src/components/MyHubSection.tsx:24-29`
```typescript
useEffect(() => {
  const tabFromState = (location.state as any)?.openTab;
  if (tabFromState && onTabClick) {
    onTabClick(tabFromState);
  }
}, [location.state, onTabClick]);
```

**Result:** User redirected to `/hub` with Orders tab opened

---

## Implementation Steps

### Step 1: Backend - Add State to Entity Fetch (UPDATED)

**File:** `apps/backend/server/domains/entities/service.ts`

Same as previous plan, but now we rely on the `state` field more heavily for frontend routing decisions.

```typescript
export async function getEntityWithFallback(
  entityType: string,
  entityId: string,
  includeDeleted: boolean
): Promise<EntityResult> {
  // ... (same as before) ...

  // Returns:
  // { entity, state: 'active' } → Navigate to main tab
  // { entity, state: 'archived' } → Navigate to archive tab
  // { entity, state: 'deleted', deletedAt, deletedBy } → Open tombstone modal
}
```

---

### Step 2: Frontend - Create Smart Activity Router (UPDATED)

**New file:** `apps/frontend/src/shared/utils/activityRouter.ts`

```typescript
import { fetchEntityForActivity } from '../api/entities';

interface EntityWithState {
  entity: any;
  state: 'active' | 'archived' | 'deleted';
  deletedAt?: string;
  deletedBy?: string;
}

interface ActivityRouterConfig {
  // Tab navigation
  setActiveTab: (tab: string) => void;
  setOrdersSubTab?: (subTab: 'all' | 'service' | 'product' | 'archive') => void;
  setServicesSubTab?: (subTab: 'my' | 'active' | 'history') => void;

  // Modal state setters
  setSelectedOrder?: (order: any) => void;
  setSelectedService?: (service: any) => void;
  setSelectedUser?: (user: any) => void;

  // Error handling
  onError: (message: string) => void;
}

export function createActivityClickHandler(config: ActivityRouterConfig) {
  return async (activity: { metadata: { targetId?: string; targetType?: string } }) => {
    const { targetId, targetType } = activity.metadata;

    if (!targetId || !targetType) {
      config.onError('Cannot open: missing target information');
      return;
    }

    try {
      // Fetch entity with state
      const result: EntityWithState = await fetchEntityForActivity(targetType, targetId);

      // Route based on entity type and state
      switch (targetType) {
        case 'order':
          handleOrderRouting(result, config);
          break;
        case 'service':
          handleServiceRouting(result, config);
          break;
        case 'manager':
        case 'contractor':
        case 'customer':
        case 'center':
        case 'crew':
        case 'warehouse':
          handleUserRouting(result, config);
          break;
        default:
          config.onError(`Unknown entity type: ${targetType}`);
      }
    } catch (error) {
      config.onError('Could not load data');
    }
  };
}

// Route orders based on state
function handleOrderRouting(result: EntityWithState, config: ActivityRouterConfig) {
  const { entity, state, deletedAt, deletedBy } = result;

  if (state === 'active') {
    // Navigate to Orders tab → open modal
    config.setActiveTab('orders');

    // Determine sub-tab based on order type
    if (config.setOrdersSubTab) {
      if (entity.order_type === 'service') {
        config.setOrdersSubTab('service');
      } else if (entity.order_type === 'product') {
        config.setOrdersSubTab('product');
      } else {
        config.setOrdersSubTab('all');
      }
    }

    // Open modal after slight delay to allow tab switch
    setTimeout(() => {
      if (config.setSelectedOrder) {
        config.setSelectedOrder({ ...entity, isDeleted: false });
      }
    }, 100);
  }
  else if (state === 'archived') {
    // Navigate to Orders tab → Archive sub-tab → open modal
    config.setActiveTab('orders');

    if (config.setOrdersSubTab) {
      config.setOrdersSubTab('archive');
    }

    setTimeout(() => {
      if (config.setSelectedOrder) {
        config.setSelectedOrder({ ...entity, isDeleted: false, isArchived: true });
      }
    }, 100);
  }
  else if (state === 'deleted') {
    // Just open tombstone modal (no navigation)
    if (config.setSelectedOrder) {
      config.setSelectedOrder({
        ...entity,
        isDeleted: true,
        deletedAt,
        deletedBy
      });
    }
  }
}

// Route services based on state
function handleServiceRouting(result: EntityWithState, config: ActivityRouterConfig) {
  const { entity, state, deletedAt, deletedBy } = result;

  if (state === 'active') {
    config.setActiveTab('services');

    if (config.setServicesSubTab) {
      config.setServicesSubTab('active');
    }

    setTimeout(() => {
      if (config.setSelectedService) {
        config.setSelectedService({ ...entity, isDeleted: false });
      }
    }, 100);
  }
  else if (state === 'archived') {
    config.setActiveTab('services');

    if (config.setServicesSubTab) {
      config.setServicesSubTab('history');  // Archived services show in history?
    }

    setTimeout(() => {
      if (config.setSelectedService) {
        config.setSelectedService({ ...entity, isDeleted: false, isArchived: true });
      }
    }, 100);
  }
  else if (state === 'deleted') {
    if (config.setSelectedService) {
      config.setSelectedService({
        ...entity,
        isDeleted: true,
        deletedAt,
        deletedBy
      });
    }
  }
}

// Route users (managers, contractors, etc.) based on state
function handleUserRouting(result: EntityWithState, config: ActivityRouterConfig) {
  const { entity, state, deletedAt, deletedBy } = result;

  // User entities typically just open modals (no specific tab navigation)
  if (config.setSelectedUser) {
    config.setSelectedUser({
      ...entity,
      isDeleted: state === 'deleted',
      isArchived: state === 'archived',
      deletedAt,
      deletedBy
    });
  }
}
```

---

### Step 3: Frontend - Update Hubs to Use Router (UPDATED)

**Example:** `apps/frontend/src/hubs/CrewHub.tsx`

```typescript
import { createActivityClickHandler } from '../shared/utils/activityRouter';
import { DeletedBanner } from '@cks/domain-widgets';

export default function CrewHub({ initialTab = 'dashboard' }: CrewHubProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Orders state
  const [ordersTab, setOrdersTab] = useState<'all' | 'service' | 'product' | 'archive'>('all');
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any | null>(null);

  // Services state
  const [servicesTab, setServicesTab] = useState<'my' | 'active' | 'history'>('active');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Create activity click handler with all navigation hooks
  const handleActivityClick = createActivityClickHandler({
    setActiveTab,
    setOrdersSubTab: setOrdersTab,
    setServicesSubTab: setServicesTab,
    setSelectedOrder: setSelectedOrderForDetails,
    setSelectedService: (service) => setSelectedServiceId(service.service_id),
    setSelectedUser: (user) => {
      // Handle user entity modals if needed
      console.log('User clicked:', user);
    },
    onError: (message) => toast.error(message)
  });

  // Pass to RecentActivity
  return (
    <>
      <MyHubSection
        hubName="Crew Hub"
        tabs={TABS}
        activeTab={activeTab}
        onTabClick={setActiveTab}
        userId={crewCode}
        welcomeName={profile?.name}
        role="crew"
      />

      {activeTab === 'dashboard' && (
        <>
          {/* ... */}

          <RecentActivity
            activities={formattedActivities.map(a => ({
              ...a,
              onClick: () => handleActivityClick(a)  // ← Wire up onClick
            }))}
            isLoading={activitiesLoading}
            error={activitiesError}
            emptyMessage={activityEmptyMessage}
          />
        </>
      )}

      {activeTab === 'orders' && (
        <OrdersSection
          activeSubTab={ordersTab}
          onSubTabChange={setOrdersTab}
          // ... other props
        />
      )}

      {/* Order Details Modal with Deleted Banner */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
        >
          {selectedOrderForDetails.isDeleted && (
            <DeletedBanner
              deletedAt={selectedOrderForDetails.deletedAt}
              deletedBy={selectedOrderForDetails.deletedBy}
            />
          )}
        </OrderDetailsModal>
      )}
    </>
  );
}
```

---

### Step 4: Frontend - Update OrdersSection to Support activeSubTab Prop

**Check:** Does `OrdersSection` already accept an `activeSubTab` prop to programmatically switch tabs?

If NOT, update:

**File:** `packages/domain-widgets/src/OrdersSection/OrdersSection.tsx`

```typescript
interface OrdersSectionProps {
  activeSubTab?: 'all' | 'service' | 'product' | 'archive';  // NEW
  onSubTabChange?: (tab: 'all' | 'service' | 'product' | 'archive') => void;  // NEW
  // ... existing props
}

export function OrdersSection({
  activeSubTab: externalActiveTab,
  onSubTabChange,
  // ...
}: OrdersSectionProps) {
  // Use external tab if provided, otherwise use internal state
  const [internalTab, setInternalTab] = useState<'all' | 'service' | 'product' | 'archive'>('all');

  const activeTab = externalActiveTab ?? internalTab;
  const setActiveTab = onSubTabChange ?? setInternalTab;

  // ... rest of component
}
```

---

### Step 5: Frontend - Update Modals to Show Deleted/Archived Banners

**Example:** Order Details Modal

```typescript
function OrderDetailsModal({ order, onClose }: { order: any; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      {/* Deleted Banner */}
      {order.isDeleted && (
        <DeletedBanner
          deletedAt={order.deletedAt}
          deletedBy={order.deletedBy}
        />
      )}

      {/* Archived Badge (optional - if not already shown) */}
      {order.isArchived && !order.isDeleted && (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: 8,
          borderRadius: 4,
          marginBottom: 12,
          color: '#6b7280',
          fontSize: 13
        }}>
          📦 Archived
        </div>
      )}

      {/* Existing modal content */}
      <h2>Order Details</h2>
      {/* ... */}
    </Modal>
  );
}
```

---

## Complete User Flow Examples

### Example 1: Click "Product order CRW-006-PO-105 created" (Active)
```
1. User clicks activity in Dashboard
2. Backend returns: { entity: {...}, state: 'active' }
3. Router calls: setActiveTab('orders')
4. Router calls: setOrdersSubTab('product')
5. Router calls: setSelectedOrder({ ...entity, isDeleted: false })
6. UI: Navigates to Orders tab → Product Orders → Opens modal
```

### Example 2: Click "Product order CEN-010-PO-106 archived" (Archived)
```
1. User clicks activity in Dashboard
2. Backend returns: { entity: {...}, state: 'archived' }
3. Router calls: setActiveTab('orders')
4. Router calls: setOrdersSubTab('archive')
5. Router calls: setSelectedOrder({ ...entity, isArchived: true })
6. UI: Navigates to Orders tab → Archive → Opens modal (greyed)
```

### Example 3: Click "Product order MGR-004-PO-999 created" (Deleted)
```
1. User clicks activity in Dashboard
2. Backend returns: { entity: {...snapshot...}, state: 'deleted', deletedBy: 'ADMIN', deletedAt: '2025-10-14' }
3. Router calls: setSelectedOrder({ ...entity, isDeleted: true, deletedBy, deletedAt })
4. UI: Stays on Dashboard → Opens tombstone modal with red banner
```

---

## Implementation Order

1. ✅ **Backend: Update `hardDeleteEntity()`** to store snapshot
2. ✅ **Backend: Create `/api/entity/:type/:id`** endpoint
3. ✅ **Frontend: Create `DeletedBanner`** component
4. ✅ **Frontend: Create `activityRouter.ts`** with smart routing logic
5. ✅ **Frontend: Update `ActivityItem`** to accept onClick
6. ✅ **Frontend: Update `RecentActivity`** to pass onClick
7. ✅ **Frontend: Update `OrdersSection`** to accept activeSubTab prop (if needed)
8. ✅ **Frontend: Update all Hubs** to wire up router with all nav hooks
9. ✅ **Frontend: Update all modals** to show deleted/archived banners

---

## Testing Checklist

### Active Data
- [ ] Click "Product order created" → Navigates to Orders → Product Orders → Opens modal
- [ ] Click "Service order created" → Navigates to Orders → Service Orders → Opens modal
- [ ] Click "Service assigned" → Navigates to Services → Active Services → Opens modal

### Archived Data
- [ ] Click "Product order created" (archived) → Navigates to Orders → Archive → Opens modal (greyed)
- [ ] Click "Service order created" (archived) → Navigates to Orders → Archive → Opens modal

### Deleted Data
- [ ] Click "Product order created" (deleted) → Stays on current tab → Opens tombstone modal with red banner
- [ ] Click "Service order created" (deleted) → Opens tombstone modal
- [ ] Tombstone modal shows full order details + deletion info

### Cross-Hub Testing
- [ ] Test activity clicks in CrewHub, ManagerHub, ContractorHub, etc.
- [ ] Verify all entity types route correctly

---

## Estimated Effort (UPDATED)
- Backend: ~2 hours (same as before)
- Frontend Router: ~3 hours (routing logic + nav hooks)
- Frontend Hubs Integration: ~4 hours (wire up all hubs)
- Testing: ~2 hours (all states + all entity types)
- **Total: ~11 hours**

---

## Notes

- Navigation uses `setTimeout(100ms)` to allow tab switch animation before opening modal
- Archive section might need updates if it doesn't already show archived orders properly
- Consider adding scroll-to or highlight animation when navigating to specific order
- Privacy/GDPR: Redact PII from user entity tombstones
