# Issue #3: Order Created Activity Not Visible to Stakeholders

**Status:** 🔧 IN PROGRESS
**Priority:** CRITICAL (Phase 1)
**Date:** 2025-11-03

---

## Problem

When a crew creates an order (e.g., CRW-006-PO-124):
- ✅ Activity appears in Crew hub: "You created an order!"
- ✅ Activity appears in Admin hub: "Created Product Order CRW-006-PO-124"
- ❌ Activity DOES NOT appear in Center hub
- ❌ Activity DOES NOT appear in Warehouse hub
- ❌ Activity DOES NOT appear in Customer hub
- ❌ Activity DOES NOT appear in Manager hub

**Impact:** Stakeholders can't discover new orders via activity feed, must manually check Orders section.

---

## Root Cause Analysis

### Location
`apps/backend/server/domains/scope/store.ts`

### The Bug
Activity query for all roles (Crew, Warehouse, Center, etc.) has this pattern:

```sql
-- Line 1428
(activity_type LIKE '%_created' AND UPPER(target_id) = $2)
```

This means: Show `*_created` activities ONLY if `target_id` equals the viewer's code.

**For user entities:** This works
- `manager_created` with `target_id='MGR-001'` → Shows to MGR-001 ✅
- `crew_created` with `target_id='CRW-006'` → Shows to CRW-006 ✅

**For order entities:** This NEVER works
- `order_created` with `target_id='CRW-006-PO-124'` → Never shows to anyone except admin ❌
- Order ID ≠ User code, so condition never matches

### Why Admin Sees It
Admin query doesn't have this restriction - it shows all activities.

### Why Crew Creator Sees It
Frontend personalizes the activity to "You created an order!" when `actorId === viewerId`.

---

## Solution Design

### Approach
Add special handling for `order_created` (and similar entity creations) to check metadata fields instead of target_id.

### New Logic
```sql
-- OLD: Only show if target_id = viewer
(activity_type LIKE '%_created' AND UPPER(target_id) = $2)

-- NEW: Show if target_id = viewer OR metadata contains viewer
(activity_type LIKE '%_created' AND (
  UPPER(target_id) = $2
  OR (metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $2)
  OR (metadata ? 'centerId' AND UPPER(metadata->>'centerId') = $2)
  OR (metadata ? 'customerId' AND UPPER(metadata->>'customerId') = $2)
  OR (metadata ? 'contractorId' AND UPPER(metadata->>'contractorId') = $2)
  OR (metadata ? 'managerId' AND UPPER(metadata->>'managerId') = $2)
  OR (metadata ? 'warehouseId' AND UPPER(metadata->>'warehouseId') = $2)
))
```

### Why This Works
When `order_created` is recorded (apps/backend/server/domains/orders/store.ts:1921-1938), metadata includes:
```typescript
metadata: {
  orderId,
  orderType,
  customerId: customerId ?? undefined,
  centerId: centerId ?? undefined,
  contractorId: contractorId ?? undefined,
  managerId: managerId ?? undefined,
  crewId: crewId ?? undefined,
  warehouseId: assignedWarehouse ?? undefined,
}
```

So:
- Center sees it if `metadata.centerId` matches their code
- Warehouse sees it if `metadata.warehouseId` matches their code
- Manager sees it if `metadata.managerId` matches their code
- Etc.

---

## Implementation Plan

### Step 1: Fix getCrewActivities
File: `apps/backend/server/domains/scope/store.ts`
Lines: ~1360-1370 (where Crew activity query is)

### Step 2: Fix getWarehouseActivities
Same file, lines: ~1428

### Step 3: Fix getCenterActivities
Same file, lines: ~1287

### Step 4: Fix getCustomerActivities
Same file, lines: ~1200

### Step 5: Fix getManagerActivities
Same file, lines: ~450

### Step 6: Fix getContractorActivities
Same file, lines: ~1104

**Note:** All six role queries have the SAME bug pattern, so apply same fix to all.

---

## Files to Change

- `apps/backend/server/domains/scope/store.ts` - Activity queries for all 6 roles

---

## Testing Plan

### Test Order
1. Crew (CRW-006) creates order CRW-006-PO-125
2. Check Center hub - Should see "Created Product Order"
3. Check Warehouse hub - Should see "Created Product Order"
4. Check Customer hub (if involved) - Should see "Created Product Order"
5. Check Manager hub - Should see "Created Product Order"
6. Check Admin hub - Should see "Created Product Order CRW-006-PO-125"
7. Check Crew hub - Should see "You created an order!"

### Verification
```sql
-- Check activity was recorded
SELECT * FROM system_activity
WHERE activity_type = 'order_created'
AND target_id = 'CRW-006-PO-125';

-- Check metadata contains stakeholders
SELECT metadata FROM system_activity
WHERE target_id = 'CRW-006-PO-125';
```

---

## Risk Assessment

### Low Risk
- Change is purely additive (OR clauses)
- Doesn't remove existing functionality
- Metadata fields are already being set correctly

### Regression Risk
- User entity creations still work (target_id check unchanged)
- Activity dismissals still work (separate WHERE clause)
- Admin query unchanged

---

## Status: ✅ IMPLEMENTED - TESTING NEEDED

Applied fix to all 5 role queries (Manager, Contractor, Customer, Center, Warehouse).
Note: Crew already had the correct implementation.

Next: Check backend compilation, then test with real order creation.
