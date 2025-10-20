# Entity Modal Architecture

## Vision: One Modal to Rule Them All

### Core Insight
**IDs already tell us what type of entity we're dealing with.** Instead of having separate OrderModal, ServiceModal, ReportModal, UserModal components, we should have ONE `EntityModal` that accepts any ID and figures out the rest.

```tsx
// Instead of this (current)
<OrderModal orderId="CRW-006-PO-110" />
<ServiceModal serviceId="SRV-001" />
<ReportModal reportId="RPT-017" />
<UserModal userId="CON-010" />

// We want this (target)
<EntityModal entityId="CRW-006-PO-110" /> // Order
<EntityModal entityId="SRV-001" />         // Service
<EntityModal entityId="RPT-017" />         // Report
<EntityModal entityId="CON-010" />         // User
<EntityModal entityId="PRO-055" />         // Procedure (future - just works!)
```

## Benefits

1. **Future-proof**: New entity types (procedures, training) just work - no hub wiring needed
2. **Zero duplication**: All hubs use same `<EntityModal entityId={id} />`
3. **Activity feed trivial**: Just pass ID from activity metadata
4. **Consistent UX**: All entities share BaseViewModal structure
5. **Backend-driven**: Server controls tabs, actions, RBAC
6. **One bug fix location**: No more updating 7 different modal implementations

## Architecture Principles

### Business Logic Location

**Backend (Source of Truth):**
- RBAC policies (who can do what)
- Available actions per role/entity state
- Action validation and authorization
- State transitions and workflows
- UI configuration (which tabs/fields to show)

**Frontend (Dumb Renderer):**
- Parse entity ID to determine type
- Fetch entity details from backend
- Render tabs/fields/actions based on backend response
- Call backend action endpoints
- Handle UI state (loading, errors, toasts)

### Backend Contract

All entity detail endpoints should return:

```typescript
// GET /entity/{entityId}/details
{
  id: "CRW-006-PO-110",
  type: "order",

  // Entity-specific data
  data: {
    title: "Product Order",
    status: "pending",
    requestedBy: "CRW-006",
    // ... all entity fields
  },

  // UI configuration (tells frontend what to render)
  ui: {
    tabs: [
      { id: "details", label: "Details" },
      { id: "workflow", label: "Workflow" }
    ],
    fields: {
      crew: { visible: false },              // Hide crew section
      cancellationReason: {
        visible: true,
        value: "Customer cancelled"
      }
    },
    actions: [
      {
        id: "accept",
        label: "Accept Order",
        variant: "primary",
        enabled: true
      },
      {
        id: "reject",
        label: "Reject",
        variant: "danger",
        enabled: true
      }
    ]
  },

  // Permissions for this specific entity + user role
  permissions: {
    canEdit: false,
    canDelete: true,
    canArchive: true,
    canViewWorkflow: true
  }
}
```

### Frontend Implementation

#### 1. ID Parsing

```typescript
// utils/parseEntityId.ts
export function parseEntityId(id: string): { type: string; id: string } {
  // Order IDs: contain -PO- or -SO-
  if (id.includes('-PO-') || id.includes('-SO-')) {
    return { type: 'order', id };
  }

  // Service IDs: SRV-###
  if (id.startsWith('SRV-')) {
    return { type: 'service', id };
  }

  // Report/Feedback IDs: RPT-### or FBK-### or ###-RPT-### or ###-FBK-###
  if (id.includes('-RPT-') || id.includes('-FBK-') ||
      id.startsWith('RPT-') || id.startsWith('FBK-')) {
    return { type: 'report', id };
  }

  // Procedure IDs: PRO-###
  if (id.startsWith('PRO-')) {
    return { type: 'procedure', id };
  }

  // Training IDs: TRN-###
  if (id.startsWith('TRN-')) {
    return { type: 'training', id };
  }

  // User IDs: MGR-, CON-, CUS-, CEN-, CRW-, WAR-, ADM-
  const userPrefixes = ['MGR-', 'CON-', 'CUS-', 'CEN-', 'CRW-', 'WAR-', 'ADM-'];
  if (userPrefixes.some(prefix => id.startsWith(prefix))) {
    return { type: 'user', id };
  }

  // Product catalog IDs: PROD-###
  if (id.startsWith('PROD-')) {
    return { type: 'product', id };
  }

  // Fallback
  return { type: 'unknown', id };
}
```

#### 2. Unified Fetch Hook

```typescript
// hooks/useEntityDetails.ts
export function useEntityDetails(entityId: string | null) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!entityId) return;

    const fetchEntity = async () => {
      setIsLoading(true);
      try {
        // Universal endpoint
        const response = await apiFetch(`/entity/${entityId}/details`);
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntity();
  }, [entityId]);

  return { data, isLoading, error };
}
```

#### 3. Centralized Action Handler

```typescript
// hooks/useEntityActions.ts
export function useEntityActions() {
  const handleAction = async (entityId: string, actionId: string) => {
    try {
      const response = await apiFetch(`/entity/${entityId}/action`, {
        method: 'POST',
        body: { action: actionId }
      });

      if (response.success) {
        toast.success(response.message || 'Action completed');
        // Invalidate entity cache
        mutate(key => typeof key === 'string' && key.includes(entityId));
        return true;
      } else {
        toast.error(response.error || 'Action failed');
        return false;
      }
    } catch (err) {
      toast.error('Failed to perform action');
      return false;
    }
  };

  return { handleAction };
}
```

#### 4. Entity Modal Component

```tsx
// components/EntityModal.tsx
export function EntityModal({
  entityId,
  isOpen,
  onClose
}: EntityModalProps) {
  const { data, isLoading, error } = useEntityDetails(entityId);
  const { handleAction } = useEntityActions();

  if (!isOpen || !entityId) return null;
  if (isLoading) return <LoadingModal />;
  if (error) return <ErrorModal error={error} onClose={onClose} />;
  if (!data) return null;

  // Build tabs from backend config
  const tabs = data.ui.tabs.map(tab => ({
    id: tab.id,
    label: tab.label
  }));

  // Build card based on entity type
  const card = (
    <EntityCard
      entityId={data.id}
      type={data.type}
      data={data.data}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  // Build actions from backend config
  const actions = data.ui.actions
    .filter(action => action.enabled)
    .map(action => ({
      label: action.label,
      variant: action.variant,
      onClick: () => handleAction(entityId, action.id)
    }));

  return (
    <BaseViewModal
      isOpen={isOpen}
      onClose={onClose}
      card={card}
      actions={actions}
    >
      <TabContent
        type={data.type}
        tab={activeTab}
        data={data.data}
        fields={data.ui.fields}
      />
    </BaseViewModal>
  );
}
```

#### 5. Activity Feed Integration

```tsx
// Activity feed becomes trivial
<ActivityFeed
  activities={activities}
  onActivityClick={(activity) => {
    // Just grab the ID from activity metadata
    const entityId = activity.metadata.targetId;
    setSelectedEntityId(entityId);
  }}
/>

// One modal handles everything
<EntityModal
  entityId={selectedEntityId}
  isOpen={!!selectedEntityId}
  onClose={() => setSelectedEntityId(null)}
/>
```

## Migration Strategy

**CRITICAL: Don't break what works!** Migrate incrementally.

### Phase 1: Foundation (3-4 hours)
**Goal:** Prove the concept without touching existing code

1. Create `parseEntityId()` utility
2. Write tests for ID detection
3. Create `useEntityDetails()` hook (wraps existing endpoints)
4. Create `useEntityActions()` hook (wraps existing action handlers)

**Deliverable:** Utilities tested and working, existing modals untouched

### Phase 2: Wrapper Pattern (4-5 hours)
**Goal:** Centralize without breaking existing modals

```tsx
// EntityModal delegates to existing modals
function EntityModal({ entityId, isOpen, onClose }) {
  const { type } = parseEntityId(entityId);
  const { handleAction } = useEntityActions(); // Centralized!

  // Route to existing modals
  if (type === 'order') {
    return <ActivityModalGateway
      orderId={entityId}
      isOpen={isOpen}
      onClose={onClose}
      onAction={handleAction} // Same interface
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
```

**Deliverable:** Hubs can use EntityModal OR existing modals, actions centralized

### Phase 3: Backend Contract (8-10 hours + backend work)
**Goal:** Add UI config to backend responses

1. Update backend endpoints to include `ui` object (backwards compatible)
2. Start with ONE entity type (orders)
3. Frontend reads `ui.actions` and `ui.tabs` if present
4. Fallback to hardcoded UI if `ui` not present

**Deliverable:** Orders return UI config, modal renders dynamically

### Phase 4: Full Migration (12-15 hours)
**Goal:** All entity types use unified system

1. Migrate each entity type to backend UI config
2. Remove hardcoded modal logic
3. Delete old modal components
4. Update all 7 hubs to use EntityModal only

**Deliverable:** ONE modal component, backend-driven UI

## Current State Analysis

### How Orders Work Today

**Files Involved:**
- `packages/ui/src/modals/OrderDetailsModal/OrderDetailsModal.tsx` - Old view-only modal
- `apps/frontend/src/components/ActivityModalGateway.tsx` - Gateway that wraps ActivityModal
- `apps/frontend/src/hooks/useOrderDetails.ts` - Fetches order details
- `packages/ui/src/modals/ActivityModal/ActivityModal.tsx` - Modern modal with actions
- `apps/frontend/src/shared/api/orderDetails.ts` - API call to `/order/:id/details`

**Flow:**
1. User clicks order in activity feed or orders section
2. Hub sets `selectedOrderId`
3. `<ActivityModalGateway>` receives orderId
4. Gateway calls `useOrderDetails(orderId)` hook
5. Hook fetches `/order/${orderId}/details?includeDeleted=1` (5 second delay!)
6. Hook normalizes backend response
7. Gateway builds actions array from `availableActions`
8. Gateway renders `<ActivityModal>` with data
9. User clicks action → Hub's `handleOrderAction()`
10. Action handler calls backend → refreshes data

**Problems:**
- Fetch on every click (slow)
- Action handlers duplicated in 7 hubs
- Modal logic split between Gateway, hooks, and modal component
- Different modals for different hub contexts (admin vs user)

**What Works:**
- RBAC works (backend returns role-appropriate actions)
- State transitions work (backend validates)
- Workflow display works

## Open Questions

1. **Backend availability:** Can backend team add UI config to entity endpoints?
2. **Timeline:** When do we need this? (20-30 hours total for full migration)
3. **Breaking changes:** Can we modify backend contract or need backwards compatibility?
4. **Order of migration:** Start with orders (most complex) or reports (simpler)?
5. **Performance:** Should Phase 1 include prefetch/caching strategy?

## Success Metrics

- **Lines of code:** Should reduce modal code by 60-70%
- **Hub wiring:** Each hub should have <10 lines of modal code (down from ~200)
- **Time to add entity type:** <1 hour (vs current ~8 hours)
- **Modal open time:** <500ms (vs current 5 seconds for orders)
- **Bugs per modal change:** Near zero (single source of truth)

## Next Steps

1. ✅ Document architecture (this file)
2. ⏳ Analyze current order implementation in detail
3. ⏳ Create `parseEntityId()` utility + tests
4. ⏳ Build wrapper EntityModal (Phase 2)
5. ⏳ Coordinate with backend on UI config contract
6. ⏳ Migrate one entity type (proof of concept)
7. ⏳ Roll out to all hubs

---

**Document Status:** Draft
**Last Updated:** 2025-10-19
**Authors:** Claude (AI) + Freedom (Product Vision)
