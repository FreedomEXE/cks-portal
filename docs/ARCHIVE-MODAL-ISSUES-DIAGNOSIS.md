# Archive Modal Issues - Comprehensive Diagnosis

**Date:** 2025-10-29
**Severity:** CRITICAL - Blocking all future entity migrations
**Scope:** Products, Catalog Services, and ALL future entity types

---

## Visual Evidence Analysis

### ✅ CORRECT Behavior (Archived User - WHS-004)
**Screenshot: ARCHIVED USER EXAMPLE.jpeg**

What works:
1. **Badge:** "ARCHIVED" badge in top-right (gray)
2. **Banner:** Blue info banner with trash icon at top
   - Text: "Archived Warehouse"
   - Subtext: "This warehouse has been archived and is scheduled for deletion."
   - Details: "Archived: Oct 29, 2025, 04:09 AM  By: ADMIN  ID: WHS-004"
3. **Buttons:** "Restore" (gray) + "Permanently Delete" (red)
4. **Tab:** Quick Actions tab is active

### ❌ BROKEN Behavior #1 (Archived Product - PRD-003)
**Screenshot: ARCHIVED PRODUCT EXAMPLE.jpeg**

What's wrong:
1. **Badge:** Shows "ACTIVE" (green) - should be "ARCHIVED" (gray)
2. **Banner:** MISSING - should show archived banner like users
3. **Buttons:** Shows "Edit" + "Archive" - should show "Restore" + "Permanently Delete"
4. **Tab:** Quick Actions tab is active (correct)

### ❌ BROKEN Behavior #2 (Archived Service - SRV-001)
**Screenshot: ARCHIVED SERVICE EXAMPLE.jpeg**

What's wrong:
1. **Badge:** Shows "INACTIVE" (gray) - should say "ARCHIVED"
2. **Banner:** MISSING - should show archived banner like users
3. **Buttons:** Shows "Restore" + "Permanently Delete" (CORRECT! ✅)
4. **Tab:** Quick Actions tab is active (correct)

---

## Root Cause Analysis

### Issue 1: Badge Not Showing Correct State

**Problem:** Badge shows wrong text/color for archived entities
- Products: Shows "ACTIVE" (green) instead of "ARCHIVED" (gray)
- Services: Shows "INACTIVE" (gray) - text wrong, should be "ARCHIVED"

**Location:** Modal header component
**Data Flow:**
1. Backend returns `{ state: 'archived', ... }`
2. ModalProvider passes to ModalGateway
3. ModalGateway passes to entity adapter
4. Entity adapter passes to modal component
5. **Modal header needs to read state and show badge**

### Issue 2: Missing Archived Banner

**Problem:** No banner appears at top of modal for archived products/services

**Expected Behavior (from user modal):**
```tsx
<div className="archived-banner">
  <Icon type="trash" />
  <div>
    <strong>Archived {EntityType}</strong>
    <p>This {entity} has been archived and is scheduled for deletion.</p>
    <small>Archived: {date}  By: {user}  ID: {id}</small>
  </div>
</div>
```

**Current Behavior:** Banner component not rendering

**Location:** Modal body component (before tabs)

### Issue 3: Wrong Buttons for Products

**Problem:** Products show Edit + Archive instead of Restore + Delete

**Status:**
- Services: ✅ WORKING (shows correct buttons)
- Products: ❌ BROKEN (shows wrong buttons)

**Backend Status:**
- `/api/catalog/products/:productId/details` now returns `{ state: 'archived' }` ✅
- `/api/catalog/services/:serviceId/details` returns `{ state: 'archived' }` ✅

**Frontend Issue:** Entity registry action descriptors not responding to state correctly for products

---

## Modular Solution Required

### The Problem
We are implementing archive functionality entity-by-entity:
- ✅ Users (managers, contractors, etc.) - WORKING
- ❌ Products - BROKEN (buttons, badge, banner)
- ⚠️ Services - PARTIAL (buttons work, badge/banner broken)
- ❓ Orders - NOT STARTED
- ❓ Active Services - NOT STARTED
- ❓ Reports - NOT STARTED
- ❓ Feedback - NOT STARTED

**This is creating MASSIVE technical debt.**

### Required Modular Components

We need centralized, reusable components that ALL entity modals use:

#### 1. `<ModalHeader>` Component
**Responsibility:** Show entity ID, name, type, and **state badge**

**Props:**
```tsx
interface ModalHeaderProps {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  state: 'active' | 'archived' | 'deleted';
  onClose: () => void;
}
```

**Behavior:**
- Reads `state` prop
- Shows badge: "ACTIVE" (green), "ARCHIVED" (gray), "DELETED" (red)
- Used by ALL entity modals (no entity-specific logic)

#### 2. `<ArchivedBanner>` Component
**Responsibility:** Show archive notification banner

**Props:**
```tsx
interface ArchivedBannerProps {
  entityType: string;        // "Product", "Service", "Manager", etc.
  entityId: string;
  archivedAt?: string;
  archivedBy?: string;
  state: 'active' | 'archived' | 'deleted';
}
```

**Behavior:**
- Only renders if `state === 'archived'`
- Shows: "Archived {EntityType}" with metadata
- Used by ALL entity modals (no entity-specific logic)

#### 3. `<DeletedBanner>` Component (already exists?)
**Responsibility:** Show deletion notification banner

**Props:**
```tsx
interface DeletedBannerProps {
  entityType: string;
  entityId: string;
  deletedAt?: string;
  deletedBy?: string;
  state: 'active' | 'archived' | 'deleted';
}
```

**Behavior:**
- Only renders if `state === 'deleted'`
- Shows: "Deleted {EntityType}" with metadata
- Used by ALL entity modals

#### 4. Entity Adapter Action Descriptors (FIX)
**Location:** `apps/frontend/src/config/entityRegistry.tsx`

**Problem:** Each entity has custom logic for actions

**Required Behavior:**
```tsx
getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
  const { role, state } = context;

  if (role !== 'admin') return [];

  // STANDARD PATTERN FOR ALL ENTITIES:
  if (state === 'active') {
    return [
      { key: 'edit', label: 'Edit', variant: 'secondary' },
      { key: 'archive', label: 'Archive', variant: 'secondary', confirm: '...' }
    ];
  }

  if (state === 'archived') {
    return [
      { key: 'restore', label: 'Restore', variant: 'secondary' },
      { key: 'delete', label: 'Permanently Delete', variant: 'danger', confirm: '...' }
    ];
  }

  if (state === 'deleted') {
    return []; // No actions on deleted entities
  }

  return [];
}
```

**This logic should be IDENTICAL across all entities.**

---

## GPT5 Task Breakdown

### Phase 1: Create Modular Components (1-2 hours)

**Files to Create/Update:**
1. `apps/frontend/src/components/modals/ModalHeader.tsx`
   - Extract from existing modals
   - Add state badge logic
   - Make generic for all entity types

2. `apps/frontend/src/components/modals/ArchivedBanner.tsx`
   - Extract from user modals (if exists)
   - Make generic for all entity types
   - Use entityType prop for text

3. Verify `apps/frontend/src/components/modals/DeletedBanner.tsx` exists
   - If not, create it
   - Same pattern as ArchivedBanner

### Phase 2: Update Entity Adapters (1-2 hours)

**File:** `apps/frontend/src/config/entityRegistry.tsx`

**Entities to Fix:**
- ✅ Users (managers, contractors, etc.) - use as reference
- ❌ `product` adapter - fix action descriptors
- ⚠️ `catalogService` adapter - verify action descriptors
- ❓ `order` adapter - add action descriptors
- ❓ `service` adapter (active services) - add action descriptors
- ❓ `report` adapter - add action descriptors
- ❓ `feedback` adapter - add action descriptors

**Pattern to Apply:**
```tsx
getActionDescriptors: (context) => {
  const { role, state } = context;
  if (role !== 'admin') return [];

  if (state === 'active') return [
    { key: 'edit', label: 'Edit', variant: 'secondary', closeOnSuccess: false },
    { key: 'archive', label: 'Archive', variant: 'secondary', confirm: 'Archive confirmation text', closeOnSuccess: true }
  ];

  if (state === 'archived') return [
    { key: 'restore', label: 'Restore', variant: 'secondary', closeOnSuccess: true },
    { key: 'delete', label: 'Permanently Delete', variant: 'danger', confirm: 'Delete confirmation text', closeOnSuccess: true }
  ];

  return [];
}
```

### Phase 3: Update Entity Modal Components (2-3 hours)

**Files to Update:**
- All modal components in `packages/ui/src/modals/`
- Pattern: Import and use ModalHeader, ArchivedBanner, DeletedBanner

**Example Structure:**
```tsx
export function EntityModal({ isOpen, onClose, entityData, state, ... }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader
        entityId={entityData.id}
        entityName={entityData.name}
        entityType="Product"  // or props.entityType
        state={state}
        onClose={onClose}
      />

      <ArchivedBanner
        entityType="Product"
        entityId={entityData.id}
        archivedAt={archivedAt}
        archivedBy={archivedBy}
        state={state}
      />

      <DeletedBanner
        entityType="Product"
        entityId={entityData.id}
        deletedAt={deletedAt}
        deletedBy={deletedBy}
        state={state}
      />

      <Tabs>
        {/* tabs content */}
      </Tabs>
    </Modal>
  );
}
```

### Phase 4: Testing (1 hour)

**Test Each Entity Type:**
1. Active state:
   - Badge shows "ACTIVE" (green)
   - No banners
   - Shows Edit + Archive buttons

2. Archived state:
   - Badge shows "ARCHIVED" (gray)
   - Archived banner appears
   - Shows Restore + Delete buttons

3. Deleted state:
   - Badge shows "DELETED" (red)
   - Deleted banner appears
   - No action buttons

**Entities to Test:**
- Users (all types)
- Products
- Catalog Services
- Orders
- Active Services
- Reports
- Feedback

---

## Success Criteria

### Must Have:
1. ✅ All entity modals use shared ModalHeader component
2. ✅ All entity modals use shared ArchivedBanner component
3. ✅ All entity modals use shared DeletedBanner component
4. ✅ All entity adapters have identical action descriptor logic
5. ✅ Badge shows correct state for ALL entities
6. ✅ Banner appears for ALL archived entities
7. ✅ Buttons are correct for ALL entities in all states

### Verification:
- Archive any entity → badge changes to "ARCHIVED", banner appears, buttons change
- Restore any entity → badge changes to "ACTIVE", banner disappears, buttons change
- Delete any entity → badge changes to "DELETED", deletion banner appears, buttons disappear

---

## Additional Notes

### Backend State Contract
All entity detail endpoints MUST return:
```json
{
  "data": { /* entity fields */ },
  "state": "active" | "archived" | "deleted",
  "archivedAt": "ISO date" (optional),
  "archivedBy": "USER-ID" (optional),
  "deletedAt": "ISO date" (optional),
  "deletedBy": "USER-ID" (optional)
}
```

### ModalProvider Contract
ModalProvider receives state from backend and passes to ModalGateway:
```tsx
<ModalGateway
  isOpen={true}
  entityType="product"
  entityId="PRD-003"
  options={{
    data: { /* entity data */ },
    state: 'archived',
    archivedAt: '2025-10-29T...',
    archivedBy: 'ADMIN'
  }}
/>
```

### ModalGateway Contract
ModalGateway extracts state and passes to entity modal:
```tsx
const { state, archivedAt, archivedBy, deletedAt, deletedBy } = options;

<EntityModal
  entityData={options.data}
  state={state}
  archivedAt={archivedAt}
  archivedBy={archivedBy}
  deletedAt={deletedAt}
  deletedBy={deletedBy}
/>
```

---

## Files Reference

### Frontend:
- `apps/frontend/src/components/ModalGateway.tsx` - Routes to entity modals
- `apps/frontend/src/contexts/ModalProvider.tsx` - Fetches data, passes state
- `apps/frontend/src/config/entityRegistry.tsx` - Entity adapters with action descriptors
- `apps/frontend/src/components/modals/` - Modular components (TO CREATE)
- `packages/ui/src/modals/` - Entity-specific modal components

### Backend:
- `apps/backend/server/shared/entityCatalog.ts` - Entity metadata
- `apps/backend/server/domains/catalog/routes.fastify.ts` - Product/service endpoints
- `apps/backend/server/domains/profile/routes.fastify.ts` - User profile endpoints
- `apps/backend/server/domains/archive/store.ts` - Archive operations

---

## Critical Bugs Fixed Today

1. ✅ Entity catalog wrong table name for products (`product_catalog` → `catalog_products`)
2. ✅ Product details endpoint now returns state correctly
3. ⚠️ Action descriptors still need standardization across all entities
4. ❌ Modal header badge not reading state
5. ❌ Archived banner component not rendering

**Next:** GPT5 implements modular solution to fix ALL entities at once.
