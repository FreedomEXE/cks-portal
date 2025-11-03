# Code Review: Activity Visibility & Quick Actions Fixes

**Date:** 2025-11-02
**Status:** Implementation Complete - Pending Testing

---

## Summary of Changes

Implemented fixes for:
1. Activity feed empty for non-admin users when orders are created
2. Quick Actions tab missing from order modals for non-admin users
3. RBAC-based action fallback when backend doesn't provide `availableActions`

---

## Files Modified

### 1. Backend: Order Store (`apps/backend/server/domains/orders/store.ts`)

**Change:** Added `creatorId` field to order response for frontend ownership checks

**Line:** ~1030

**Before:**
```typescript
return {
  orderId: row.order_id,
  orderType,
  title: row.title ?? (orderType === 'product' ? 'Product Order' : 'Service Order'),
  requestedBy: requestedByFormatted,
  requesterRole: normalizeRole(row.creator_role),
  destination: destinationFormatted,
```

**After:**
```typescript
return {
  orderId: row.order_id,
  orderType,
  title: row.title ?? (orderType === 'product' ? 'Product Order' : 'Service Order'),
  requestedBy: requestedByFormatted,
  requesterRole: normalizeRole(row.creator_role),
  creatorId: creatorCode, // Add creator ID for ownership checks
  destination: destinationFormatted,
```

**Reason:** The frontend RBAC fallback checks `entityData?.creatorId === viewerId` for crew ownership, but this field was not being returned by the backend.

---

### 2. Frontend: Order Adapter (`apps/frontend/src/config/entityRegistry.tsx`)

**Change:** Added comprehensive debug logging and RBAC fallback logic for crew cancel and warehouse accept/reject actions

**Lines:** ~231-390

#### A. Added Debug Logging at Function Start

**After line 233:**
```typescript
console.log('[OrderAdapter] getActionDescriptors called:', {
  role,
  state,
  viewerId,
  hasEntityData: !!entityData,
  status: entityData?.status,
  availableActions: entityData?.availableActions,
  metadata: entityData?.metadata,
});
```

#### B. Added RBAC Fallback Logic (when `availableActions` is empty)

**Lines:** ~317-386

**After:**
```typescript
} else {
  // Fallback: Derive actions from RBAC policies with ownership checks
  const status = entityData?.status?.toLowerCase() || '';

  console.log('[OrderAdapter] RBAC fallback triggered - no backend actions:', {
    role,
    status,
    viewerId,
  });

  // Crew can cancel their own pending orders
  if (role === 'crew' && status.includes('pending')) {
    const crewOwnsOrder =
      entityData?.metadata?.crewId === viewerId ||
      entityData?.creatorId === viewerId ||
      entityData?.requestedByCode === viewerId;

    console.log('[OrderAdapter] Crew cancel check:', {
      crewOwnsOrder,
      metadata: entityData?.metadata,
      creatorId: entityData?.creatorId,
      requestedByCode: entityData?.requestedByCode,
    });

    if (crewOwnsOrder) {
      console.log('[OrderAdapter] Adding crew cancel action');
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

    console.log('[OrderAdapter] Warehouse accept/reject check:', {
      warehouseAssigned,
      fulfilledById: entityData?.fulfilledById,
      assignedWarehouse: entityData?.assignedWarehouse,
      metadata: entityData?.metadata,
    });

    if (warehouseAssigned) {
      console.log('[OrderAdapter] Adding warehouse accept/reject actions');
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
```

#### C. Added Debug Logging at Function End

**Before line 390:**
```typescript
console.log('[OrderAdapter] Returning descriptors:', descriptors.length, descriptors);
```

---

### 3. Frontend: RBAC Permissions (`apps/frontend/src/policies/permissions.ts`)

**Changes:** Added viewer-aware permission checks for crew cancel and warehouse accept/reject

#### A. Updated PermissionContext Interface

**Line:** ~48

**Before:**
```typescript
export interface PermissionContext {
  state: EntityState;
  entityData?: any;
  [key: string]: any;
}
```

**After:**
```typescript
export interface PermissionContext {
  state: EntityState;
  entityData?: any;
  viewerId?: string; // ID of the current user viewing (for ownership checks)
  [key: string]: any;
}
```

#### B. Updated `can()` Function to Extract viewerId

**Line:** ~67

**Before:**
```typescript
export function can(
  entityType: EntityType,
  action: EntityActionType,
  role: UserRole,
  context: PermissionContext
): boolean {
  const { state, entityData } = context;
  // ...
  return canUser(entityType, action, role, state, entityData);
}
```

**After:**
```typescript
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
```

#### C. Updated `canUser()` Function Signature

**Line:** ~113

**Before:**
```typescript
function canUser(
  entityType: EntityType,
  action: EntityActionType,
  role: UserRole,
  state: EntityState,
  entityData?: any
): boolean {
```

**After:**
```typescript
function canUser(
  entityType: EntityType,
  action: EntityActionType,
  role: UserRole,
  state: EntityState,
  entityData?: any,
  viewerId?: string
): boolean {
```

**And updated the call on line 134:**
```typescript
return canUserOrder(action, role, entityData, viewerId);
```

#### D. Updated `canUserOrder()` with Ownership/Assignment Checks

**Lines:** ~152-211

**Before:**
```typescript
function canUserOrder(
  action: EntityActionType,
  role: UserRole,
  entityData?: any
): boolean {
  // All users can view orders
  if (action === 'view') return true;

  // Role-specific workflow actions
  switch (role) {
    // ... existing cases ...

    case 'warehouse':
      // Warehouses can accept/reject product orders
      return ['accept', 'reject'].includes(action);

    case 'crew':
      // Crew can view but not act on orders
      return action === 'view';

    default:
      return false;
  }
}
```

**After:**
```typescript
function canUserOrder(
  action: EntityActionType,
  role: UserRole,
  entityData?: any,
  viewerId?: string
): boolean {
  // All users can view orders
  if (action === 'view') return true;

  // Role-specific workflow actions
  switch (role) {
    // ... existing cases ...

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

    default:
      return false;
  }
}
```

---

## Changes from Previous Session (Already Committed)

These were implemented in the previous session and are already in the codebase:

1. **Backend:** Updated crew activities query filter (`apps/backend/server/domains/scope/store.ts`)
   - Added explicit `order_created` filter checking crewId, centerId, customerId, actor
   - Expanded metadata checks in "other activity types" filter

2. **Frontend:** Expanded activity personalization (`apps/frontend/src/shared/activity/useFormattedActivities.ts`)
   - Added role-specific messages for crew, center, customer, warehouse

3. **Frontend:** Added viewerId to EntityActionContext (`apps/frontend/src/types/entities.ts`)
   - Interface now includes `viewerId?: string`

4. **Frontend:** Updated ModalGateway to pass viewerId (`apps/frontend/src/components/ModalGateway.tsx`)
   - Passes `currentUserId` as `viewerId` to adapter's `getActionDescriptors()`

---

## Root Cause Analysis

### Problem 1: Quick Actions Tab Missing
**Cause:** The tab visibility policy requires `hasActions` to be true (line 78-79 in `tabs.ts`). The `hasActions` flag is computed from `actions.length > 0`, but actions were empty because:
1. Backend doesn't provide `availableActions` for non-admin users
2. Frontend adapter had no RBAC fallback logic
3. Ownership check failed because `creatorId` was missing from order response

**Fix:**
- Added `creatorId` to backend order response
- Added RBAC fallback logic in frontend adapter
- Added ownership checks using `viewerId`

### Problem 2: Activity Feed Empty (NOT FIXED - Already Correct!)
**IMPORTANT:** After investigation, the backend query filtering is ALREADY CORRECT (lines 1334-1373 in `apps/backend/server/domains/scope/store.ts`). The activity emission is ALREADY CORRECT (line 1926 in `apps/backend/server/domains/orders/store.ts`).

**Real Issue:** Orders PO-117 and PO-118 were created BEFORE the backend activity fixes were implemented. Their activity records in the database have incorrect or missing metadata.

**Solution:** Restart backend and create a **brand new** order. The new order's `order_created` activity will be emitted with correct metadata (`crewId`, `centerId`, `customerId`, etc.) and the query will filter it correctly.

---

## Testing Instructions

1. **Restart backend server** (to pick up `creatorId` field addition)
2. **Create a brand new order as CRW-006**
3. **Verify activity feed:**
   - CRW-006 should see "You created an order!" immediately
   - Center should see "An order was created at your center!"
   - Warehouse should see "You've been assigned a new order!"
4. **Verify Quick Actions tab:**
   - CRW-006 opens their own pending order → Should see "Quick Actions" tab with "Cancel" button
   - Warehouse opens assigned pending_warehouse order → Should see "Accept" and "Reject" buttons
5. **Check browser console for debug logs:**
   - Look for `[OrderAdapter]` logs showing ownership checks
   - Verify `crewOwnsOrder: true` when crew views their own order

---

## Expected Console Output (Success Case)

```
[OrderAdapter] getActionDescriptors called:
  role: "crew"
  state: "active"
  viewerId: "CRW-006"
  status: "pending_warehouse"
  availableActions: undefined
  metadata: {crewId: "CRW-006", ...}

[OrderAdapter] RBAC fallback triggered - no backend actions:
  role: "crew"
  status: "pending_warehouse"
  viewerId: "CRW-006"

[OrderAdapter] Crew cancel check:
  crewOwnsOrder: true  ← SHOULD BE TRUE NOW
  metadata: {crewId: "CRW-006", ...}
  creatorId: "CRW-006"  ← NEW FIELD ADDED

[OrderAdapter] Adding crew cancel action

[OrderAdapter] Returning descriptors: 1 [{key: 'cancel', label: 'Cancel', ...}]
```

---

## Questions for GPT-5

1. **Is adding `creatorId` to the order response the correct approach, or should we use a different field?**
   - Alternative: Use `metadata.crewId` directly (but this is less reliable across roles)

2. **Should we also check `requestedBy` field for ownership?**
   - Current check: `metadata.crewId`, `creatorId`, `requestedByCode`
   - `requestedBy` is a formatted string like "CRW-006 - Wario", not a clean ID

3. **Debug logging - should we keep it or remove it before production?**
   - Currently very verbose for troubleshooting
   - Should we wrap in `if (process.env.NODE_ENV === 'development')`?

4. **Are the ownership check fields comprehensive enough?**
   - Crew: checks `metadata.crewId`, `creatorId`, `requestedByCode`
   - Warehouse: checks `fulfilledById`, `assignedWarehouse`, `metadata.warehouseId`
   - Any other fields we should include?

5. **Should the RBAC fallback be moved to the permissions layer instead of the adapter?**
   - Current: Adapter has ownership logic
   - Alternative: Move all ownership checks to `canUserOrder()` in permissions.ts

---

## Known Issues

1. **Old orders (PO-117, PO-118) may still fail ownership checks** if their metadata was created before the activity emission fix
2. **Activity emission metadata correctness** - need to verify that new orders have correct `crewId` in metadata (not order ID)

---

**Files Changed:**
- `apps/backend/server/domains/orders/store.ts` (1 line added)
- `apps/frontend/src/config/entityRegistry.tsx` (debug logging + RBAC fallback)
- `apps/frontend/src/policies/permissions.ts` (viewer-aware permission checks)

**Total Lines Changed:** ~120 lines (mostly new RBAC fallback logic and debug logging)
