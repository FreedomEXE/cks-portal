# GPT5 Task: Fix Archive Modal State - Final Definitive Prompt

## Critical Finding: State is Being Overwritten!

**Root Cause Identified:** `ModalProvider` is **overwriting** caller-provided state during prefetch merge.

```tsx
// PROBLEM: This overwrites options.state with undefined if backend doesn't return it
enrichedOptions = {
  ...options,           // Has state: 'archived' from caller
  data: response.data,
  state: response.state, // ← Overwrites with undefined!
  archivedAt: response.archivedAt,
  archivedBy: response.archivedBy,
}
```

**Result:** Even when backend/caller knows entity is archived, state gets wiped to undefined, defaulting to "active".

---

## What Already Exists (DO NOT CREATE NEW COMPONENTS)

All components already exist and work correctly:

- ✅ `BaseViewModal` - Automatically renders `ArchivedBanner`/`DeletedBanner` when `lifecycle.state` is set
- ✅ `ArchivedBanner` - Gray banner with archive info (in `packages/ui/src/banners/`)
- ✅ `DeletedBanner` - Red banner with deletion info (in `packages/ui/src/banners/`)
- ✅ `EntityModalView` - Universal modal shell (in `packages/domain-widgets/`)
- ✅ `EntityHeaderCard` - Modal header with badge (in `packages/ui/`)
- ✅ Entity adapters - Already have correct action descriptors for archived state

**The infrastructure is perfect. The bug is in the data flow.**

---

## The Three Problems

### Problem 1: State Overwrite in ModalProvider ⚠️ CRITICAL
**File:** `apps/frontend/src/contexts/ModalProvider.tsx`

**Lines:** `openEntityModal()` and `openById()` where `enrichedOptions` is built

**Issue:**
```tsx
// WRONG - overwrites caller state with undefined
enrichedOptions = {
  ...options,
  data: response.data,
  state: response.state,  // ← Backend might not return this
}
```

**Fix:**
```tsx
// CORRECT - preserve caller state if backend doesn't provide one
enrichedOptions = {
  ...options,
  data: response.data,
  // Only set state if backend explicitly returns it
  ...(response.state && { state: response.state }),
  // Fallback: derive from data.status if available
  ...(!response.state && !options.state && response.data?.status && {
    state: response.data.status === 'inactive' || response.data.status === 'archived'
      ? 'archived'
      : 'active'
  }),
  archivedAt: response.archivedAt,
  archivedBy: response.archivedBy,
}
```

**Apply this pattern to:**
- Line ~87: `openEntityModal()` - user/product prefetch
- Line ~191-224: `openById()` - catalogService prefetch
- Line ~268-312: `openById()` - product prefetch

---

### Problem 2: Lifecycle Inference Too Narrow
**File:** `apps/frontend/src/components/ModalGateway.tsx`

**Function:** `extractLifecycle(options)`

**Issue:** Only checks for explicit lifecycle fields, doesn't fall back to `data.status`

**Current Logic:**
```tsx
function extractLifecycle(options: any): LifecycleMetadata | undefined {
  const { state, archivedAt, deletedAt } = options;
  if (!state || state === 'active') return undefined;

  return { state, archivedAt, ... };
}
```

**Fix:**
```tsx
function extractLifecycle(options: any): LifecycleMetadata | undefined {
  // Priority 1: Explicit state from options
  let state = options.state;

  // Priority 2: Derive from deletion/archive metadata
  if (!state) {
    if (options.deletedAt) state = 'deleted';
    else if (options.archivedAt) state = 'archived';
  }

  // Priority 3: Fallback to data.status (for catalog entities)
  if (!state && options.data?.status) {
    const dataStatus = options.data.status;
    if (dataStatus === 'inactive' || dataStatus === 'archived') {
      state = 'archived';
    }
  }

  // No lifecycle if still active or undefined
  if (!state || state === 'active') return undefined;

  return {
    state: state as 'archived' | 'deleted',
    archivedAt: options.archivedAt,
    archivedBy: options.archivedBy,
    archiveReason: options.archiveReason,
    deletedAt: options.deletedAt,
    deletedBy: options.deletedBy,
    isTombstone: options.isTombstone,
  };
}
```

---

### Problem 3: Header Badge Not Lifecycle-Aware
**File:** `packages/domain-widgets/src/modals/EntityModalView.tsx`

**Line:** Where `EntityHeaderCard` is rendered

**Issue:** Badge shows `headerConfig.status` (e.g., "inactive") instead of `lifecycle.state` (e.g., "archived")

**Current:**
```tsx
<EntityHeaderCard
  entityId={entityId}
  entityType={displayEntityType}
  name={headerConfig.name}
  status={headerConfig.status}  // ← Shows data status, not lifecycle state
  accentColor={accentColor}
  additionalContent={headerConfig.additionalContent}
/>
```

**Fix:**
```tsx
// Compute display status with lifecycle priority
const displayStatus = lifecycle
  ? lifecycle.state === 'deleted'
    ? 'deleted'
    : lifecycle.state === 'archived'
      ? 'archived'
      : headerConfig.status
  : headerConfig.status;

<EntityHeaderCard
  entityId={entityId}
  entityType={displayEntityType}
  name={headerConfig.name}
  status={displayStatus}  // ← Now shows lifecycle state when present
  statusText={
    lifecycle?.state === 'deleted' ? 'DELETED' :
    lifecycle?.state === 'archived' ? 'ARCHIVED' :
    headerConfig.statusText
  }
  accentColor={accentColor}
  additionalContent={headerConfig.additionalContent}
/>
```

---

## Files to Modify

### 1. `apps/frontend/src/contexts/ModalProvider.tsx`

**Changes:**
- Fix state overwrite in `openEntityModal()` (~line 87)
- Fix state overwrite in `openById()` for catalogService (~line 191-224)
- Fix state overwrite in `openById()` for product (~line 268-312)

**Pattern:** Preserve caller state, only override if backend explicitly returns state, add fallback to `data.status`

---

### 2. `apps/frontend/src/components/ModalGateway.tsx`

**Changes:**
- Enhance `extractLifecycle()` function (~top of file or in utils)

**Pattern:** Add three-tier priority: explicit state → metadata presence → data.status fallback

---

### 3. `packages/domain-widgets/src/modals/EntityModalView.tsx`

**Changes:**
- Add `displayStatus` computation before rendering `EntityHeaderCard`
- Pass `displayStatus` and `statusText` to `EntityHeaderCard`

**Pattern:** Lifecycle state overrides data status for badge display

---

### 4. Verify Entity Adapters (NO CHANGES NEEDED)

**File:** `apps/frontend/src/config/entityRegistry.tsx`

**Verify these adapters have correct `getActionDescriptors()`:**
- ✅ `product` - Check lines ~1627+
- ✅ `catalogService` - Check if exists
- ✅ `manager`, `contractor`, etc. - Should already be correct

**Expected Pattern (DO NOT CHANGE IF ALREADY CORRECT):**
```tsx
getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
  const { role, lifecycle } = context;
  const state = lifecycle?.state || 'active';

  if (role !== 'admin') return [];

  if (state === 'active') {
    return [
      { key: 'edit', label: 'Edit', variant: 'secondary', closeOnSuccess: false },
      { key: 'archive', label: 'Archive', variant: 'secondary', confirm: '...', closeOnSuccess: true }
    ];
  }

  if (state === 'archived') {
    return [
      { key: 'restore', label: 'Restore', variant: 'secondary', closeOnSuccess: true },
      { key: 'delete', label: 'Permanently Delete', variant: 'danger', confirm: '...', closeOnSuccess: true }
    ];
  }

  return [];
}
```

**If product/service adapters don't follow this pattern, update them. Otherwise leave as-is.**

---

## Testing Checklist

### Test Scenario 1: Archived Product (PRD-003)
**Steps:**
1. Go to Admin Hub → Archive tab
2. Click on PRD-003 (or any archived product)

**Expected:**
- ✅ Badge shows "ARCHIVED" (gray)
- ✅ Archived banner appears at top with metadata
- ✅ Quick Actions shows: "Restore" + "Permanently Delete" buttons
- ✅ No "Edit" or "Archive" buttons

---

### Test Scenario 2: Archived Catalog Service (SRV-001)
**Steps:**
1. Go to Admin Hub → Archive tab → Catalog Services
2. Click on SRV-001 (or any archived service)

**Expected:**
- ✅ Badge shows "ARCHIVED" (gray) - NOT "INACTIVE"
- ✅ Archived banner appears at top with metadata
- ✅ Quick Actions shows: "Restore" + "Permanently Delete" buttons
- ✅ No "Edit" or "Archive" buttons

---

### Test Scenario 3: Active Product (PRD-004+)
**Steps:**
1. Go to Admin Hub → Directory → Products
2. Click on any active product

**Expected:**
- ✅ Badge shows "ACTIVE" (green)
- ✅ No banners appear
- ✅ Quick Actions shows: "Edit" + "Archive" buttons
- ✅ Inventory management works normally

---

### Test Scenario 4: Active Catalog Service (SRV-002+)
**Steps:**
1. Go to Admin Hub → Directory → Catalog Services
2. Click on any active service

**Expected:**
- ✅ Badge shows "ACTIVE" (green)
- ✅ No banners appear
- ✅ Quick Actions shows: "Edit" + "Archive" buttons
- ✅ Certified users management works normally

---

### Test Scenario 5: Verify Users Still Work (WHS-004)
**Steps:**
1. Go to Admin Hub → Archive tab → Warehouses
2. Click on WHS-004 (archived warehouse)

**Expected:**
- ✅ Badge shows "ARCHIVED" (gray)
- ✅ Archived banner appears (should still work as before)
- ✅ Quick Actions shows: "Restore" + "Permanently Delete"
- ✅ No regression in user modal behavior

---

### Test Scenario 6: Lifecycle Transitions
**Steps:**
1. Open active product → Archive it → Modal refreshes
2. Open archived product → Restore it → Modal refreshes

**Expected:**
- ✅ Badge updates immediately after archive/restore
- ✅ Banner appears/disappears correctly
- ✅ Buttons change appropriately
- ✅ No page reload required

---

## Success Criteria

### Visual Verification:
1. ✅ Screenshot of PRD-003 showing: ARCHIVED badge, banner, Restore+Delete buttons
2. ✅ Screenshot of SRV-001 showing: ARCHIVED badge (not INACTIVE), banner, Restore+Delete buttons
3. ✅ Compare to WHS-004 screenshot - products/services look identical to user pattern

### Code Quality:
1. ✅ No new components created (reused existing)
2. ✅ State preservation logic added to ModalProvider
3. ✅ Lifecycle inference enhanced in ModalGateway
4. ✅ Badge priority added to EntityModalView
5. ✅ All entity adapters follow consistent pattern

### Functional:
1. ✅ State flows correctly: Backend → ModalProvider → ModalGateway → EntityModalView → Badge/Buttons
2. ✅ Banners render automatically via BaseViewModal (no manual placement)
3. ✅ All entities (product, service, user, order, report, feedback) follow same pattern
4. ✅ No regressions in existing working modals

---

## Why This Works

### Data Flow (After Fix)

```
1. Backend Returns:
   { data: { status: 'inactive' }, state: 'archived' } OR
   { data: { status: 'inactive' } } (no explicit state)

2. ModalProvider:
   - Preserves explicit state if present
   - Falls back to deriving from data.status if needed
   - Builds: { data, state: 'archived', archivedAt, archivedBy }

3. ModalGateway:
   - extractLifecycle() checks state, metadata, then data.status
   - Returns: { state: 'archived', archivedAt, archivedBy }
   - Passes to EntityModalView

4. EntityModalView:
   - Computes displayStatus = lifecycle.state ('archived')
   - Passes to EntityHeaderCard → Badge shows "ARCHIVED"
   - Passes lifecycle to BaseViewModal

5. BaseViewModal:
   - Sees lifecycle.state === 'archived'
   - Automatically renders ArchivedBanner (lines 120-142)
   - Renders tabs with actions

6. Entity Adapter:
   - getActionDescriptors({ lifecycle: { state: 'archived' } })
   - Returns: [Restore, Delete]
```

**Result:** Badge, banner, and buttons all show correct archived state!

---

## Key Insights from Both Research Sources

### Insight 1: Infrastructure is Perfect
All modular components exist:
- Headers, banners, badges, modals - all there and properly exported
- BaseViewModal automatically handles lifecycle banners (lines 120-142)
- No new components needed

### Insight 2: The Bug is Data Flow
State gets lost/overwritten at three points:
1. ModalProvider overwrites during prefetch merge
2. ModalGateway doesn't check data.status fallback
3. EntityModalView prioritizes data status over lifecycle state

### Insight 3: Fix is Small and Surgical
Only need to modify:
- State preservation in ModalProvider (3 locations)
- Lifecycle inference in ModalGateway (1 function)
- Badge priority in EntityModalView (1 computation)

No architecture changes. No new components. No refactoring.

---

## Important Notes

### Backend Status vs. Lifecycle State
**Backend fields:**
- `data.status` - Entity-specific status (e.g., "inactive" for services, "archived" for products)
- `state` - Lifecycle state (standardized: "active", "archived", "deleted")

**Frontend priority:**
1. Use `state` if backend returns it (most reliable)
2. Derive from `data.status` as fallback (for entities without explicit state)
3. Default to "active" if nothing else available

### Why Services Show "INACTIVE"
Catalog services use `status: 'inactive'` in database (their business concept of deactivation).

Archive system sets this to "inactive" when archiving (not "archived").

Fix: Map `'inactive' → 'archived'` in lifecycle inference so UI shows "ARCHIVED" badge.

### Action Buttons Already Work!
Product adapter already has correct logic:
- Lines ~1627+ in entityRegistry.tsx show proper state-based actions
- Once state flows correctly, buttons will work automatically

**Do not modify action descriptors unless they're wrong.**

---

## Timeline Estimate

- Fix 1 (ModalProvider state preservation): 30 minutes
- Fix 2 (ModalGateway lifecycle inference): 15 minutes
- Fix 3 (EntityModalView badge priority): 15 minutes
- Verify entity adapters: 15 minutes
- Testing all scenarios: 45 minutes

**Total: 2 hours**

Much faster than originally estimated because:
- No new components to build
- No architecture changes
- Just fixing data flow bugs

---

## Final Checklist Before Starting

**Verify you understand:**
- [ ] All components already exist (no creation needed)
- [ ] Bug is in state preservation/inference, not missing features
- [ ] Three files need changes (ModalProvider, ModalGateway, EntityModalView)
- [ ] Entity adapters likely already correct (just verify)
- [ ] BaseViewModal automatically renders banners (don't add manual banner code)

**After completing changes:**
- [ ] Test all 6 test scenarios listed above
- [ ] Take screenshots of PRD-003 and SRV-001 for comparison
- [ ] Verify no regressions in user modals (WHS-004)
- [ ] Confirm archived → restore → archived lifecycle works
- [ ] Document any edge cases discovered

---

## Questions to Ask Before Starting

1. Does `EntityHeaderCard` accept a `statusText` prop or do we need to add it?
2. Are there any other entities besides product/service that use `data.status` instead of explicit `state`?
3. Should we add logging to track state flow for debugging?

---

## Reference Code Locations

### Working Example (Orders):
- ModalGateway: How orders are rendered (~line 150-200)
- Order adapter: getHeaderConfig() and getActionDescriptors()
- Shows correct pattern to follow

### Banner Auto-Render Logic:
- `packages/ui/src/modals/BaseViewModal/BaseViewModal.tsx` lines 120-142
- This is why banners appear automatically - don't duplicate this logic

### Backend State Return:
- ✅ Products: `apps/backend/server/domains/catalog/routes.fastify.ts` line ~302 (already returns state)
- ⚠️ Services: Needs verification - does it return explicit state or just status: 'inactive'?

---

## Conclusion

**This is a simple data flow fix, not an architecture problem.**

1. Preserve state during prefetch (don't overwrite with undefined)
2. Infer lifecycle from data.status when explicit state missing
3. Prioritize lifecycle state for badge display

All components already exist. All patterns already defined. Just need to connect the dots.

**Estimated completion: 2 hours of focused work.**
