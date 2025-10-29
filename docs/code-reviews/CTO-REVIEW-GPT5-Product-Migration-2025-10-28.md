# CTO Review: GPT5's Product Migration — 3 CRITICAL BUGS FOUND

Date: 2025-10-28
Author: CTO Review

---

## What GPT5 Got Right

1. Personalization Architecture — EXCELLENT
   - viewerRole parameter added to mapActivityRow (around line 149)
   - All 6 role call sites updated correctly (lines 453, 1107, 1203, 1289, 1373, 1466)
   - Admin sees canonical, users see friendly format ✅

2. Activity Categories — COMPLETE
   - product_created added (around line 107)
   - product_inventory_adjusted added (around line 134) ✅

3. Role-Specific Visibility — CORRECT
   - Crew: products only, no services (around line 1348) ✅
   - Warehouse: products + warehouse-filtered inventory (around lines 1434–1441) ✅
   - Manager/Contractor/Customer/Center: both services and products ✅

4. HistoryTab Import — EXISTS
   - Already imported at line 36 ✅

---

## CRITICAL BUG #1: Duplicate SQL Condition

Location: apps/backend/server/domains/scope/store.ts (around lines 420–427)

Problem:

```
OR
-- Catalog service creation events (visible to MGR/CON/CUS/CEN)
(activity_type = 'catalog_service_created')
OR
-- Catalog service creation events (visible to MGR/CON/CUS/CEN)  ❌ DUPLICATE
(activity_type = 'catalog_service_created')
OR
-- Product creation events (visible to all roles)
(activity_type = 'product_created')
```

Impact: Redundant query condition (doesn't break functionality but unprofessional)

Fix: Remove the duplicated middle condition.

---

## CRITICAL BUG #2: Missing getAuthToken Prop

Location: apps/frontend/src/config/entityRegistry.tsx (around line 1685)

Problem:

```tsx
<HistoryTab
  entityType={context.entityType}
  entityId={entityData?.productId}
/>  // ❌ Missing getAuthToken
```

Compare to catalogService (around line 1554):

```tsx
<HistoryTab
  entityType="catalogService"
  entityId={entityData?.serviceId}
  getAuthToken={context.getAuthToken}
/>  // ✅ Has auth
```

Impact: History tab API calls may fail without auth token; tab will be broken under protected endpoints.

Fix: Add `getAuthToken={context.getAuthToken}` to the product HistoryTab usage.

---

## CRITICAL BUG #3: Wrong Actor for Inventory Adjustments

Location: apps/backend/server/domains/inventory/store.ts (around line 141)

Problem:

```ts
actorId: normalizeIdentity(warehouseId) || warehouseId,
actorRole: 'warehouse',
```

Issue: `warehouseId` is the location (e.g., "WHS-001"), not the person making the adjustment. The activity should attribute the authenticated user (admin or warehouse user), not the warehouse.

Impact: Activity log will show "WHS-001 adjusted PRD-001 inventory" instead of "MGR-012 adjusted PRD-001 inventory".

Fix Needed:

In the route handler, read the authenticated user and pass into the store function:

```ts
const actorId = account.cksCode;   // e.g., from requireActiveRole
const actorRole = account.role;    // 'admin' or 'warehouse'

await updateInventoryQuantity({
  warehouseId,
  itemId,
  quantityChange,
  reason,
  actorId,      // ✅ pass real actor
  actorRole,    // ✅ pass real role
});
```

Then update the store signature and use these values when recording activity.

---

## Missing Implementation

Product Creation Activity Recording

No code found for recording `product_created` on product creation. Add to the product creation endpoint:

```ts
await recordActivity({
  activityType: 'product_created',
  description: `Created ${productId}`,
  actorId: admin.cksCode || 'ADMIN',
  actorRole: 'admin',
  targetId: productId,
  targetType: 'product',
  metadata: { productName, category, origin: 'manual' },
});
```

---

## Final Verdict

Grade: C+ (70/100)

Pros:
- Solid understanding of the architecture
- Personalization logic is clean
- Role-specific visibility is correct
- All call sites properly updated

Cons:
- 3 critical bugs that would break functionality
- Sloppy duplicate SQL condition
- Missing auth token would cause immediate failure
- Wrong actor attribution breaks audit trail
- Incomplete implementation (missing product creation activity)

Recommendation: DO NOT DEPLOY

Fix all 3 critical bugs first, then test thoroughly before proceeding.

