# Catalog Activity RBAC & Personalization Matrix

**Date:** 2025-10-27
**Scope:** Catalog Services (SRV-XXX) and Products (PRD-XXX)

---

## Overview

Different user roles see different activity descriptions and have different visibility rules for catalog events. This document defines the complete RBAC filtering and personalization logic.

---

## Activity Visibility Matrix

### Catalog Services (SRV-XXX)

| Activity Type | Admin | Manager | Contractor | Customer | Center | Crew | Warehouse |
|--------------|-------|---------|------------|----------|--------|------|-----------|
| `catalog_service_created` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `catalog_service_archived` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `catalog_service_restored` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `catalog_service_deleted` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `catalog_service_certified` | ✅ | ✅* | ✅* | ❌ | ❌ | ✅* | ❌ |
| `catalog_service_decertified` | ✅ | ✅* | ✅* | ❌ | ❌ | ✅* | ❌ |

**\* Only if the event affects that specific user** (via `metadata.userId`)

### Catalog Products (PRD-XXX)

| Activity Type | Admin | Manager | Contractor | Customer | Center | Crew | Warehouse |
|--------------|-------|---------|------------|----------|--------|------|-----------|
| `product_created` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `product_archived` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `product_restored` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `product_deleted` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `product_inventory_adjusted` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Activity Description Personalization

### Rules

1. **Admin** sees canonical format (technical)
2. **All other users** see friendly format (personalized)
3. Descriptions are transformed at **display time**, not stored

### Storage Format (Database)

All activities stored in generic, ID-based format:

```sql
activity_type = 'catalog_service_created'
description = 'Created SRV-001'
target_id = 'SRV-001'
target_type = 'catalogService'
metadata = { serviceName: 'Nightly Janitorial Service' }
```

```sql
activity_type = 'product_created'
description = 'Created PRD-001'
target_id = 'PRD-001'
target_type = 'product'
metadata = { productName: 'Industrial Floor Cleaner' }
```

### Display Format by Role

#### Catalog Service Creation

| Role | Description |
|------|-------------|
| **Admin** | `Created SRV-001` |
| **Manager** | `New Service (SRV-001) added to the CKS Catalog!` |
| **Contractor** | `New Service (SRV-001) added to the CKS Catalog!` |
| **Customer** | `New Service (SRV-001) added to the CKS Catalog!` |
| **Center** | `New Service (SRV-001) added to the CKS Catalog!` |
| **Crew** | ❌ Not visible |
| **Warehouse** | ❌ Not visible |

#### Product Creation

| Role | Description |
|------|-------------|
| **Admin** | `Created PRD-001` |
| **Manager** | `New Product (PRD-001) added to the CKS Catalog!` |
| **Contractor** | `New Product (PRD-001) added to the CKS Catalog!` |
| **Customer** | `New Product (PRD-001) added to the CKS Catalog!` |
| **Center** | `New Product (PRD-001) added to the CKS Catalog!` |
| **Crew** | `New Product (PRD-001) added to the CKS Catalog!` |
| **Warehouse** | `New Product (PRD-001) added to the CKS Catalog!` |

#### Certification Events (Personalized)

| Event | Admin | Affected User | Other Users |
|-------|-------|---------------|-------------|
| Certified | `Certified MGR-012 for SRV-001` | `Certified you for SRV-001` | ❌ Not visible |
| Decertified | `Uncertified MGR-012 for SRV-001` | `Uncertified you for SRV-001` | ❌ Not visible |

#### Inventory Adjustment (Warehouse Only)

| Role | Description |
|------|-------------|
| **Admin** | `Adjusted PRD-001 inventory` |
| **Warehouse** | `Inventory adjusted for PRD-001` |
| **All Others** | ❌ Not visible |

#### Lifecycle Events (Admin Only)

| Event | Admin | All Others |
|-------|-------|------------|
| Archived | `Archived SRV-001` / `Archived PRD-001` | ❌ Not visible |
| Restored | `Restored SRV-001` / `Restored PRD-001` | ❌ Not visible |
| Deleted | `Deleted SRV-001` / `Deleted PRD-001` | ❌ Not visible |

---

## Backend Implementation

### 1. Activity Recording (No Changes)

Store in generic format as currently implemented:

```typescript
await recordActivity({
  activityType: 'catalog_service_created',
  description: `Created ${serviceId}`,  // Generic format
  actorId: admin.cksCode || 'ADMIN',
  actorRole: 'admin',
  targetId: serviceId,
  targetType: 'catalogService',
  metadata: {
    serviceName,
    category,
    // ... other fields
  },
});
```

```typescript
await recordActivity({
  activityType: 'product_created',
  description: `Created ${productId}`,  // Generic format
  actorId: admin.cksCode || 'ADMIN',
  actorRole: 'admin',
  targetId: productId,
  targetType: 'product',
  metadata: {
    productName,
    category,
    // ... other fields
  },
});
```

### 2. User Scope Queries (RBAC Filtering)

**File:** `apps/backend/server/domains/scope/store.ts`

#### Manager Activity Query (lines ~314-322)

```sql
-- Catalog service certifications affecting YOU (viewer)
(
  activity_type IN ('catalog_service_certified','catalog_service_decertified')
  AND metadata ? 'userId' AND UPPER(metadata->>'userId') = $2  -- $2 is viewer's cksCode
)
OR
-- Catalog service creation events (visible to managers)
(activity_type = 'catalog_service_created')
OR
-- Product creation events (visible to managers)
(activity_type = 'product_created')
```

#### Contractor Activity Query (similar pattern)

```sql
-- Catalog service certifications affecting YOU
(
  activity_type IN ('catalog_service_certified','catalog_service_decertified')
  AND metadata ? 'userId' AND UPPER(metadata->>'userId') = $2
)
OR
-- Catalog service creation events
(activity_type = 'catalog_service_created')
OR
-- Product creation events
(activity_type = 'product_created')
```

#### Customer Activity Query

```sql
-- Catalog service creation events (customers can see)
(activity_type = 'catalog_service_created')
OR
-- Product creation events (customers can see)
(activity_type = 'product_created')
```

#### Center Activity Query (same as customer)

```sql
(activity_type = 'catalog_service_created')
OR
(activity_type = 'product_created')
```

#### Crew Activity Query (PRODUCTS ONLY)

```sql
-- Crew ONLY sees product creation (NOT services)
(activity_type = 'product_created')
```

**Reasoning:** Crew cannot view services in CKS catalog, only products.

#### Warehouse Activity Query

```sql
-- Product creation events
(activity_type = 'product_created')
OR
-- Inventory adjustments (warehouse-specific)
(
  activity_type = 'product_inventory_adjusted'
  AND metadata ? 'warehouseId'
  AND UPPER(metadata->>'warehouseId') = $2  -- Only see adjustments for their warehouse
)
```

**Reasoning:** Warehouses need to know when products are added and when their inventory changes.

### 3. Personalization Logic

**File:** `apps/backend/server/domains/scope/store.ts`

**Function:** `mapActivityRow` (around line 61)

**Add personalization for catalog creation events:**

```typescript
function mapActivityRow(row: ActivityRow, viewerId?: string, viewerRole?: string): HubActivityItem {
  let description = row.description;

  // Personalize certification activity descriptions for the viewer
  if (viewerId && row.metadata) {
    const metadata = row.metadata as Record<string, any>;
    const affectedUserId = metadata.userId?.toString().trim().toUpperCase();
    const normalizedViewerId = viewerId.trim().toUpperCase();

    if (affectedUserId === normalizedViewerId) {
      const serviceId = row.target_id || metadata.serviceName || 'this service';

      if (row.activity_type === 'catalog_service_certified') {
        description = `Certified you for ${serviceId}`;
      } else if (row.activity_type === 'catalog_service_decertified') {
        description = `Uncertified you for ${serviceId}`;
      }
    }
  }

  // ✅ ADD THIS: Personalize catalog creation events for non-admin users
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

  return {
    id: String(row.activity_id),
    description,
    activityType: row.activity_type,
    category: activityTypeCategory[row.activity_type] ?? 'info',
    actorId: toNullableString(row.actor_id),
    actorRole: toNullableString(row.actor_role),
    targetId: toNullableString(row.target_id),
    targetType: toNullableString(row.target_type),
    metadata: row.metadata ?? null,
    createdAt: toIsoString(row.created_at),
  };
}
```

**Important:** Need to pass `viewerRole` to `mapActivityRow`. Currently it only receives `viewerId`.

**Update call sites:** Each role query should pass role:

```typescript
// Example in getManagerActivities
return result.rows.map(row => mapActivityRow(row, cksCode, 'manager'));
//                                                        ^^^^^^^^^ Add role
```

---

## Frontend Implementation

### 1. Admin Timeline (No Personalization)

Admin sees canonical format in timelines and feeds:
- `Created SRV-001`
- `Created PRD-001`
- `Archived SRV-001`
- etc.

**No changes needed** - admins always see stored description.

### 2. User Hub Feeds (Personalized)

Users see personalized descriptions from backend:
- Manager: `New Service (SRV-001) added to the CKS Catalog!`
- Crew: `New Product (PRD-001) added to the CKS Catalog!`
- Warehouse: `Inventory adjusted for PRD-001`

**No frontend changes needed** - backend handles personalization.

---

## New Activity Type: Inventory Adjustment

### Backend Recording

**File:** Inventory management route (wherever inventory adjustments happen)

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

### History Timeline (Admin Only)

Inventory adjustments should appear in product history timeline for admins only.

**File:** `apps/frontend/src/policies/tabs.ts`

History tab already admin-only:
```typescript
if (entityType === 'product' && tabId === 'history') {
  return role === 'admin';  // ✅ Already correct
}
```

---

## Summary of Changes Needed

### Backend Changes

1. **User Scope Queries** (`scope/store.ts`)
   - Manager: Add `product_created`
   - Contractor: Add `product_created`
   - Customer: Add `catalog_service_created`, `product_created`
   - Center: Add `catalog_service_created`, `product_created`
   - Crew: Add `product_created` (ONLY, no services)
   - Warehouse: Add `product_created`, `product_inventory_adjusted`

2. **Personalization Logic** (`scope/store.ts`)
   - Update `mapActivityRow` to accept `viewerRole` parameter
   - Add personalization for `catalog_service_created`
   - Add personalization for `product_created`
   - Add personalization for `product_inventory_adjusted`
   - Update all call sites to pass role

3. **Activity Recording**
   - Add `product_created` recording
   - Add `product_archived` recording
   - Add `product_restored` recording
   - Add `product_deleted` recording
   - Add `product_inventory_adjusted` recording

4. **Entity Catalog** (`entityCatalog.ts`)
   - ✅ Already has product activity types
   - ✅ Need to add `product_inventory_adjusted`

### Frontend Changes

1. **Product Adapter** (`entityRegistry.tsx`)
   - ✅ Add History tab
   - ✅ Already admin-only via tabs.ts

2. **Tab Visibility** (`tabs.ts`)
   - ✅ Already has admin-only rule for product history

---

## Testing Matrix

### Catalog Service Creation

| Role | Expected Behavior |
|------|-------------------|
| Admin | Sees "Created SRV-001" in Recent Activity |
| Manager | Sees "New Service (SRV-001) added to the CKS Catalog!" |
| Contractor | Sees "New Service (SRV-001) added to the CKS Catalog!" |
| Customer | Sees "New Service (SRV-001) added to the CKS Catalog!" |
| Center | Sees "New Service (SRV-001) added to the CKS Catalog!" |
| Crew | Does NOT see event |
| Warehouse | Does NOT see event |

### Product Creation

| Role | Expected Behavior |
|------|-------------------|
| Admin | Sees "Created PRD-001" in Recent Activity |
| Manager | Sees "New Product (PRD-001) added to the CKS Catalog!" |
| Contractor | Sees "New Product (PRD-001) added to the CKS Catalog!" |
| Customer | Sees "New Product (PRD-001) added to the CKS Catalog!" |
| Center | Sees "New Product (PRD-001) added to the CKS Catalog!" |
| Crew | Sees "New Product (PRD-001) added to the CKS Catalog!" |
| Warehouse | Sees "New Product (PRD-001) added to the CKS Catalog!" |

### Inventory Adjustment

| Role | Expected Behavior |
|------|-------------------|
| Admin | Sees "Adjusted PRD-001 inventory" in Recent Activity + History |
| Warehouse (WHS-004) | Sees "Inventory adjusted for PRD-001" (if adjustment was for their warehouse) |
| All Others | Does NOT see event |

### Certification Events

| Role | Expected Behavior |
|------|-------------------|
| Admin | Sees "Certified MGR-012 for SRV-001" |
| MGR-012 | Sees "Certified you for SRV-001" |
| Other users | Does NOT see event |

---

## End of Document

This matrix defines the complete RBAC and personalization logic for catalog activities. GPT5 should use this as the source of truth when implementing the product migration.
