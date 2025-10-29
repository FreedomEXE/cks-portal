# GPT5 Task: Fix Archive Modal Issues - Use Existing Architecture

## Critical Discovery: Architecture Already Exists!

**DO NOT create new components.** All necessary modular components already exist and are properly exported:

- ✅ `<EntityHeader>` / `<EntityHeaderCard>` - Universal header (from `@cks/ui`)
- ✅ `<ArchivedBanner>` - Archived state banner (from `@cks/ui`)
- ✅ `<DeletedBanner>` - Deleted state banner (from `@cks/ui`)
- ✅ `<StatusBadge>` - Status display (from `@cks/ui`)
- ✅ `<EntityModalView>` - Universal modal shell (from `@cks/domain-widgets`)
- ✅ `<BaseViewModal>` - Modal skeleton that **automatically renders banners** (from `@cks/ui`)

**The banners are already integrated!** `BaseViewModal` lines 120-142 automatically render ArchivedBanner/DeletedBanner when `lifecycle.state !== 'active'`.

---

## The Real Problem

Products and catalog services are using **legacy patterns** instead of the modern universal modal architecture:

### ❌ Current Broken State:
1. Products still use old modal components (not EntityModalView)
2. Services still use old modal components (not EntityModalView)
3. Neither passes proper lifecycle metadata to their modals
4. Headers don't show correct state badges
5. Banners don't appear because modals don't use BaseViewModal properly

### ✅ Working Reference (Orders, Reports):
- Use modern adapter pattern with `getHeaderConfig()`
- Use `EntityModalView` which wraps `BaseViewModal`
- Lifecycle metadata automatically flows through system
- Banners render automatically
- Badges show correct state

---

## Your Mission: Migrate Products & Services to Modern Pattern

You need to ensure products and catalog services follow the SAME pattern as orders and reports.

---

## Phase 1: Verify Current State

### Task 1.1: Check Product Modal Implementation
**File:** `packages/ui/src/modals/CatalogProductModal/`

**Questions:**
1. Does it use `BaseViewModal` or `EntityModalView`?
2. Does it receive lifecycle props (`state`, `archivedAt`, `archivedBy`)?
3. Does it pass lifecycle to BaseViewModal?
4. Does the header show state badge?

### Task 1.2: Check Service Modal Implementation
**File:** `packages/ui/src/modals/CatalogServiceModal/` (or similar)

**Same questions as products**

### Task 1.3: Check ModalGateway Integration
**File:** `apps/frontend/src/components/ModalGateway.tsx`

**Verify:**
1. How does ModalGateway render product modals?
2. How does ModalGateway render service modals?
3. Does it extract and pass lifecycle metadata?
4. Compare to how it handles order modals (which work correctly)

---

## Phase 2: Update Entity Adapters

### Task 2.1: Product Adapter - Add getHeaderConfig()
**File:** `apps/frontend/src/config/entityRegistry.tsx`

**Current Status:** Product adapter likely missing or incomplete

**Add this method:**
```tsx
product: {
  type: 'product',
  // ... existing config

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData } = context;

    const fields: HeaderField[] = [];

    if (entityData?.category) {
      fields.push({ label: 'Category', value: entityData.category });
    }

    if (entityData?.unitOfMeasure) {
      fields.push({ label: 'Unit', value: entityData.unitOfMeasure });
    }

    if (entityData?.price) {
      fields.push({
        label: 'Price',
        value: `$${Number(entityData.price).toFixed(2)}`
      });
    }

    return {
      id: entityData?.productId || '',
      type: 'Product',
      status: context.lifecycle?.state || 'active',  // Use lifecycle state!
      statusText: context.lifecycle?.state === 'active' ? 'ACTIVE' :
                  context.lifecycle?.state === 'archived' ? 'ARCHIVED' : 'DELETED',
      fields,
    };
  },

  // ... rest of adapter
}
```

### Task 2.2: Catalog Service Adapter - Add/Fix getHeaderConfig()
**Same pattern as products**

```tsx
catalogService: {
  type: 'catalogService',

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData } = context;

    const fields: HeaderField[] = [];

    if (entityData?.category) {
      fields.push({ label: 'Category', value: entityData.category });
    }

    if (entityData?.durationMinutes) {
      fields.push({
        label: 'Duration',
        value: `${entityData.durationMinutes} minutes`
      });
    }

    return {
      id: entityData?.serviceId || '',
      type: 'Catalog Service',
      status: context.lifecycle?.state || 'active',  // Use lifecycle state!
      statusText: context.lifecycle?.state === 'active' ? 'ACTIVE' :
                  context.lifecycle?.state === 'archived' ? 'ARCHIVED' : 'DELETED',
      fields,
    };
  },

  // ... rest of adapter
}
```

### Task 2.3: Standardize Action Descriptors (ALL Entities)

**Apply this EXACT pattern to products, services, and verify for all other entities:**

```tsx
getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
  const { role, lifecycle } = context;
  const state = lifecycle?.state || 'active';

  if (role !== 'admin') return [];

  if (state === 'active') {
    return [
      {
        key: 'edit',
        label: 'Edit',
        variant: 'secondary',
        closeOnSuccess: false
      },
      {
        key: 'archive',
        label: 'Archive',
        variant: 'secondary',
        confirm: 'Are you sure you want to archive this? It will be scheduled for deletion.',
        closeOnSuccess: true
      }
    ];
  }

  if (state === 'archived') {
    return [
      {
        key: 'restore',
        label: 'Restore',
        variant: 'secondary',
        closeOnSuccess: true
      },
      {
        key: 'delete',
        label: 'Permanently Delete',
        variant: 'danger',
        confirm: 'Are you sure you want to permanently delete this? This action cannot be undone.',
        closeOnSuccess: true
      }
    ];
  }

  return [];
}
```

---

## Phase 3: Update ModalGateway

### Task 3.1: Extract Lifecycle Metadata
**File:** `apps/frontend/src/components/ModalGateway.tsx`

**Look for the `extractLifecycle()` function** (should already exist - used by orders/reports).

**Ensure it handles products and services:**

```tsx
function extractLifecycle(options: any): LifecycleMetadata | undefined {
  if (!options) return undefined;

  const { state, archivedAt, archivedBy, deletedAt, deletedBy, archiveReason } = options;

  if (!state || state === 'active') return undefined;

  return {
    state: state as 'active' | 'archived' | 'deleted',
    archivedAt,
    archivedBy,
    archiveReason,
    deletedAt,
    deletedBy,
  };
}
```

### Task 3.2: Pass Lifecycle to All Modals

**Find where ModalGateway renders product/service modals.**

**Ensure pattern matches orders:**

```tsx
// EXAMPLE: How orders work (COPY THIS PATTERN)
if (entityType === 'order') {
  const lifecycle = extractLifecycle(options);
  const adapter = getEntityAdapter('order');

  return (
    <EntityModalView
      isOpen={isOpen}
      onClose={onClose}
      entityType="order"
      entityId={entityId}
      lifecycle={lifecycle}  // ← THIS IS CRITICAL!
      headerConfig={adapter.getHeaderConfig({ entityData, lifecycle, role, currentUserId })}
      tabs={adapter.getTabDescriptors({ entityData, lifecycle, role, currentUserId, actions })}
    />
  );
}
```

**Apply same pattern to products and services:**

```tsx
if (entityType === 'product') {
  const lifecycle = extractLifecycle(options);
  const adapter = getEntityAdapter('product');

  return (
    <EntityModalView
      isOpen={isOpen}
      onClose={onClose}
      entityType="product"
      entityId={entityId}
      lifecycle={lifecycle}  // ← Pass lifecycle!
      headerConfig={adapter.getHeaderConfig({ entityData, lifecycle, role, currentUserId })}
      tabs={adapter.getTabDescriptors({ entityData, lifecycle, role, currentUserId, actions })}
    />
  );
}
```

---

## Phase 4: Verify Modal Components

### Task 4.1: Check Product Modal
**File:** `packages/ui/src/modals/CatalogProductModal/CatalogProductModal.tsx` (or similar)

**If it's NOT using EntityModalView:**

**Option A: Delete it and let ModalGateway use EntityModalView**
- Products should render via EntityModalView just like orders
- No custom product modal needed

**Option B: Update it to use BaseViewModal properly**
- Receive lifecycle props
- Pass lifecycle to BaseViewModal
- Use EntityHeaderCard for header

### Task 4.2: Check Service Modal
**Same approach as products**

---

## Phase 5: Testing

### Test Products:
1. ✅ Open active product (PRD-004 or any active)
   - Badge shows "ACTIVE" (green)
   - No banners
   - Admin sees: Edit + Archive buttons

2. ✅ Open archived product (PRD-003)
   - Badge shows "ARCHIVED" (gray)
   - Archived banner appears with metadata
   - Admin sees: Restore + Permanently Delete buttons

### Test Catalog Services:
1. ✅ Open active service (SRV-002 or any active)
   - Badge shows "ACTIVE" (green)
   - No banners
   - Admin sees: Edit + Archive buttons

2. ✅ Open archived service (SRV-001)
   - Badge shows "ARCHIVED" (gray)
   - Archived banner appears with metadata
   - Admin sees: Restore + Permanently Delete buttons

### Test Users (Verify Still Work):
1. ✅ Open archived warehouse (WHS-004)
   - Should still work correctly (reference implementation)

---

## Success Criteria

### Code Quality:
- ✅ Products use EntityModalView (or BaseViewModal with lifecycle)
- ✅ Services use EntityModalView (or BaseViewModal with lifecycle)
- ✅ Both adapters have `getHeaderConfig()` that uses lifecycle state
- ✅ Both adapters have standardized `getActionDescriptors()`
- ✅ ModalGateway extracts and passes lifecycle for both

### Visual Verification:
- ✅ Screenshot PRD-003 showing: ARCHIVED badge, banner, Restore + Delete buttons
- ✅ Screenshot SRV-001 showing: ARCHIVED badge, banner, Restore + Delete buttons
- ✅ Compare to WHS-004 screenshot - should look identical (except entity-specific content)

---

## Key Architecture Points

### 1. Data Flow (How Lifecycle Works)
```
Backend endpoint
  ↓ returns { data, state: 'archived', archivedAt, archivedBy }
ModalProvider
  ↓ passes as options to ModalGateway
ModalGateway
  ↓ extracts via extractLifecycle()
  ↓ passes to adapter.getHeaderConfig({ lifecycle })
  ↓ passes to EntityModalView as lifecycle prop
EntityModalView
  ↓ passes to BaseViewModal
BaseViewModal
  ↓ automatically renders ArchivedBanner if lifecycle.state === 'archived'
```

### 2. Why Banners Appear Automatically
**File:** `packages/ui/src/modals/BaseViewModal/BaseViewModal.tsx` (lines 120-142)

```tsx
{lifecycle && lifecycle.state !== 'active' && (
  <div style={{ padding: '0 16px', marginTop: '16px' }}>
    {lifecycle.state === 'archived' && (
      <ArchivedBanner
        archivedAt={lifecycle.archivedAt}
        archivedBy={lifecycle.archivedBy}
        reason={lifecycle.archiveReason}
        scheduledDeletion={lifecycle.scheduledDeletion}
        entityType={entityType}
        entityId={entityId}
      />
    )}
    {lifecycle.state === 'deleted' && (
      <DeletedBanner
        deletedAt={lifecycle.deletedAt}
        deletedBy={lifecycle.deletedBy}
        entityType={entityType}
        entityId={entityId}
        isTombstone={lifecycle.isTombstone}
      />
    )}
  </div>
)}
```

**This means:** Once you pass lifecycle to BaseViewModal (via EntityModalView), banners render automatically!

### 3. Why Badge Shows Wrong State
Products/services likely using old card components or manually setting status text instead of reading from lifecycle.

**Fix:** Use `getHeaderConfig()` with `statusText` derived from `lifecycle.state`:

```tsx
statusText: lifecycle?.state === 'active' ? 'ACTIVE' :
            lifecycle?.state === 'archived' ? 'ARCHIVED' : 'DELETED'
```

---

## Files You'll Modify

### Backend (Already Done):
- ✅ `apps/backend/server/domains/catalog/routes.fastify.ts` - already returns state

### Frontend:
1. `apps/frontend/src/config/entityRegistry.tsx`
   - Add/update `getHeaderConfig()` for product and catalogService
   - Fix `getActionDescriptors()` for both

2. `apps/frontend/src/components/ModalGateway.tsx`
   - Ensure products/services use EntityModalView
   - Ensure lifecycle is extracted and passed

3. ~~`apps/frontend/src/components/modals/` - NO NEW COMPONENTS NEEDED~~
   - ❌ Do not create ModalHeader (use EntityHeader/EntityHeaderCard)
   - ❌ Do not create ArchivedBanner (already exists)
   - ❌ Do not create DeletedBanner (already exists)

4. `packages/ui/src/modals/CatalogProductModal/` (if exists)
   - Update to receive and use lifecycle props
   - Or delete and use EntityModalView

5. `packages/ui/src/modals/CatalogServiceModal/` (if exists)
   - Same as products

---

## Components You SHOULD Use (Already Exist)

**All from `@cks/ui`:**
```tsx
import {
  BaseViewModal,
  ArchivedBanner,
  DeletedBanner,
  EntityHeader,
  EntityHeaderCard,
  StatusBadge,
} from '@cks/ui';
```

**From `@cks/domain-widgets`:**
```tsx
import {
  EntityModalView,
  DetailsComposer,
  getEntityAccentColor,
} from '@cks/domain-widgets';
```

---

## Reference Files (Working Examples)

### Order Adapter (WORKING):
- `apps/frontend/src/config/entityRegistry.tsx` (lines 275-325)
- Shows complete `getHeaderConfig()` implementation
- Shows complete `getActionDescriptors()` implementation

### Report Adapter (WORKING):
- `apps/frontend/src/config/entityRegistry.tsx` (lines 588-648)
- Shows custom badge support
- Shows lifecycle integration

### BaseViewModal (THE KEY):
- `packages/ui/src/modals/BaseViewModal/BaseViewModal.tsx`
- Lines 120-142: Automatic banner rendering
- This is why you don't need to manually add banners!

---

## Questions to Ask Before Starting

1. Are products/services currently rendered via ModalGateway or some other method?
2. Do product/service modals exist as separate components or are they generated dynamically?
3. Does ModalGateway already have a case for 'product' and 'catalogService'?
4. Are the entity adapters already defined in entityRegistry.tsx?

**IMPORTANT:** Do not create new components. Use the existing architecture. Your job is to ensure products and services **use the same pattern as orders**.

---

## Timeline Estimate

- Phase 1: 30 min (verify current state)
- Phase 2: 1-2 hours (update adapters)
- Phase 3: 1 hour (update ModalGateway)
- Phase 4: 30 min (verify/update modal components)
- Phase 5: 1 hour (testing)

**Total: 4-5 hours** (much faster than creating new components!)

---

## Final Notes

The architecture is already excellent. You're not building anything new - you're ensuring consistency. Products and services need to follow the same pattern that orders and reports already use.

**Key insight:** `BaseViewModal` automatically handles lifecycle banners. Once you pass the lifecycle prop through the system, everything else works automatically. Your focus should be on:

1. Getting lifecycle metadata to flow properly
2. Using `getHeaderConfig()` to show correct state badge
3. Using `getActionDescriptors()` to show correct buttons

That's it. The modular components already exist and are already integrated. You just need to use them consistently.
