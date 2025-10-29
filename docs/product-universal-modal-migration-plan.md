# Product Universal Modal Migration Plan

**Date:** 2025-10-27
**Entity:** Catalog Products
**Status:** Ready for Implementation


Status Update (2025-10-29)

- Phase 1 COMPLETE
  - Backend endpoint added: `GET /api/catalog/products/:productId/details` (product + inventory)
  - ModalProvider prefetch for `product` implemented (`/catalog/products/:id/details`)
  - Activity click-through opens universal product modal

- Phase 2 COMPLETE
  - Admin Hub → Directory → Products now opens universal modal via `openEntityModal('product', id)`
  - Archive Section routes Product rows to universal modal (archived state)
  - CKS Catalog product cards use universal modal (replaced legacy modal)

- UI parity with Services
  - ProductQuickActions integrated admin actions (Edit/Archive/Restore/Delete) in the same Quick Actions tab
  - Removed separate Actions tab for products

- Remaining
  - Validate RBAC/user feeds for product creations across all roles
  - Sweep for any lingering legacy triggers (if any)
---

## Migration Overview

Migrate catalog products from legacy modal to universal modal pattern with:
- Full activity timeline integration
- History tab with lifecycle events
- Activity visibility in user hub feeds (RBAC-filtered)
- **Personalized activity descriptions** for non-admin users
- **Role-specific visibility** (crew sees products only, warehouse sees inventory)
- Consistent with catalogService pattern

**⚠️ IMPORTANT:** This migration includes complex RBAC logic. See `catalog-activity-rbac-and-personalization.md` for complete visibility matrix and personalization rules.

---

## Current State Analysis

### ✅ Already Working
- Product adapter exists in entityRegistry
- Has tabs: Details, Quick Actions (admin), Actions
- Archive/restore/delete actions working
- Inventory management in Quick Actions tab
- ProductQuickActions component from @cks/ui

### ❌ Missing
- History tab for lifecycle timeline
- Activity recording (created, archived, restored, deleted)
- User hub feed visibility for product-related activities
- Activity descriptions following new concise format

---

## Backend Requirements

### 1. Activity Types (Already Defined)

From `entityCatalog.ts`:
```typescript
product_created
product_archived
product_restored
product_hard_deleted
```

### 2. Activity Recording Locations

Need to add `recordActivity()` calls in:

**File: `apps/backend/server/domains/inventory/routes.fastify.ts`** (or wherever products are managed)

#### a) Product Creation
```typescript
// After creating product in database
await recordActivity({
  activityType: 'product_created',
  description: `Created ${productId}`,  // Concise format
  actorId: admin.cksCode || 'ADMIN',
  actorRole: 'admin',
  targetId: productId,
  targetType: 'product',
  metadata: {
    productName: name,
    category,
    unitOfMeasure,
    price
  },
});
```

#### b) Product Archiving
```typescript
// In archive endpoint
await recordActivity({
  activityType: 'product_archived',
  description: `Archived ${productId}`,
  actorId: admin.cksCode || 'ADMIN',
  actorRole: 'admin',
  targetId: productId,
  targetType: 'product',
  metadata: {
    reason,
    productName
  },
});
```

#### c) Product Restoration
```typescript
// In restore endpoint
await recordActivity({
  activityType: 'product_restored',
  description: `Restored ${productId}`,
  actorId: admin.cksCode || 'ADMIN',
  actorRole: 'admin',
  targetId: productId,
  targetType: 'product',
  metadata: {
    productName
  },
});
```

#### d) Product Deletion (Hard Delete)
```typescript
// In delete endpoint (before actually deleting)
await recordActivity({
  activityType: 'product_hard_deleted',
  description: `Deleted ${productId}`,
  actorId: admin.cksCode || 'ADMIN',
  actorRole: 'admin',
  targetId: productId,
  targetType: 'product',
  metadata: {
    reason,
    snapshot: productData,  // Full snapshot before deletion
    productName
  },
});
```

### 3. History Endpoint Support

**File: `apps/backend/server/domains/activity/routes.fastify.ts`**

The history endpoint should already work for products since it uses `entityCatalog.ts` definitions. Verify with:
```bash
curl http://localhost:4000/api/activity/entity/product/PRD-001
```

If not working, add product case to the switch statement (around line 177).

### 4. User Scope Queries (REQUIRED - Role-Specific)

**⚠️ CRITICAL:** Different roles see different catalog events. See `catalog-activity-rbac-and-personalization.md` for complete matrix.

**File: `apps/backend/server/domains/scope/store.ts`**

#### Manager Query (~line 314)
```sql
-- Product creation events
OR (activity_type = 'product_created')
```

#### Contractor Query (~line 968)
```sql
-- Product creation events
OR (activity_type = 'product_created')
```

#### Customer Query (~line 1061)
```sql
-- Product creation events
OR (activity_type = 'product_created')
```

#### Center Query (~line 1147)
```sql
-- Product creation events
OR (activity_type = 'product_created')
```

#### Crew Query (~line 1231) - PRODUCTS ONLY
```sql
-- Product creation events (NO SERVICES - crew can't view CKS service catalog)
OR (activity_type = 'product_created')
```

**Note:** Crew does NOT see `catalog_service_created` because they cannot view the CKS service catalog.

#### Warehouse Query (~line 1317) - PRODUCTS + INVENTORY
```sql
-- Product creation events
OR (activity_type = 'product_created')
OR
-- Inventory adjustments affecting THIS warehouse
(
  activity_type = 'product_inventory_adjusted'
  AND metadata ? 'warehouseId'
  AND UPPER(metadata->>'warehouseId') = $2  -- Only see their own warehouse's adjustments
)
```

**Note:** Warehouses need inventory visibility for their operations.

### 5. Activity Personalization (REQUIRED)

**File: `apps/backend/server/domains/scope/store.ts`**

**Function:** `mapActivityRow` (around line 61)

**Update function signature to accept role:**
```typescript
function mapActivityRow(row: ActivityRow, viewerId?: string, viewerRole?: string): HubActivityItem
```

**Add personalization logic:**
```typescript
// Personalize catalog creation events for non-admin users
if (viewerRole && viewerRole !== 'admin') {
  const targetId = row.target_id;

  // Service creation personalization
  if (row.activity_type === 'catalog_service_created' && targetId) {
    description = `New Service (${targetId}) added to the CKS Catalog!`;
  }

  // Product creation personalization
  if (row.activity_type === 'product_created' && targetId) {
    description = `New Product (${targetId}) added to the CKS Catalog!`;
  }

  // Inventory adjustment personalization for warehouse
  if (row.activity_type === 'product_inventory_adjusted' && viewerRole === 'warehouse' && targetId) {
    description = `Inventory adjusted for ${targetId}`;
  }
}
```

**Update all call sites** to pass role:
```typescript
// In getManagerActivities
return result.rows.map(row => mapActivityRow(row, cksCode, 'manager'));

// In getContractorActivities
return result.rows.map(row => mapActivityRow(row, cksCode, 'contractor'));

// etc. for all 6 roles
```

### 6. Inventory Adjustment Activity (NEW)

**Activity Type:** `product_inventory_adjusted`

**When to record:** Whenever inventory changes (admin adjustment, warehouse update, etc.)

**File:** Inventory management route

```typescript
await recordActivity({
  activityType: 'product_inventory_adjusted',
  description: `Adjusted ${productId} inventory`,
  actorId: admin.cksCode || warehouseCode,
  actorRole: actorRole,  // 'admin' or 'warehouse'
  targetId: productId,
  targetType: 'product',
  metadata: {
    productName,
    warehouseId,
    warehouseName,
    quantityChange,
    newQuantity,
    reason,
  },
});
```

**Visibility:**
- Admin: Sees in product history timeline
- Warehouse (specific): Sees in their activity feed
- All others: Hidden

---

## Frontend Requirements

### 1. Add History Tab

**File: `apps/frontend/src/config/entityRegistry.tsx`**

**Location:** `productAdapter.getTabDescriptors` (around line 1666)

**Change:**
```typescript
const tabs: TabDescriptor[] = [
  {
    id: 'details',
    label: 'Details',
    content: (
      <DetailsComposer
        sections={filterVisibleSections(detailsSections, {
          entityType: context.entityType,
          role: context.role,
          lifecycle: context.lifecycle,
          entityData,
        })}
      />
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    content: <UserQuickActions actions={actions} />,
  },
  // ✅ ADD THIS: History tab
  {
    id: 'history',
    label: 'History',
    content: (
      <HistoryTab
        entityType="product"
        entityId={entityData?.productId || ''}
        getAuthToken={context.getAuthToken}
      />
    ),
  },
];
```

### 2. Import HistoryTab

Already imported at top of file (line 36):
```typescript
import { HistoryTab } from '@cks/ui';
```

### 3. Tab Visibility Policy

**File: `apps/frontend/src/policies/tabs.ts`**

Add product history tab visibility:
```typescript
// Around line with other history tab rules
if (entityType === 'product' && tabId === 'history') {
  return role === 'admin';  // Only admins see product history
}
```

---

## Migration Steps for GPT5

### Step 1: Backend Activity Recording

**Task:** Add activity recording to product lifecycle endpoints

**Files to modify:**
1. Find product management routes (likely in `apps/backend/server/domains/inventory/` or `apps/backend/server/domains/catalog/`)
2. Add `recordActivity()` calls for:
   - Product creation
   - Product archiving
   - Product restoration
   - Product deletion (with snapshot)

**Import needed:**
```typescript
import { recordActivity } from '../directory/store';
```

**Description format:** Follow concise pattern:
- ✅ "Created PRD-001"
- ✅ "Archived PRD-001"
- ✅ "Restored PRD-001"
- ✅ "Deleted PRD-001"

**Metadata to include:**
- `productName` (required)
- `category` (optional)
- `reason` (for archive/delete)
- `snapshot` (for delete only)

### Step 2: Frontend History Tab

**Task:** Add History tab to product adapter

**File:** `apps/frontend/src/config/entityRegistry.tsx`

**Location:** `productAdapter.getTabDescriptors` (line ~1666)

**Add after Actions tab:**
```typescript
{
  id: 'history',
  label: 'History',
  content: (
    <HistoryTab
      entityType="product"
      entityId={entityData?.productId || ''}
      getAuthToken={context.getAuthToken}
    />
  ),
},
```

### Step 3: Tab Visibility Policy

**Task:** Control who sees product history tab

**File:** `apps/frontend/src/policies/tabs.ts`

**Add admin-only rule:**
```typescript
if (entityType === 'product' && tabId === 'history') {
  return role === 'admin';
}
```

### Step 4: Backfill Historical Activities (Optional)

**Task:** Create backfill script for existing products

**File:** `apps/backend/scripts/backfill-product-activities.ts`

**Pattern:** Same as `backfill-catalog-activities.ts`

```typescript
// For each product in catalog_products table
await query(
  `INSERT INTO system_activity (
     activity_type, description, actor_id, actor_role,
     target_id, target_type, metadata, created_at
   ) VALUES (
     'product_created',
     $1,  // "Seeded PRD-001"
     'ADMIN',
     'admin',
     $2,  // PRD-001
     'product',
     $3::jsonb,  // { productName, origin: 'seed' }
     $4   // product.created_at or NOW()
   )`,
  [
    `Seeded ${productId}`,
    productId,
    JSON.stringify({ productName, origin: 'seed' }),
    createdAt.toISOString()
  ]
);
```

### Step 5: User Scope Queries (Optional)

**Task:** Show product creation events in user feeds

**File:** `apps/backend/server/domains/scope/store.ts`

**Add to all 6 role queries (manager, contractor, customer, center, crew, warehouse):**
```sql
-- Product creation events (visible to all users)
OR (activity_type = 'product_created')
```

**Lines to modify:** ~314, ~968, ~1061, ~1147, ~1231, ~1317

**Note:** Only add if users should see when products are created. Archive/delete should remain admin-only.

---

## Testing Checklist

### Backend Testing

- [ ] Create new product → `product_created` activity recorded
- [ ] Archive product → `product_archived` activity recorded
- [ ] Restore product → `product_restored` activity recorded
- [ ] Delete product → `product_hard_deleted` activity recorded with snapshot
- [ ] GET `/api/activity/entity/product/PRD-001` returns all events
- [ ] Activity descriptions follow concise format (no "Product" prefix)

### Frontend Testing

- [ ] Open product modal → History tab appears (admin only)
- [ ] History tab shows timeline with all lifecycle events
- [ ] Timeline badges show correct colors:
  - Created: Blue
  - Archived: Gray
  - Restored: Green
  - Deleted: Red
- [ ] Timeline descriptions show only IDs ("PRD-001")
- [ ] Recent Activity shows action + ID ("Created PRD-001")

### User Feed Testing (If Implemented)

- [ ] Manager hub shows "Created PRD-001" when product is created
- [ ] Contractor hub shows "Created PRD-001"
- [ ] Other roles see product creation events
- [ ] Users do NOT see archive/delete events (admin-only)

### Edge Cases

- [ ] Archived product history shows all events including archive
- [ ] Deleted product snapshot retrieval works
- [ ] Product with no history shows empty timeline message
- [ ] Inventory adjustments don't create activity records (separate from lifecycle)

---

## Success Criteria

1. ✅ Product lifecycle events recorded in `system_activity` table
2. ✅ History tab visible to admins in product modal
3. ✅ Timeline shows created, archived, restored, deleted events
4. ✅ Activity descriptions follow concise format
5. ✅ Badge colors match event types
6. ✅ (Optional) Users see product creation in their feeds

---

## Rollback Plan

If migration causes issues:

1. Remove History tab from `productAdapter.getTabDescriptors`
2. Remove tab visibility rule from `tabs.ts`
3. Keep activity recording (doesn't hurt, just not displayed)
4. Git revert to previous commit

---

## Estimated Timeline

- Backend activity recording: 30-45 minutes
- Frontend History tab: 15 minutes
- Tab visibility policy: 5 minutes
- Testing: 30-45 minutes
- Backfill script (optional): 20 minutes

**Total: 1.5-2 hours**

---

## Notes for GPT5

### Key Patterns to Follow

1. **Activity Description Format:**
   - Use concise format: "Action + ID"
   - ✅ "Created PRD-001"
   - ❌ "Created Product PRD-001"
   - ❌ "Created product with ID PRD-001"

2. **Metadata Structure:**
   ```typescript
   {
     productName: string,
     category?: string,
     reason?: string,      // For archive/delete
     snapshot?: object,    // For delete only
     origin?: 'seed'       // For backfill
   }
   ```

3. **Target ID/Type:**
   - `targetId`: Product ID (e.g., "PRD-001")
   - `targetType`: "product"

4. **Actor:**
   - Use `admin.cksCode` if available
   - Fallback to `'ADMIN'`
   - `actorRole`: always `'admin'` for product operations

### Similar Implementations to Reference

- **Catalog Services:** `apps/backend/server/domains/catalog/routes.fastify.ts`
- **Archive System:** `apps/backend/server/domains/archive/store.ts`
- **User Adapter:** `entityRegistry.tsx` (userAdapter)
- **Catalog Service Adapter:** `entityRegistry.tsx` (catalogServiceAdapter)

### Common Pitfalls to Avoid

1. ❌ Don't add "Product" to descriptions (ID prefix PRD- already identifies it)
2. ❌ Don't create activities for inventory adjustments (separate concern)
3. ❌ Don't forget snapshot for hard delete (needed for tombstone retrieval)
4. ❌ Don't show archive/delete events to non-admin users (privacy)

---

## Decisions Made (Confirmed by Freedom)

1. ✅ **Users see product creation events** - Personalized as "New Product (ID) added to the CKS Catalog!"
2. ✅ **Inventory adjustments are activities** - Visible to admin (history) and warehouse (feed)
3. ✅ **History shows inventory changes** - Admin-only visibility
4. ✅ **Crew sees products only** - NOT services (can't access service catalog)
5. ✅ **Warehouse sees products + inventory** - Relevant to their operations
6. ✅ **Catalog services need same personalization** - Admin canonical, users friendly format

---

## End of Migration Plan

Once complete, products will have full universal modal integration matching the catalogService pattern. Users will see consistent behavior across all entity types.


