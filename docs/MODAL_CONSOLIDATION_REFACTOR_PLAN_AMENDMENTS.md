# Modal Consolidation Refactor - Critical Amendments

## Third-Party Review Findings (ChatGPT)

After external review, several critical issues and improvements were identified. This document captures what we'll incorporate and what we'll skip.

---

## CRITICAL FIXES (Must Address)

### 1. Fix archivedBy Mapping Bug ⚠️

**Current bug** (`AdminHub.tsx:1380-1381`):
```typescript
isArchived: state === 'archived',
archivedAt: deletedAt,      // ❌ WRONG - using deleted fields for archived
archivedBy: deletedBy,      // ❌ WRONG - using deleted fields for archived
```

**Root cause**:
- Entities API returns `{ entity, state, deletedAt, deletedBy }` for deleted entities
- For archived entities, it returns `{ entity, state }` where `entity` contains `archived_at`, `archived_by`, `archive_reason`, `deletion_scheduled`
- Current code incorrectly maps archived fields from deleted fields

**Fix** (in `useOrderDetails` hook):
```typescript
// For archived orders
if (state === 'archived') {
  archiveMetadata = {
    archivedBy: entity.archived_by || null,
    archivedAt: entity.archived_at || null,
    reason: entity.archive_reason || null,
    scheduledDeletion: entity.deletion_scheduled || null,
  };
}

// For deleted orders (separate path)
if (state === 'deleted') {
  // deletedBy and deletedAt come from the API response root, not entity
  orderData.isDeleted = true;
  orderData.deletedAt = deletedAt;  // From response root
  orderData.deletedBy = deletedBy;  // From response root
}
```

---

### 2. Snake_case to camelCase Normalization

**Issue**: Backend returns raw DB rows in snake_case, UI expects camelCase.

**Examples**:
- `archived_at` → `archivedAt`
- `archived_by` → `archivedBy`
- `archive_reason` → `archiveReason`
- `deletion_scheduled` → `scheduledDeletion`
- `requested_by` → `requestedBy`
- `order_type` → `orderType`

**Fix**: Create normalization utility in the hook:

```typescript
function normalizeOrder(entity: any): Order {
  return {
    orderId: entity.order_id || entity.id,
    orderType: entity.order_type,
    title: entity.title,
    requestedBy: entity.requested_by,
    destination: entity.destination || entity.center_id || entity.customer_id,
    requestedDate: entity.requested_date || entity.order_date,
    status: entity.status,
    notes: entity.notes,
    items: entity.items || [],  // May be empty if not joined
    // ... other fields
  };
}
```

---

### 3. Items Availability for Non-Admin Roles ⚠️ CRITICAL

**Problem**:
- Entities API endpoint does NOT join order items
- Only returns base order row from DB
- Admin has `fetchAdminOrderById` which includes items
- Non-admin roles have `useHubOrders(cksCode)` which returns lists

**Current state**:
- AdminHub: Has complex hydration logic to fetch full order when items missing
- Other hubs: Receive orders from `useHubOrders` which DOES include items (from list endpoint)

**Question**: Do current non-admin hubs already have items?

Let me check where `selectedOrderForDetails` gets set in ManagerHub...

Looking at ManagerHub: Orders come from `useHubOrders(managerCode)` → this endpoint DOES return items because it's a full order list.

**Solution** (Simple):
1. In `useOrderDetails` hook, check if `order.items` exists
2. If missing AND admin: call `fetchAdminOrderById(orderId)`
3. If missing AND non-admin: Items will be missing (rare case, since most orders come from directory which has items)
4. Modal handles gracefully: "Items not available" fallback

**We DON'T need** to create a new backend endpoint or complex fallback logic. The simple check is sufficient.

```typescript
export function useOrderDetails(orderId: string | null) {
  const { account } = useAuth();
  const [fullOrder, setFullOrder] = useState(null);

  // If items are missing and user is admin, fetch full order
  useEffect(() => {
    if (orderId && fullOrder && !fullOrder.items && account?.role === 'admin') {
      fetchAdminOrderById(orderId).then(order => {
        if (order?.items) {
          setFullOrder(prev => ({ ...prev, items: order.items }));
        }
      });
    }
  }, [orderId, fullOrder, account]);

  // ... rest of hook
}
```

---

## VALUABLE IMPROVEMENTS (Incorporate)

### 4. Clear Hook Interface

Define explicit return type for `useOrderDetails`:

```typescript
interface UseOrderDetailsReturn {
  // Order data (normalized to camelCase)
  order: {
    orderId: string;
    orderType: 'service' | 'product';
    title: string | null;
    requestedBy: string | null;
    destination: string | null;
    status: string | null;
    items?: OrderLineItem[];
    notes: string | null;
    // ... other fields
  } | null;

  // Enriched contact info
  requestorInfo: {
    name: string | null;         // Enriched: "CRW-006 - Wario"
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;

  destinationInfo: {
    name: string | null;         // Enriched: "CEN-010 - Downtown"
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;

  // Metadata
  availability: {
    tz: string | null;
    days: string[];
    window: { start: string; end: string } | null;
  } | null;

  cancellationInfo: {
    reason: string | null;
    cancelledBy: string | null;
    cancelledAt: string | null;
  } | null;

  archiveMetadata: {
    archivedBy: string | null;
    archivedAt: string | null;
    reason: string | null;
    scheduledDeletion: string | null;
  } | null;

  // State
  isLoading: boolean;
  error: Error | null;
}
```

---

### 5. Enrichment Strategy

**Current AdminHub approach**: Separate `useHubProfile` calls for requestor and destination.

**Better approach**: Use existing directory caches when available, fallback to profile fetch:

```typescript
// In useOrderDetails hook
function enrichEntityName(code: string | null): string | null {
  if (!code) return null;

  // Try directory caches first (already loaded in hubs)
  const { data: centers } = useCenters();
  const { data: customers } = useCustomers();
  const { data: contractors } = useContractors();
  const { data: warehouses } = useWarehouses();
  const { data: crew } = useCrew();

  // Find in caches
  const center = centers?.find(c => c.id === code);
  if (center) return `${code} - ${center.name}`;

  const customer = customers?.find(c => c.id === code);
  if (customer) return `${code} - ${customer.name}`;

  // ... check other caches

  // Fallback: just return code
  return code;
}
```

**But**: This couples the hook to directory data. Keep it simple for now, enrich later if needed.

**DECISION**: Start with basic enrichment (use metadata.contacts), optimize later.

---

## OPTIONAL / OVERKILL (Skip)

### ❌ Initial Data Seeding

**Suggestion**: Pass initial entity from ActivityFeed to avoid flicker.

**Skip because**:
- Adds complexity to hook signature
- SWR caching handles this naturally
- Loading states are fine for now
- Can optimize later if flicker is noticeable

---

### ❌ New Backend Endpoint

**Suggestion**: Create `/api/hub/order/:orderId` with RBAC for single order fetch.

**Skip because**:
- Not needed for this refactor
- Entities endpoint works fine
- Items issue is minor (orders usually have items from list data)
- Can add later if needed

---

### ❌ Deprecate OrderDetailsModal

**Suggestion**: Only use Product/ServiceOrderModal.

**Skip because**:
- OrderDetailsModal serves as fallback
- All three modals have specific purposes
- Not worth the risk

---

## Updated Implementation Plan

### Phase 1: Create useOrderDetails Hook

**Key changes from original plan**:

1. **Add snake_case → camelCase normalization**
2. **Fix archive metadata extraction** (use `entity.archived_by` not `deletedBy`)
3. **Handle missing items** (admin fallback to `fetchAdminOrderById`)
4. **Return clear interface** (as defined above)

**File**: `apps/frontend/src/hooks/useOrderDetails.ts` (~250 lines including normalization)

```typescript
export function useOrderDetails(orderId: string | null): UseOrderDetailsReturn {
  // 1. Fetch entity with state
  const entityResult = await fetchEntityForActivity('order', orderId);

  // 2. Normalize snake_case → camelCase
  const order = normalizeOrder(entityResult.entity);

  // 3. Check if items missing (admin only)
  if (!order.items && account.role === 'admin') {
    const fullOrder = await fetchAdminOrderById(orderId);
    order.items = fullOrder?.items || [];
  }

  // 4. Extract archive metadata (FIX BUG HERE)
  let archiveMetadata = null;
  if (entityResult.state === 'archived') {
    archiveMetadata = {
      archivedBy: entityResult.entity.archived_by,  // ✅ CORRECT
      archivedAt: entityResult.entity.archived_at,
      reason: entityResult.entity.archive_reason,
      scheduledDeletion: entityResult.entity.deletion_scheduled,
    };
  }

  // 5. Extract other metadata (availability, cancellation, etc.)
  const availability = extractAvailability(order.metadata);
  const cancellationInfo = extractCancellation(order.metadata);

  // 6. Build contact info (from metadata.contacts)
  const requestorInfo = {
    name: order.metadata?.contacts?.requestor?.name || order.requestedBy,
    address: order.metadata?.contacts?.requestor?.address,
    phone: order.metadata?.contacts?.requestor?.phone,
    email: order.metadata?.contacts?.requestor?.email,
  };

  const destinationInfo = {
    name: order.metadata?.contacts?.destination?.name || order.destination,
    address: order.metadata?.contacts?.destination?.address,
    phone: order.metadata?.contacts?.destination?.phone,
    email: order.metadata?.contacts?.destination?.email,
  };

  return {
    order,
    requestorInfo,
    destinationInfo,
    availability,
    cancellationInfo,
    archiveMetadata,
    isLoading,
    error,
  };
}
```

---

### Phase 2-5: No Changes

Rest of the plan remains the same:
- Phase 2: Update ActionModal with archiveMetadata prop
- Phase 3: Update Product/ServiceOrderModal with archiveMetadata prop
- Phase 4: Refactor ArchiveSection to use ActionModal
- Phase 5: Refactor all hubs to use useOrderDetails

---

## Testing Checklist (Updated)

### Archive Metadata Display

- [ ] **Archived order from Activity**: Shows correct `archivedBy` (not `deletedBy`)
- [ ] **Archived order from Archive tab**: Shows same metadata
- [ ] **Archive metadata fields**: All four fields populated (archivedBy, archivedAt, reason, scheduledDeletion)

### Items Availability

- [ ] **Admin - Active order**: Items shown
- [ ] **Admin - Archived order**: Items shown (fetched if missing)
- [ ] **Admin - Deleted order**: Items shown (from deletion snapshot)
- [ ] **Manager - Active order**: Items shown (from directory)
- [ ] **Manager - Deleted order**: Modal handles gracefully if items missing

### Field Normalization

- [ ] **All snake_case fields**: Converted to camelCase correctly
- [ ] **No undefined errors**: All fields default to null if missing

---

## Summary of Changes

### What We're Incorporating:
1. ✅ Fix archivedBy mapping bug (critical)
2. ✅ Add snake_case → camelCase normalization
3. ✅ Handle missing items for admin (simple fallback)
4. ✅ Clear hook interface
5. ✅ Correct archive field names

### What We're Skipping:
1. ❌ Initial data seeding (overkill)
2. ❌ New backend endpoint (not needed)
3. ❌ Complex enrichment strategy (keep simple)
4. ❌ Deprecate OrderDetailsModal (risky)

### Net Impact:
- Original estimate: ~12-15 hours
- With amendments: ~14-16 hours (add 2 hours for normalization + items handling)
- Still achieves all goals: consistency, reusability, maintainability, RBAC preservation

---

**Status**: Ready for final approval with critical fixes incorporated

---

## Status — 2025-10-16 (Session with GPT-5)

- All seven hubs now render order details via a shared OrderDetailsGateway component.
- useOrderDetails is fetch-first and consumes a single canonical DTO from /api/order/:id/details.
- ActivityFeed uses the same endpoint; legacy /entity/... is kept only as a fallback for deleted cases.
- Backend now writes rich metadata for cancel/reject (code, name, display, timestamps). Modals read and display these fields.

