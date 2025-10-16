# Modal Consolidation Refactor Plan

## Problem Statement

**Symptom**: Simple changes to activity/modal functionality are difficult and don't work consistently across the codebase.

**Root Cause**: Multiple implementations of the same UI patterns with inconsistent data structures and scattered business logic.

---

## Current Issues (Evidence)

### Issue 1: Three Different Views for Same Order

**Same order (CRW-006-PO-107) displays differently depending on where it's opened:**

1. **From Activity Feed** (Incomplete):
   - ❌ No order ID in header (shows "Product Order Details" with no ID)
   - ❌ No requestor details (address, phone, email show "—")
   - ❌ No product items table
   - ❌ No entity names (just codes like "CRW-006")

2. **From Admin Directory** (More Complete):
   - ✅ Order ID in header
   - ✅ Requestor details present
   - ✅ Product items table shown
   - ❌ Still no entity names (just "CRW-006" not "CRW-006 - Wario")

3. **From Other User Hubs** (Most Complete):
   - ✅ Order ID in header
   - ✅ Requestor details present
   - ✅ Product items table shown
   - ✅ Entity names enriched ("CRW-006 - Wario", "CEN-010 - Downtown")

**Why**: Each code path prepares order data differently with different enrichment logic.

---

### Issue 2: Two Different Archived Order Modals

**Same archived order shows different UX depending on source:**

1. **From Archive Section** (`ArchiveSection.tsx` lines 461-549):
   ```
   Archived Order
   ID: CEN-010-PO-106
   Name: CEN-010-PO-106
   Archived by: ADMIN
   Archived on: Oct 15, 2025, 12:40 AM
   Reason: Manual archive
   Scheduled for deletion: Nov 13, 2025, 08:40 PM

   [Custom styled buttons - NOT using Button component]
   📄 View Order Details
   ✓ Restore to Unassigned
   🔗 View Relationships
   ⚠️ Permanently Delete
   Cancel
   ```

2. **From Activity Feed** (Uses `ActionModal` component):
   ```
   Archived Order

   [Uses Button component]
   📄 View Order Details
   ✓ Restore to Unassigned
   🔗 View Relationships
   ⚠️ Permanently Delete
   Cancel
   ```
   - ❌ No archive metadata (Archived by, Archived on, Reason, Scheduled deletion)
   - ✅ Uses proper Button component

**Why**: Two completely separate modal implementations for the same entity state.

---

### Issue 3: Scattered Data Enrichment Logic

**Order data enrichment happens in multiple places:**

1. **AdminHub.tsx** (lines 248-274, 350-430, 1893-2065):
   - Fetches requestor profile with `useHubProfile`
   - Fetches destination profile with `useHubProfile`
   - Hydrates missing order fields from cache
   - Fetches full order if items missing
   - Massive transformation logic (~170 lines)

2. **handleOrderActions** (lines 1342-1386):
   - Different enrichment path for activity clicks
   - Fetches full order if items missing
   - Different data structure preparation

3. **Each Hub File** has similar logic duplicated:
   - ManagerHub.tsx
   - CenterHub.tsx
   - ContractorHub.tsx
   - CustomerHub.tsx
   - CrewHub.tsx
   - WarehouseHub.tsx

**Why**: No centralized data preparation layer, every hub reinvents the wheel.

---

## Component Inventory

### Order Detail Modals (packages/ui)
1. `OrderDetailsModal.tsx` - Generic order details
2. `ProductOrderModal.tsx` - Product-specific order details
3. `ServiceOrderModal.tsx` - Service-specific order details

**All three** expect same props structure:
```typescript
{
  order: {
    orderId: string;
    title: string | null;
    requestedBy: string | null;
    destination: string | null;
    status: string | null;
    items?: OrderLineItem[];
    isDeleted?: boolean;
    deletedAt?: string;
    deletedBy?: string;
  };
  requestorInfo?: {
    name: string | null;     // Should include entity name like "CRW-006 - Wario"
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  destinationInfo?: {
    name: string | null;     // Should include entity name like "CEN-010 - Downtown"
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  availability?: { ... };
  cancellationReason?: string | null;
  ...
}
```

**Problem**: The `requestorInfo.name` and `destinationInfo.name` are inconsistently enriched:
- Activity feed path: Missing enrichment
- Directory path (admin): Partial enrichment
- Directory path (other users): Full enrichment

---

### Action Modals

1. **ActionModal** (`packages/ui/src/modals/ActionModal/ActionModal.tsx`):
   - Generic, reusable
   - Uses Button component
   - Accepts `actions` array
   - NO archive metadata display

2. **Custom Archive Modal** (`packages/domain-widgets/src/admin/ArchiveSection.tsx`):
   - Inline styled buttons (not using Button component)
   - Shows archive metadata
   - NOT reusable
   - Duplicates ActionModal functionality

---

## Architecture Problems

### 1. Hub Files Too Heavy

All 7 hub files contain massive amounts of duplicated modal enrichment logic:

| Hub | Lines | Modal Logic Pattern | Enrichment Source |
|-----|-------|-------------------|-------------------|
| **AdminHub.tsx** | 2,148 | `commonOrder` + `useHubProfile` hooks + hydration cache | Fetches requestor/destination profiles separately + cache fallback |
| **ManagerHub.tsx** | 1,612 | `commonOrder` + metadata extraction | Gets enrichment from `metadata.contacts` directly |
| **WarehouseHub.tsx** | 1,437 | `commonOrder` + metadata extraction | Gets enrichment from `metadata.contacts` directly |
| **ContractorHub.tsx** | 1,106 | `commonOrder` + metadata extraction | Gets enrichment from `metadata.contacts` directly |
| **CrewHub.tsx** | 971 | `commonOrder` + metadata extraction | Gets enrichment from `metadata.contacts` directly |
| **CustomerHub.tsx** | 917 | `commonOrder` + metadata extraction | Gets enrichment from `metadata.contacts` directly |
| **CenterHub.tsx** | 908 | `commonOrder` + metadata extraction | Gets enrichment from `metadata.contacts` directly |

**All hubs contain**:
- ~80-120 lines of `commonOrder`/`commonRequestorInfo`/`commonDestinationInfo` transformation logic
- Identical modal rendering code (~100 lines)
- Same pattern repeated 7 times

**AdminHub is unique** with:
- Additional ~200 lines for `useHubProfile` fetching
- ~100 lines for hydration/caching logic
- ~400 total lines of enrichment (vs ~100 in other hubs)

**Total**: ~1,000+ lines of duplicated modal logic across all hubs

**Result**: Hard to change, easy to introduce bugs, not maintainable.

---

### 2. No Centralized Data Layer

**Current flow**:
```
Activity Click → handleOrderActions (hub) → Fetch & enrich data → Set modal state → Open modal
Directory Click → Different enrichment logic → Set modal state → Open modal
Archive Click → Yet another enrichment logic → Set modal state → Open modal
```

**Should be**:
```
Any Click → useOrderDetails(orderId) → Centralized fetch & enrich → Modal receives consistent data
```

---

### 3. Modals Are Data-Dumb But Require Smart Data

**Modals expect**:
- Enriched entity names ("CRW-006 - Wario" not just "CRW-006")
- Complete contact info
- Full order with items
- Archive metadata (when applicable)

**But**:
- Each caller prepares this data differently
- No contract for what "complete data" means
- Easy to miss enrichment steps

---

## Proposed Solution

### Phase 1: Create Centralized Data Enrichment Hook

**New file**: `apps/frontend/src/hooks/useOrderDetails.ts`

```typescript
export function useOrderDetails(orderId: string | null) {
  // Centralized logic to:
  // 1. Fetch full order with items
  // 2. Fetch entity state (active/archived/deleted)
  // 3. Fetch requestor profile
  // 4. Fetch destination profile
  // 5. Enrich entity names ("CRW-006" → "CRW-006 - Wario")
  // 6. Extract metadata (availability, cancellation, etc.)
  // 7. Return consistent structure ready for modals

  return {
    order: enrichedOrder,
    requestorInfo: enrichedRequestorInfo,
    destinationInfo: enrichedDestinationInfo,
    availability: extractedAvailability,
    archiveMetadata: { archivedBy, archivedAt, reason, scheduledDeletion },
    isLoading,
    error
  };
}
```

**Benefits**:
- Single source of truth for data preparation
- Reusable across all hubs
- Consistent enrichment logic
- Easy to test in isolation
- Hub files become thin pass-through layers

---

### Phase 2: Consolidate Archived Order Action Modal

**Update ActionModal** (`packages/ui/src/modals/ActionModal/ActionModal.tsx`):

Add optional archive metadata display:

```typescript
export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity?: Entity;
  title?: string;
  actions?: ActionItem[];

  // NEW: Archive metadata
  archiveMetadata?: {
    archivedBy: string;
    archivedAt: string;
    reason?: string;
    scheduledDeletion?: string;
  };
}
```

**Update component to show metadata when present**:
```tsx
{archiveMetadata && (
  <div style={{ marginBottom: '20px', ... }}>
    <p>Archived by: {archiveMetadata.archivedBy}</p>
    <p>Archived on: {formatDate(archiveMetadata.archivedAt)}</p>
    {archiveMetadata.reason && <p>Reason: {archiveMetadata.reason}</p>}
    {archiveMetadata.scheduledDeletion && (
      <p style={{ color: '#ef4444' }}>
        Scheduled for deletion: {formatDate(archiveMetadata.scheduledDeletion)}
      </p>
    )}
  </div>
)}
```

**Remove custom modal from ArchiveSection**, use unified ActionModal instead.

---

### Phase 3: Add Archive Metadata to Order Details Modal

**Update ProductOrderModal** to optionally show archive info:

```typescript
export interface ProductOrderModalProps {
  // ... existing props
  archiveMetadata?: {
    archivedBy: string;
    archivedAt: string;
    reason?: string;
    scheduledDeletion?: string;
  };
}
```

**Display archive info banner** when viewing archived orders:
```tsx
{archiveMetadata && (
  <div className={styles.archiveBanner}>
    <h4>Archive Information</h4>
    <p>Archived by: {archiveMetadata.archivedBy}</p>
    <p>Archived on: {formatDate(archiveMetadata.archivedAt)}</p>
    ...
  </div>
)}
```

---

### Phase 4: Simplify Hub Files

**AdminHub becomes**:
```tsx
const AdminHub = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showArchiveActions, setShowArchiveActions] = useState(false);

  // Centralized data fetching
  const orderDetails = useOrderDetails(selectedOrderId);

  // Activity click handler (simple)
  const handleOrderClick = (orderId: string, isArchived: boolean) => {
    setSelectedOrderId(orderId);
    if (isArchived) {
      setShowArchiveActions(true);
    } else {
      // Open details modal directly
    }
  };

  return (
    <>
      <ActivityFeed onOrderClick={handleOrderClick} />

      {/* Archive Actions Modal */}
      {showArchiveActions && orderDetails && (
        <ActionModal
          isOpen={true}
          onClose={() => setShowArchiveActions(false)}
          entity={{ orderId: selectedOrderId }}
          archiveMetadata={orderDetails.archiveMetadata}
          actions={archivedOrderActions}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrderId && !showArchiveActions && orderDetails && (
        <ProductOrderModal
          isOpen={true}
          onClose={() => setSelectedOrderId(null)}
          order={orderDetails.order}
          requestorInfo={orderDetails.requestorInfo}
          destinationInfo={orderDetails.destinationInfo}
          availability={orderDetails.availability}
          archiveMetadata={orderDetails.archiveMetadata}
          {...orderDetails.cancellationInfo}
        />
      )}
    </>
  );
};
```

**Result**: ~90% reduction in hub code related to modals.

---

## Implementation Steps

### Step 1: Create useOrderDetails Hook
1. Extract common enrichment logic from AdminHub
2. Consolidate profile fetching
3. Add entity name enrichment (fetch from directory data)
4. Return consistent data structure
5. Test with AdminHub first

### Step 2: Update ActionModal
1. Add archiveMetadata prop
2. Add archive info display section
3. Test with ArchiveSection data

### Step 3: Update ProductOrderModal
1. Add archiveMetadata prop
2. Add archive banner display
3. Style archive info section

### Step 4: Refactor AdminHub
1. Replace enrichment logic with useOrderDetails hook
2. Update ActivityFeed integration
3. Update ArchiveSection integration
4. Remove custom archive modal
5. Test all flows

### Step 5: Roll Out to Other Hubs
1. Apply same pattern to ManagerHub
2. Apply to CenterHub, ContractorHub, CustomerHub, CrewHub, WarehouseHub
3. Test each hub

---

## Success Criteria

### Consistency
- ✅ Same order shows identical data regardless of source (activity, directory, archive)
- ✅ Entity names always enriched ("CRW-006 - Wario" everywhere)
- ✅ Product items always shown
- ✅ Contact info always complete

### Reusability
- ✅ One ActionModal used everywhere (activity, directory, archive)
- ✅ One ProductOrderModal used everywhere
- ✅ One data enrichment hook used by all hubs

### Maintainability
- ✅ Hub files ~90% smaller (just pass-through logic)
- ✅ Edit modal once, works everywhere
- ✅ Edit enrichment once, works everywhere
- ✅ Easy to add new fields/features

### RBAC Preservation
- ✅ All security checks remain at backend (unchanged)
- ✅ Modals are presentation-only (no RBAC logic)
- ✅ Data layer handles permissions transparently

---

## Risk Mitigation

### Risk: Breaking Existing Functionality
**Mitigation**:
- Implement hook first, test in isolation
- Refactor AdminHub first, verify all flows work
- Roll out to other hubs one at a time
- Keep git commits granular for easy rollback

### Risk: Performance Issues from Extra Fetching
**Mitigation**:
- Use SWR caching in useOrderDetails hook
- Dedupe requests automatically
- Fetch only when orderId changes
- Prefetch on hover (future optimization)

### Risk: Missing Edge Cases
**Mitigation**:
- Document all current code paths
- Test matrix: (Activity/Directory/Archive) × (Active/Archived/Deleted) × (Product/Service)
- Manual testing checklist
- Screenshot comparison before/after

---

## Files to Modify

### New Files
- `apps/frontend/src/hooks/useOrderDetails.ts` (NEW - centralized enrichment)

### Modified Files
- `packages/ui/src/modals/ActionModal/ActionModal.tsx` (add archiveMetadata prop)
- `packages/ui/src/modals/ProductOrderModal/ProductOrderModal.tsx` (add archiveMetadata prop)
- `packages/ui/src/modals/ServiceOrderModal/ServiceOrderModal.tsx` (add archiveMetadata prop)
- `packages/domain-widgets/src/admin/ArchiveSection.tsx` (remove custom modal, use ActionModal)
- `apps/frontend/src/hubs/AdminHub.tsx` (refactor to use useOrderDetails)
- `apps/frontend/src/hubs/ManagerHub.tsx` (refactor to use useOrderDetails)
- `apps/frontend/src/hubs/CenterHub.tsx` (refactor to use useOrderDetails)
- `apps/frontend/src/hubs/ContractorHub.tsx` (refactor to use useOrderDetails)
- `apps/frontend/src/hubs/CustomerHub.tsx` (refactor to use useOrderDetails)
- `apps/frontend/src/hubs/CrewHub.tsx` (refactor to use useOrderDetails)
- `apps/frontend/src/hubs/WarehouseHub.tsx` (refactor to use useOrderDetails)

---

## Per-Hub Changes Required

### AdminHub.tsx (2,148 lines → ~1,700 lines)

**Remove**:
- Lines 248-274: `useHubProfile` calls for requestor/destination
- Lines 350-430: Hydration/cache logic in `useEffect`
- Lines 1893-2065: `commonOrder`, `commonRequestorInfo`, `commonDestinationInfo` transformation (~170 lines)
- State: `fullOrderCacheRef`

**Replace with**:
```typescript
const orderDetails = useOrderDetails(selectedOrderId);
```

**Expected reduction**: ~400 lines

---

### ManagerHub.tsx (1,612 lines → ~1,500 lines)

**Remove**:
- Lines 1380-1432: `commonOrder`, `commonRequestorInfo`, `commonDestinationInfo` extraction from metadata
- Lines 1435-1482: Modal conditional rendering logic

**Replace with**:
```typescript
const orderDetails = useOrderDetails(selectedOrderId);
```

**Expected reduction**: ~100 lines

---

### WarehouseHub.tsx (1,437 lines → ~1,325 lines)

**Remove**:
- Similar `commonOrder` transformation logic (~80-100 lines)
- Modal conditional rendering

**Replace with**:
```typescript
const orderDetails = useOrderDetails(selectedOrderId);
```

**Expected reduction**: ~100 lines

---

### ContractorHub.tsx (1,106 lines → ~1,000 lines)

**Remove**:
- Similar `commonOrder` transformation logic (~80-100 lines)
- Modal conditional rendering

**Replace with**:
```typescript
const orderDetails = useOrderDetails(selectedOrderId);
```

**Expected reduction**: ~100 lines

---

### CustomerHub.tsx (917 lines → ~815 lines)

**Remove**:
- Similar `commonOrder` transformation logic (~80-100 lines)
- Modal conditional rendering

**Replace with**:
```typescript
const orderDetails = useOrderDetails(selectedOrderId);
```

**Expected reduction**: ~100 lines

---

### CrewHub.tsx (971 lines → ~870 lines)

**Remove**:
- Similar `commonOrder` transformation logic (~80-100 lines)
- Modal conditional rendering

**Replace with**:
```typescript
const orderDetails = useOrderDetails(selectedOrderId);
```

**Expected reduction**: ~100 lines

---

### CenterHub.tsx (908 lines → ~810 lines)

**Remove**:
- Similar `commonOrder` transformation logic (~80-100 lines)
- Modal conditional rendering

**Replace with**:
```typescript
const orderDetails = useOrderDetails(selectedOrderId);
```

**Expected reduction**: ~100 lines

---

### Total Code Reduction Across All Hubs

| Hub | Before | After | Reduction |
|-----|--------|-------|-----------|
| AdminHub | 2,148 | ~1,700 | ~400 lines (19%) |
| ManagerHub | 1,612 | ~1,500 | ~100 lines (6%) |
| WarehouseHub | 1,437 | ~1,325 | ~100 lines (7%) |
| ContractorHub | 1,106 | ~1,000 | ~100 lines (9%) |
| CrewHub | 971 | ~870 | ~100 lines (10%) |
| CustomerHub | 917 | ~815 | ~100 lines (11%) |
| CenterHub | 908 | ~810 | ~100 lines (11%) |
| **TOTAL** | **10,099** | **~9,020** | **~1,000 lines (10%)** |

**Plus**: Create `useOrderDetails` hook (~200 lines) = **Net reduction: ~800 lines (8%)**

---

## Timeline Estimate

- **Phase 1** (useOrderDetails hook): 2-3 hours
- **Phase 2** (ActionModal update): 1 hour
- **Phase 3** (ProductOrderModal update): 1 hour
- **Phase 4** (AdminHub refactor): 2-3 hours
- **Phase 5** (Other hubs rollout): 3-4 hours
- **Testing & Polish**: 2 hours

**Total**: ~12-15 hours (1.5-2 days)

---

## Future Benefits

Once this refactor is complete:

1. **Adding new order fields**: Update hook → works everywhere
2. **Changing modal UI**: Update component → works everywhere
3. **New activity types**: Reuse same patterns
4. **New modals for other entities**: Copy same architecture
5. **Performance optimization**: Centralized caching
6. **Testing**: Test hook + modals in isolation
7. **Onboarding new developers**: Clear separation of concerns

---

**Status**: Ready for approval
**Next Step**: Get approval, then start with Phase 1 (useOrderDetails hook)
