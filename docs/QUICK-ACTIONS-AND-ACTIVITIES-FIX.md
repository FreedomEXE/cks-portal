# Quick Actions & Activities Fix - Complete Solution

**Date:** 2025-11-03
**Status:** ✅ FIXED for Orders | 🔄 TODO: Service Orders, Services, Reports, Feedback

---

## Problem Summary

**Issue 1:** Quick Actions tab missing for non-admin users
**Issue 2:** Activities (order_created) not showing for non-admin users

**Root Causes:**
1. Activity filter was hiding ALL `*_created` events unless targetId matched viewer
2. Frontend ownership check looked for `metadata.crewId` which wasn't being set
3. `creatorId` was being returned but ownership check also needed `metadata.crewId`

---

## Complete Fix (3 Parts)

### Part 1: Activity Filter Fix (Frontend)

**File:** `apps/frontend/src/shared/activity/useFormattedActivities.ts`
**Lines:** 370-385

**Problem:** The guard filtered ALL `*_created` events by targetId. This worked for user entities (targetId = user code) but broke for orders (targetId = order ID).

**Solution:** Create an allowlist of user-entity creation types. Only filter those by targetId.

```typescript
// Before (line 371-373):
if (type.endsWith('_created')) {
  return (a.targetId || '').toUpperCase() === viewer;
}

// After (line 370-385):
const userCreatedTypes = new Set([
  'manager_created',
  'contractor_created',
  'customer_created',
  'center_created',
  'crew_created',
  'warehouse_created',
]);
const filtered = filteredByCategory.filter((a) => {
  const type = (a.activityType || '').toLowerCase();
  // Only filter user-entity creations by targetId; let order/report/feedback creations through
  if (userCreatedTypes.has(type)) {
    return (a.targetId || '').toUpperCase() === viewer;
  }
  return true;
});
```

---

### Part 2: TypeScript Type Definition (Backend)

**File:** `apps/backend/server/domains/orders/types.ts`
**Line:** 75

**Problem:** `HubOrderItem` interface didn't include `creatorId` field.

**Solution:** Add `creatorId` to the interface.

```typescript
export interface HubOrderItem {
  orderId: string;
  orderType: 'service' | 'product';
  title: string | null;
  requestedBy: string | null;
  requesterRole: HubRole | null;
  creatorId: string | null;  // ← ADD THIS LINE
  destination: string | null;
  // ... rest of fields
}
```

---

### Part 3: Metadata Enrichment (Backend) ⭐ KEY FIX

**File:** `apps/backend/server/domains/orders/store.ts`
**Lines:** 1013-1016

**Problem:** Frontend ownership check looks for `metadata.crewId`, but this wasn't being set in the response metadata.

**Solution:** Add `crewId` to metadata during enrichment in `mapOrderRow()`.

```typescript
// Add this RIGHT AFTER the contacts enrichment block (after line 1011):

// Add role IDs to metadata for frontend ownership checks
if (row.crew_id && !(enrichedMetadata as any).crewId) {
  (enrichedMetadata as any).crewId = normalizeCodeValue(row.crew_id);
}
```

**Why this works:**
- Frontend checks: `entityData?.metadata?.crewId === viewerId`
- Database has: `crew_id` column = "CRW-006"
- Metadata now has: `crewId: "CRW-006"`
- Check passes: ✅ `"CRW-006" === "CRW-006"`

---

### Part 4: Frontend Ownership Check Cleanup

**File:** `apps/frontend/src/config/entityRegistry.tsx`
**Lines:** 329-331

**Problem:** Adapter was checking `requestedByCode` which doesn't exist in backend response.

**Solution:** Remove the non-existent field check.

```typescript
// Before (line 329-332):
const crewOwnsOrder =
  entityData?.metadata?.crewId === viewerId ||
  entityData?.creatorId === viewerId ||
  entityData?.requestedByCode === viewerId;  // ← REMOVE THIS

// After (line 329-331):
const crewOwnsOrder =
  entityData?.metadata?.crewId === viewerId ||
  entityData?.creatorId === viewerId;
```

**Same fix in:** `apps/frontend/src/policies/permissions.ts:199-201`

---

### Part 5: Debug Logging (Optional - Dev Only)

**File:** `apps/frontend/src/config/entityRegistry.tsx`
**Lines:** 235-245, 323-329, 337-343, 367-373, 377-379, 399-401

**Wrap all console.log in:**
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.log('[OrderAdapter] ...');
}
```

---

## Verification Checklist

After applying all fixes:

1. ✅ **Activity Feed:**
   - Crew creates order → sees "You created an order!"
   - Center sees "An order was created at your center!"
   - Admin sees all activities

2. ✅ **Quick Actions Tab:**
   - Crew opens own pending order → sees "Cancel" button
   - Warehouse opens assigned order → sees "Accept/Reject" buttons
   - Both paths (Orders section + Activity feed) show same actions

3. ✅ **Browser Console:**
   - `[OrderAdapter] Crew cancel check: crewOwnsOrder: true`
   - `[OrderAdapter] Returning descriptors: 1`
   - `[ModalGateway] hasActions: true`

---

## Replication Guide for Other Entity Types

### For Service Orders (Same as Product Orders)
- ✅ Already uses same `mapOrderRow()` function
- ✅ Same fix applies automatically

### For Active Services
**Files to update:**
1. `apps/backend/server/domains/services/types.ts` - Add `creatorId` to interface
2. `apps/backend/server/domains/services/store.ts` - Add metadata enrichment
3. Frontend adapter - Remove non-existent field checks

**Metadata enrichment pattern:**
```typescript
// In the service mapRow function, after contact enrichment:
if (row.crew_id && !(enrichedMetadata as any).crewId) {
  (enrichedMetadata as any).crewId = normalizeCodeValue(row.crew_id);
}
if (row.managed_by && !(enrichedMetadata as any).managerId) {
  (enrichedMetadata as any).managerId = normalizeCodeValue(row.managed_by);
}
```

### For Reports
**Files to update:**
1. `apps/backend/server/domains/reports/types.ts` - Add `creatorId` to interface
2. `apps/backend/server/domains/reports/store.ts` - Add metadata enrichment
3. Frontend adapter - Remove non-existent field checks

**Metadata enrichment:**
```typescript
if (row.reporter_id && !(enrichedMetadata as any).reporterId) {
  (enrichedMetadata as any).reporterId = normalizeCodeValue(row.reporter_id);
}
```

### For Feedback
**Files to update:**
1. `apps/backend/server/domains/feedback/types.ts` - Add `creatorId` to interface
2. `apps/backend/server/domains/feedback/store.ts` - Add metadata enrichment
3. Frontend adapter - Remove non-existent field checks

**Metadata enrichment:**
```typescript
if (row.submitter_id && !(enrichedMetadata as any).submitterId) {
  (enrichedMetadata as any).submitterId = normalizeCodeValue(row.submitter_id);
}
```

---

## Key Learnings

1. **Activity filtering must be entity-type aware** - User entities filter by targetId, but shared entities (orders/reports) don't
2. **Metadata is the bridge** - Frontend ownership checks rely on metadata, not just top-level fields
3. **Column names matter** - Database columns (crew_id) must be mapped to metadata (crewId) for frontend consumption
4. **Dual checks are good** - Both `creatorId` (top-level) and `metadata.crewId` ensure robustness
5. **TypeScript types must match** - Backend response must include fields defined in interface

---

## Files Modified

### Backend:
- ✅ `apps/backend/server/domains/orders/types.ts` (added creatorId to interface)
- ✅ `apps/backend/server/domains/orders/store.ts` (metadata enrichment)

### Frontend:
- ✅ `apps/frontend/src/shared/activity/useFormattedActivities.ts` (activity filter fix)
- ✅ `apps/frontend/src/config/entityRegistry.tsx` (ownership check + debug logs)
- ✅ `apps/frontend/src/policies/permissions.ts` (ownership check)

---

## Next Steps

1. 🔄 Apply to Service Orders (should already work since they use same mapOrderRow)
2. 🔄 Apply to Active Services
3. 🔄 Apply to Reports
4. 🔄 Apply to Feedback
5. ✅ Test all scenarios
6. ✅ Remove debug logs or ensure they're gated to dev only

---

**Success Criteria:**
- All non-admin users see activities for entities they're involved in
- Quick Actions tab appears for all users with appropriate permissions
- Ownership checks work consistently across all entity types

---

## Update - 2025-11-04 (Warehouse Delivery Flow)

- Frontend now maps action IDs for warehouse delivery lifecycle:
  - `start_delivery` → backend `start-delivery`
  - `complete_delivery`/`mark_delivered` → backend `deliver`
- Warehouse actions live in the universal modal and keep the modal open. The actions update in place after success.
- ActivityFeed opens orders via ID-first universally; legacy modal branches removed.
- Personalized activity copy added for:
  - `delivery_started`, `order_delivered`, `order_cancelled`
- Inventory updates occur on deliver (backend): `quantity_on_hand` decremented and `quantity_reserved` reduced with a floor at 0.
