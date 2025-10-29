# GPT5 Task: Fix Archive Modal Issues with Modular Solution

## Context
We have a universal modal system that handles all entity types (products, services, users, orders, reports, feedback). Currently, the archive functionality is implemented inconsistently across entities, creating technical debt. We need a modular solution that works for ALL entities.

## Problem Statement
**Screenshots provided show:**
1. ✅ Archived users (WHS-004) work perfectly - shows badge, banner, and correct buttons
2. ❌ Archived products (PRD-003) broken - wrong badge, no banner, wrong buttons
3. ⚠️ Archived services (SRV-001) partial - buttons work, but wrong badge text and no banner

**Read the full diagnosis:** `docs/ARCHIVE-MODAL-ISSUES-DIAGNOSIS.md`

## Your Mission
Create reusable, modular components that ALL entity modals can use for archive functionality. No more entity-specific implementations.

---

## Phase 1: Create Modular Components

### Task 1.1: Create `<ModalHeader>` Component
**File:** `apps/frontend/src/components/modals/ModalHeader.tsx`

**Requirements:**
- Show entity ID, name, type label
- Show state badge (top-right):
  - `state === 'active'` → Green badge "ACTIVE"
  - `state === 'archived'` → Gray badge "ARCHIVED"
  - `state === 'deleted'` → Red badge "DELETED"
- Include close button
- NO entity-specific logic

**Props:**
```tsx
interface ModalHeaderProps {
  entityId: string;
  entityName: string;
  entityType: string;          // Display label: "Product", "Service", "Manager", etc.
  state: 'active' | 'archived' | 'deleted';
  onClose: () => void;
}
```

**Reference:** Look at existing user modals to see what header structure works

### Task 1.2: Create `<ArchivedBanner>` Component
**File:** `apps/frontend/src/components/modals/ArchivedBanner.tsx`

**Requirements:**
- Only render if `state === 'archived'`
- Blue info banner with trash icon
- Show: "Archived {EntityType}"
- Show: "This {entityType} has been archived and is scheduled for deletion."
- Show metadata: "Archived: {date}  By: {user}  ID: {id}"
- NO entity-specific logic

**Props:**
```tsx
interface ArchivedBannerProps {
  entityType: string;          // "product", "service", "manager", etc.
  entityId: string;
  archivedAt?: string;         // ISO date string
  archivedBy?: string;         // User ID
  state: 'active' | 'archived' | 'deleted';
}
```

**Reference:** Check archived user modal (WHS-004 screenshot) for exact styling

### Task 1.3: Verify/Create `<DeletedBanner>` Component
**File:** `apps/frontend/src/components/modals/DeletedBanner.tsx`

**Requirements:**
- Check if this component already exists
- If not, create it with same pattern as ArchivedBanner
- Only render if `state === 'deleted'`
- Red warning banner
- Show deletion metadata

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

---

## Phase 2: Standardize Entity Action Descriptors

### Task 2.1: Create Standard Pattern
**File:** `apps/frontend/src/config/entityRegistry.tsx`

**Find all entity adapters and apply this EXACT pattern:**

```tsx
getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
  const { role, state } = context;

  // Only admins can perform lifecycle actions
  if (role !== 'admin') return [];

  // Active entities: Edit + Archive
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
        confirm: `Are you sure you want to archive this ${entityTypeName}? It will be scheduled for deletion.`,
        closeOnSuccess: true
      }
    ];
  }

  // Archived entities: Restore + Delete
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
        confirm: `Are you sure you want to permanently delete this ${entityTypeName}? This action cannot be undone.`,
        closeOnSuccess: true
      }
    ];
  }

  // Deleted entities: No actions
  return [];
}
```

### Task 2.2: Apply to ALL Entity Adapters
**Entities in entityRegistry.tsx:**
- ✅ `manager`, `contractor`, `customer`, `center`, `crew`, `warehouse` - use as reference (should already work)
- ❌ `product` - FIX action descriptors
- ⚠️ `catalogService` - VERIFY and fix action descriptors
- ❓ `order` - ADD action descriptors (if missing)
- ❓ `service` (active services) - ADD action descriptors (if missing)
- ❓ `report` - ADD action descriptors (if missing)
- ❓ `feedback` - ADD action descriptors (if missing)

**IMPORTANT:** The logic should be IDENTICAL for all entities. Do not add entity-specific conditions.

---

## Phase 3: Update Entity Modal Components

### Task 3.1: Find All Modal Components
**Directory:** `packages/ui/src/modals/`

**For each modal component:**
1. Remove entity-specific header logic
2. Import and use `<ModalHeader>`
3. Import and use `<ArchivedBanner>`
4. Import and use `<DeletedBanner>`

### Task 3.2: Update Modal Structure
**Pattern to apply:**

```tsx
import { ModalHeader } from '@/components/modals/ModalHeader';
import { ArchivedBanner } from '@/components/modals/ArchivedBanner';
import { DeletedBanner } from '@/components/modals/DeletedBanner';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityData: any;
  state: 'active' | 'archived' | 'deleted';
  archivedAt?: string;
  archivedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  // ... other props
}

export function EntityModal({
  isOpen,
  onClose,
  entityData,
  state,
  archivedAt,
  archivedBy,
  deletedAt,
  deletedBy,
  // ... other props
}: EntityModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Modular header - works for ALL entities */}
      <ModalHeader
        entityId={entityData.id}
        entityName={entityData.name}
        entityType="Product"  // or dynamic from props
        state={state}
        onClose={onClose}
      />

      {/* Modular archived banner - conditionally renders */}
      <ArchivedBanner
        entityType="product"
        entityId={entityData.id}
        archivedAt={archivedAt}
        archivedBy={archivedBy}
        state={state}
      />

      {/* Modular deleted banner - conditionally renders */}
      <DeletedBanner
        entityType="product"
        entityId={entityData.id}
        deletedAt={deletedAt}
        deletedBy={deletedBy}
        state={state}
      />

      {/* Existing tab content */}
      <Tabs>
        {/* tabs */}
      </Tabs>
    </Modal>
  );
}
```

### Task 3.3: Ensure Props Are Passed
**Check:** `apps/frontend/src/components/ModalGateway.tsx`

Make sure ModalGateway extracts state and lifecycle metadata from options and passes to each entity modal:

```tsx
const { state, archivedAt, archivedBy, deletedAt, deletedBy } = options;

<EntityModal
  entityData={options.data}
  state={state || 'active'}
  archivedAt={archivedAt}
  archivedBy={archivedBy}
  deletedAt={deletedAt}
  deletedBy={deletedBy}
  // ... other props
/>
```

---

## Phase 4: Testing Checklist

### For EACH Entity Type (Products, Services, Users, etc.):

#### Test Active State:
- [ ] Open active entity modal
- [ ] Badge shows "ACTIVE" in green
- [ ] No banners appear
- [ ] Admin sees: Edit + Archive buttons
- [ ] Non-admin sees: no lifecycle buttons

#### Test Archived State:
- [ ] Archive an entity
- [ ] Open archived entity modal
- [ ] Badge shows "ARCHIVED" in gray
- [ ] Archived banner appears with metadata
- [ ] Admin sees: Restore + Permanently Delete buttons
- [ ] Non-admin sees: no lifecycle buttons (or read-only)

#### Test Deleted State (if applicable):
- [ ] Delete an archived entity
- [ ] Open deleted entity modal
- [ ] Badge shows "DELETED" in red
- [ ] Deleted banner appears with metadata
- [ ] No action buttons appear

### Entities to Test:
1. Product (PRD-003 or any)
2. Catalog Service (SRV-001 or any)
3. Manager (MGR-001 or any)
4. Contractor (CON-001 or any)
5. Customer (CUS-001 or any)
6. Center (CEN-001 or any)
7. Crew (CRW-001 or any)
8. Warehouse (WHS-004 or any)
9. Order (if applicable)
10. Active Service (if applicable)
11. Report (if applicable)
12. Feedback (if applicable)

---

## Success Criteria

### Code Quality:
- ✅ ModalHeader component is reusable for ALL entities
- ✅ ArchivedBanner component is reusable for ALL entities
- ✅ DeletedBanner component is reusable for ALL entities
- ✅ Entity adapters have IDENTICAL action descriptor logic
- ✅ No entity-specific conditionals in modular components

### Functional Requirements:
- ✅ Badge shows correct state for ALL entities
- ✅ Archived banner appears for ALL archived entities
- ✅ Deleted banner appears for ALL deleted entities
- ✅ Action buttons are correct for ALL entities in all states
- ✅ State transitions work correctly (active → archived → deleted)

### User Experience:
- ✅ Archived products look exactly like archived users (except entity-specific content)
- ✅ Archived services look exactly like archived users (except entity-specific content)
- ✅ All entities have consistent visual treatment for lifecycle states

---

## Important Notes

### Backend Contract (Already Implemented)
All entity detail endpoints return:
```json
{
  "data": { /* entity-specific fields */ },
  "state": "active" | "archived" | "deleted",
  "archivedAt": "2025-10-29T...",
  "archivedBy": "ADMIN",
  "deletedAt": "2025-10-29T...",
  "deletedBy": "ADMIN"
}
```

### ModalProvider Contract (Already Implemented)
ModalProvider fetches data and passes state to ModalGateway:
```tsx
<ModalGateway
  options={{
    data: { /* entity data */ },
    state: 'archived',
    archivedAt: '...',
    archivedBy: '...'
  }}
/>
```

### What You DON'T Need to Change:
- ❌ Backend endpoints (already return correct state)
- ❌ ModalProvider (already passes state correctly)
- ❌ Archive system (already works correctly)
- ❌ Entity adapters' action handlers (edit, archive, restore, delete handlers are separate)

### What You DO Need to Change:
- ✅ Create modular header/banner components
- ✅ Standardize action descriptors in entity registry
- ✅ Update entity modals to use modular components
- ✅ Ensure ModalGateway passes state props to ALL modals

---

## Code Style Requirements

1. **TypeScript:** Use proper types for all props
2. **Imports:** Use relative imports from @/components or @cks/ui as appropriate
3. **Components:** Functional components with proper prop destructuring
4. **Conditional Rendering:** Use `{condition && <Component />}` pattern
5. **Consistency:** Modal structure should be IDENTICAL across all entities
6. **Comments:** Add brief comments explaining modular component placement

---

## Deliverables

### Phase 1 (Components):
- `apps/frontend/src/components/modals/ModalHeader.tsx`
- `apps/frontend/src/components/modals/ArchivedBanner.tsx`
- `apps/frontend/src/components/modals/DeletedBanner.tsx` (create or verify)

### Phase 2 (Entity Registry):
- Updated `apps/frontend/src/config/entityRegistry.tsx`
  - All entity adapters have standardized `getActionDescriptors()`

### Phase 3 (Modal Updates):
- All modal components in `packages/ui/src/modals/` updated to use modular components
- Updated `apps/frontend/src/components/ModalGateway.tsx` (if needed)

### Phase 4 (Testing):
- Test report showing all entities in all states
- Screenshots or confirmation that all tests pass

---

## Questions to Ask Before Starting

1. Do you see any existing header/banner components that can be refactored instead of creating new ones?
2. Are there any entity-specific edge cases I should be aware of?
3. Should the badge/banner styling be extracted to a shared CSS module?
4. Are there any accessibility requirements for the banners (ARIA labels, etc.)?

---

## Timeline Estimate
- Phase 1: 1-2 hours (component creation)
- Phase 2: 1-2 hours (entity registry standardization)
- Phase 3: 2-3 hours (modal component updates)
- Phase 4: 1 hour (testing)

**Total: 5-8 hours**

---

## Final Notes

This is a **critical architectural fix** that will prevent technical debt for all future entity types. The goal is to make archive functionality **completely modular** so that adding a new entity type automatically gets correct archive behavior without custom code.

**DO NOT rush this.** Take time to:
1. Understand the existing user modal implementation (it works correctly)
2. Extract the reusable patterns
3. Apply consistently to ALL entities
4. Test thoroughly

Your work will unblock migrations for orders, active services, reports, and feedback. Get this right and we save weeks of work.
