# Activity Visibility & Quick Actions Parity - Implementation Summary

**Date:** 2025-11-02
**Status:** ✅ Implementation Complete (7/7 tasks done)

---

## Problem Statement

1. **Activity Feed Empty for Non-Admin:** Crew creates order, admin sees activity, crew sees nothing
2. **Quick Actions Missing for Non-Admin:** Order adapter relies on `availableActions` from backend, but hook doesn't provide it
3. **Root Causes:**
   - Backend query filters excluded `order_created` unless target was self
   - Frontend activity personalization only checked `customerId`
   - No RBAC fallback when `availableActions` is empty

---

## ✅ Completed Tasks (7/7)

### 1. Backend: Activity Emission Metadata ✅
**Status:** Already correct, no changes needed

Activity emission at order creation already includes all relevant IDs:
```typescript
metadata: {
  orderId,
  orderType,
  customerId, centerId, contractorId, managerId, crewId, warehouseId
}
```

### 2. Backend: Hub Activities Query Filter ✅
**File:** `apps/backend/server/domains/scope/store.ts`

**Changes Made:**
- Updated crew activities query to show `order_created` when viewer ID matches any metadata field
- Added explicit `order_created` filter checking crewId, centerId, customerId, actor
- Expanded metadata checks in "other activity types" filter to include all role IDs

**Before:**
```sql
(activity_type LIKE '%_created' AND UPPER(target_id) = $2) -- Only if target is self
```

**After:**
```sql
(activity_type = 'order_created' AND (
  (metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $2)
  OR (metadata ? 'centerId' AND UPPER(metadata->>'centerId') = $2)
  OR (metadata ? 'customerId' AND UPPER(metadata->>'customerId') = $2)
  OR (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
))
```

**Result:** Crew/Center/Customer/etc. now see order creation activities

### 3. Frontend: Activity Personalization ✅
**File:** `apps/frontend/src/shared/activity/useFormattedActivities.ts`

**Changes Made:**
- Expanded `order_created` personalization to check crewId, centerId, customerId, warehouseId, actorId
- Added viewer-specific messages for each role

**Before:**
```typescript
if (activityType === 'order_created') {
  const customerId = (metadata.customerId as string | undefined)?.toUpperCase();
  if (customerId === normalizedViewerId) {
    return `You created an order!`;
  }
}
```

**After:**
```typescript
if (activityType === 'order_created') {
  const crewId = (metadata.crewId as string | undefined)?.toUpperCase();
  const centerId = (metadata.centerId as string | undefined)?.toUpperCase();
  const customerId = (metadata.customerId as string | undefined)?.toUpperCase();
  const warehouseId = (metadata.warehouseId as string | undefined)?.toUpperCase();

  if (crewId === normalizedViewerId) return `You created an order!`;
  if (centerId === normalizedViewerId) return `An order was created at your center!`;
  if (customerId === normalizedViewerId) return `An order was created for your customer!`;
  if (warehouseId === normalizedViewerId) return `You've been assigned a new order!`;
  if (item.actorId?.toUpperCase() === normalizedViewerId) return `You created an order!`;
}
```

**Result:** All roles see personalized order creation messages

### 4. Frontend: Add viewerId to EntityActionContext ✅
**File:** `apps/frontend/src/types/entities.ts`

**Changes Made:**
- Added `viewerId?: string` to `EntityActionContext` interface

**Before:**
```typescript
export interface EntityActionContext {
  role: UserRole;
  state: EntityState;
  entityId: string;
  entityType: EntityType;
  entityData?: any;
}
```

**After:**
```typescript
export interface EntityActionContext {
  role: UserRole;
  state: EntityState;
  entityId: string;
  entityType: EntityType;
  entityData?: any;
  viewerId?: string; // ID of the current user viewing (for ownership checks)
}
```

**Result:** Adapters can now perform ownership checks

### 5. Frontend: Pass viewerId from ModalGateway ✅
**File:** `apps/frontend/src/components/ModalGateway.tsx`

**Changes Made:**
- Pass `currentUserId` as `viewerId` to adapter's `getActionDescriptors()`

**Before:**
```typescript
const descriptors = adapter.getActionDescriptors({
  role, state, entityId, entityType,
  entityData: data,
});
```

**After:**
```typescript
const descriptors = adapter.getActionDescriptors({
  role, state, entityId, entityType,
  entityData: data,
  viewerId: currentUserId,
});
```

**Result:** Adapters receive viewer ID for ownership-based permission checks

---

### 6. Frontend: RBAC-Based Action Fallback ✅
**File:** `apps/frontend/src/config/entityRegistry.tsx`

**Changes Made:**
- Updated `orderAdapter.getActionDescriptors()` to add fallback logic when `entityData.availableActions` is empty
- Crew can cancel their own pending orders (ownership check via viewerId)
- Warehouse can accept/reject assigned pending_warehouse orders (assignment check via viewerId)

**Implementation:**
```typescript
// In orderAdapter.getActionDescriptors() (lines ~272-355):

if (role !== 'admin' && state === 'active') {
  const availableActions = entityData?.availableActions || [];
  const actionLabels = availableActions.filter((label: string) =>
    label && label.toLowerCase() !== 'view details'
  );

  // If backend provided actions, use them
  if (actionLabels.length > 0) {
    // ... existing logic to map backend actions
  } else {
    // Fallback: Derive actions from RBAC policies with ownership checks
    const status = entityData?.status?.toLowerCase() || '';

    // Crew can cancel their own pending orders
    if (role === 'crew' && status.includes('pending')) {
      const crewOwnsOrder =
        entityData?.metadata?.crewId === viewerId ||
        entityData?.creatorId === viewerId ||
        entityData?.requestedByCode === viewerId;

      if (crewOwnsOrder) {
        descriptors.push({
          key: 'cancel',
          label: 'Cancel',
          variant: 'danger',
          confirm: 'Are you sure you want to cancel this order?',
          prompt: 'Optional: Provide a reason for cancellation',
          closeOnSuccess: true,
        });
      }
    }

    // Warehouse can accept/reject if assigned and status is pending_warehouse
    if (role === 'warehouse' && status === 'pending_warehouse') {
      const warehouseAssigned =
        entityData?.fulfilledById === viewerId ||
        entityData?.assignedWarehouse === viewerId ||
        entityData?.metadata?.warehouseId === viewerId;

      if (warehouseAssigned) {
        descriptors.push({
          key: 'accept',
          label: 'Accept',
          variant: 'primary',
          closeOnSuccess: true,
        });
        descriptors.push({
          key: 'reject',
          label: 'Reject',
          variant: 'danger',
          confirm: 'Are you sure you want to reject this order?',
          prompt: 'Please provide a reason for rejection:',
          closeOnSuccess: true,
        });
      }
    }
  }
}
```

**Result:** Non-admin users now have RBAC-based action fallback when backend doesn't provide availableActions

### 7. Frontend: Update RBAC Policies ✅
**File:** `apps/frontend/src/policies/permissions.ts`

**Changes Made:**
- Added `viewerId` to `PermissionContext` interface (line ~48)
- Updated `can()` function to extract and pass `viewerId` (line ~67)
- Updated `canUser()` to accept `viewerId` parameter (line ~119)
- Updated `canUserOrder()` with viewer-aware permission checks (lines ~152-211)

**Implementation:**
```typescript
// 1. Added viewerId to PermissionContext:
export interface PermissionContext {
  state: EntityState;
  entityData?: any;
  viewerId?: string; // ID of the current user viewing (for ownership checks)
  [key: string]: any;
}

// 2. Updated can() to extract viewerId:
export function can(
  entityType: EntityType,
  action: EntityActionType,
  role: UserRole,
  context: PermissionContext
): boolean {
  const { state, entityData, viewerId } = context;
  // ...
  return canUser(entityType, action, role, state, entityData, viewerId);
}

// 3. Updated canUserOrder with ownership/assignment checks:
function canUserOrder(
  action: EntityActionType,
  role: UserRole,
  entityData?: any,
  viewerId?: string
): boolean {
  // ... existing logic ...

  switch (role) {
    case 'warehouse':
      // Warehouse can accept/reject assigned pending_warehouse orders
      if ((action === 'accept' || action === 'reject') && viewerId) {
        const status = entityData?.status?.toLowerCase() || '';
        if (status !== 'pending_warehouse') return false;

        // Assignment check
        const warehouseAssigned =
          entityData?.fulfilledById === viewerId ||
          entityData?.assignedWarehouse === viewerId ||
          entityData?.metadata?.warehouseId === viewerId;

        return warehouseAssigned;
      }
      return false;

    case 'crew':
      // Crew can cancel their own pending orders
      if (action === 'cancel' && viewerId) {
        const status = entityData?.status?.toLowerCase() || '';
        if (!status.includes('pending')) return false;

        // Ownership check
        const crewOwnsOrder =
          entityData?.metadata?.crewId === viewerId ||
          entityData?.creatorId === viewerId ||
          entityData?.requestedByCode === viewerId;

        return crewOwnsOrder;
      }
      return action === 'view';
  }
}
```

**Result:** Permission system now supports viewer-aware ownership and assignment checks

---

## Testing Checklist

### Activity Feed
- [ ] Crew creates order → Sees "You created an order!" immediately
- [ ] Center sees "An order was created at your center!"
- [ ] Customer sees "An order was created for your customer!"
- [ ] Warehouse sees "You've been assigned a new order!"
- [ ] Manager/Contractor see order in their ecosystem
- [ ] Admin sees all order activities

### Quick Actions (After completing tasks 6-7)
- [ ] Crew opens their pending order → Sees "Cancel" button
- [ ] Crew clicks "Cancel" → Order cancelled
- [ ] Warehouse opens assigned pending_warehouse order → Sees "Accept" and "Reject"
- [ ] Warehouse clicks "Accept" → Order moves to pending_delivery
- [ ] Warehouse clicks "Reject" → Order rejected with reason
- [ ] Other roles (Center/Customer/Manager/Contractor) → View only (no actions)

### Modal Path Equivalence
- [ ] Crew clicks order in Orders section → Modal opens with actions
- [ ] Crew clicks order in Activity feed → Same modal, same actions
- [ ] Both paths show identical "Cancel" button
- [ ] Both paths call same API endpoint

---

## Files Modified

| File | Status | Changes |
|------|--------|---------|
| `apps/backend/server/domains/scope/store.ts` | ✅ Complete | Updated crew activities query filter |
| `apps/frontend/src/shared/activity/useFormattedActivities.ts` | ✅ Complete | Expanded order_created personalization |
| `apps/frontend/src/types/entities.ts` | ✅ Complete | Added viewerId to EntityActionContext |
| `apps/frontend/src/components/ModalGateway.tsx` | ✅ Complete | Pass viewerId to adapter |
| `apps/frontend/src/config/entityRegistry.tsx` | ✅ Complete | Added RBAC fallback in orderAdapter |
| `apps/frontend/src/policies/permissions.ts` | ✅ Complete | Added viewer-aware permission checks |

**Total:** 6 files (6 complete)

---

## Next Steps

1. ✅ ~~Implement RBAC fallback in order adapter (task 6)~~ - COMPLETE
2. ✅ ~~Update permissions policies with viewer checks (task 7)~~ - COMPLETE
3. Test all scenarios in checklist
4. Verify no regressions in admin workflows

---

## Known Issues / Future Enhancements

1. **Missing activity events:**
   - `order_accepted` not recorded (warehouse accept)
   - `order_approved` not recorded (manager approve for service orders)
   - Documented in plan, will address separately

2. **Backend `availableActions` enhancement:**
   - If backend adds viewer-aware `availableActions` to order details payload, the RBAC fallback won't trigger
   - Current fallback ensures parity even without backend changes

---

**Status:** ✅ All 7 tasks complete - Ready for testing
