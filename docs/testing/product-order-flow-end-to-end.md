# Product Order Flow - End-to-End Test Plan

**Test Date:** 2025-11-02
**Tested By:** Freedom
**Flow:** Crew Creates Product Order

---

## Flow Overview

```
CREW creates order
   ↓
pending_warehouse (assigned to specific WH)
   ↓
WAREHOUSE accepts
   ↓
pending_delivery
   ↓
WAREHOUSE starts delivery
   ↓
in_transit
   ↓
WAREHOUSE delivers
   ↓
delivered (final)
```

---

## Activity Messages Recorded

### 1. Order Creation
**Location:** `apps/backend/server/domains/orders/store.ts:1912-1929`

**Activity Type:** `order_created`

**Description Format:**
```
Created Product Order ${orderId}
```

**Example:** `Created Product Order CEN-010-PO-001`

**Actor:** Crew member (CRW-XXX)
**Actor Role:** `crew`
**Target ID:** Order ID (e.g., CEN-010-PO-001)
**Target Type:** `order`

**Metadata Captured:**
- `orderId`
- `orderType`: "product"
- `customerId`
- `centerId`
- `contractorId`
- `managerId`
- `crewId`
- `warehouseId` (assigned warehouse)

---

### 2. Warehouse Accepts Order
**Location:** `apps/backend/server/domains/orders/store.ts:2093-2513`

**Activity Type:** NOT CURRENTLY RECORDED ❌

**Status:** `accept` action does NOT record an activity
**Issue:** Only these actions record activities:
- `start-delivery` → `delivery_started`
- `deliver` → `order_delivered`
- `complete` → `order_completed`
- `cancel` → `order_cancelled`
- `reject` → `order_rejected`

**Missing Activity:** Warehouse acceptance is not tracked in activity feed

---

### 3. Warehouse Starts Delivery
**Location:** `apps/backend/server/domains/orders/store.ts:2490-2492`

**Activity Type:** `delivery_started`

**Description Format:**
```
Started Delivery for Product Order ${orderId}
```

**Example:** `Started Delivery for Product Order CEN-010-PO-001`

**Actor:** Warehouse (WH-XXX)
**Actor Role:** `warehouse`
**Target ID:** Order ID
**Target Type:** `order`

**Metadata Captured:** (same as creation)

---

### 4. Warehouse Delivers Order
**Location:** `apps/backend/server/domains/orders/store.ts:2494-2496`

**Activity Type:** `order_delivered`

**Description Format:**
```
Delivered Product Order ${orderId}
```

**Example:** `Delivered Product Order CEN-010-PO-001`

**Actor:** Warehouse (WH-XXX)
**Actor Role:** `warehouse`
**Target ID:** Order ID
**Target Type:** `order`

**Metadata Captured:** (same as creation)

---

### 5. Order Cancelled (Alternative Outcome)
**Location:** `apps/backend/server/domains/orders/store.ts:2502-2504`

**Activity Type:** `order_cancelled`

**Description Format:**
```
Cancelled Product Order ${orderId}
```

**Example:** `Cancelled Product Order CEN-010-PO-001`

**Actor:** Varies (crew, warehouse, admin)
**Actor Role:** Actor's role
**Target ID:** Order ID
**Target Type:** `order`

---

### 6. Order Rejected (Alternative Outcome)
**Location:** `apps/backend/server/domains/orders/store.ts:2506-2508`

**Activity Type:** `order_rejected`

**Description Format:**
```
Rejected Product Order ${orderId}
```

**Example:** `Rejected Product Order CEN-010-PO-001`

**Actor:** Warehouse (WH-XXX)
**Actor Role:** `warehouse`
**Target ID:** Order ID
**Target Type:** `order`

---

## Activity Visibility by Role

### Crew (Creator: CRW-006)
**Query:** `apps/backend/server/domains/scope/store.ts:1296-1372`

**Will See:**
- ✅ `order_created` - "Created Product Order CEN-010-PO-001" (red card - crew actor)
  - **Why:** Actor is self (`actor_id = CRW-006`)
- ✅ `delivery_started` - "Started Delivery for Product Order CEN-010-PO-001" (purple card - warehouse actor)
  - **Why:** Crew is in metadata (`metadata->>'crewId' = CRW-006`)
- ✅ `order_delivered` - "Delivered Product Order CEN-010-PO-001" (purple card - warehouse actor)
  - **Why:** Crew is in metadata
- ✅ `order_cancelled` - "Cancelled Product Order CEN-010-PO-001" (varies by actor)
  - **Why:** Crew is in metadata
- ✅ `order_rejected` - "Rejected Product Order CEN-010-PO-001" (purple card - warehouse actor)
  - **Why:** Crew is in metadata

**Filter Logic:**
```sql
WHERE (
  -- Show other activity types for ecosystem
  (metadata ? 'crewId' AND UPPER(metadata->>'crewId') = $2)
  OR (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
)
AND activity_type NOT LIKE '%_archived'
AND activity_type NOT LIKE '%_deleted'
ORDER BY created_at DESC
LIMIT 50
```

---

### Center (CEN-010)
**Query:** Similar to crew, with center-specific filters

**Will See:**
- ✅ All order activities if center ID is in metadata
- ✅ Activities where `centerId` matches CEN-010

**Filter Logic:**
```sql
WHERE (
  (metadata ? 'centerId' AND UPPER(metadata->>'centerId') = $centerCode)
  OR (target_id IS NOT NULL AND UPPER(target_id) IN (ecosystem_ids))
)
```

---

### Customer (CUS-005)
**Will See:**
- ✅ All order activities if customer ID is in metadata
- ✅ Activities for their centers and crew

---

### Contractor (CTR-003)
**Will See:**
- ✅ All order activities for their ecosystem (customers → centers → crew)

---

### Manager (MGR-001)
**Will See:**
- ✅ All order activities for their ecosystem (contractors → customers → centers → crew)

---

### Warehouse (WH-002 - Assigned Warehouse)
**Query:** `apps/backend/server/domains/scope/store.ts:1381-1440`

**Will See:**
- ✅ `order_created` - "Created Product Order CEN-010-PO-001" (red card - crew actor)
  - **Why:** Warehouse ID in metadata (`metadata->>'warehouseId' = WH-002`)
- ✅ `delivery_started` - "Started Delivery for Product Order CEN-010-PO-001" (purple card - warehouse actor)
  - **Why:** Warehouse ID in metadata OR actor is self
- ✅ `order_delivered` - "Delivered Product Order CEN-010-PO-001" (purple card - warehouse actor)
  - **Why:** Actor is self
- ✅ `order_cancelled` - If they cancelled it
- ✅ `order_rejected` - If they rejected it

**Filter Logic:**
```sql
WHERE (
  -- Orders assigned to this warehouse
  (metadata ? 'warehouseId' AND UPPER(metadata->>'warehouseId') = $2)
  OR
  -- Orders where warehouse is actor
  (actor_id IS NOT NULL AND UPPER(actor_id) = $2)
)
AND activity_type NOT LIKE '%_archived'
AND activity_type NOT LIKE '%_deleted'
ORDER BY created_at DESC
LIMIT 50
```

---

### Warehouse (WH-001 - NOT Assigned)
**Will See:**
- ❌ Nothing - Order is not assigned to them

---

### Admin
**Will See:**
- ✅ Everything (no filters applied)
- ✅ Plus archive/delete activities

---

## Important Note About Activity Descriptions

**The activity descriptions DO include actor codes in the stored format via the `actorId` field, but NOT in the description text.**

### Current Format:
```typescript
{
  activityType: 'order_created',
  description: 'Created Product Order CEN-010-PO-001',  // ← NO actor prefix
  actorId: 'CRW-006',                                   // ← Actor stored here
  actorRole: 'crew',                                    // ← Role stored here
  targetId: 'CEN-010-PO-001',
  targetType: 'order',
  metadata: { ... }
}
```

### Frontend Display:
The frontend uses **role-based color coding** to visually indicate who performed the action:

```typescript
// ActivityItem.tsx:14-51
const roleColors = {
  crew: { bg: '#fee2e2', text: '#991b1b' },      // Light red / Dark red
  warehouse: { bg: '#fae8ff', text: '#581c87' },  // Light purple / Dark purple
  admin: { bg: '#f3f4f6', text: '#111827' },      // Light gray / Black
  // ... etc
};
```

**Result:**
- Crew creates order → Red card shows "Created Product Order CEN-010-PO-001"
- Warehouse delivers → Purple card shows "Delivered Product Order CEN-010-PO-001"

**The color coding eliminates the need for "Crew CRW-006 created..." or "Warehouse WH-002 delivered..." prefixes.**

---

## Test Checklist

### Happy Path (Success Flow)
- [ ] **Crew Hub:** Create product order
  - [ ] Order appears in "My Orders" section
  - [ ] Activity feed shows: "Created Product Order XXX" (red card)
- [ ] **Crew Hub:** Verify crew can see order activity
  - [ ] Red card for creation
  - [ ] Order is clickable in activity feed
- [ ] **Warehouse Hub (WH-002):** Accept order
  - [ ] Order moves to "pending_delivery" status
  - [ ] ⚠️ **NO activity recorded** (known gap)
- [ ] **Warehouse Hub:** Start delivery
  - [ ] Order moves to "in_transit" status
  - [ ] Activity feed shows: "Started Delivery for Product Order XXX" (purple card)
- [ ] **Warehouse Hub:** Deliver order
  - [ ] Order moves to "delivered" status
  - [ ] Activity feed shows: "Delivered Product Order XXX" (purple card)
- [ ] **Crew Hub:** Verify crew sees all activities
  - [ ] Red card: "Created Product Order XXX"
  - [ ] Purple card: "Started Delivery for Product Order XXX"
  - [ ] Purple card: "Delivered Product Order XXX"
- [ ] **Center Hub:** Verify center sees all order activities
- [ ] **Customer Hub:** Verify customer sees all order activities
- [ ] **Contractor Hub:** Verify contractor sees all order activities
- [ ] **Manager Hub:** Verify manager sees all order activities
- [ ] **Warehouse Hub (WH-001 - not assigned):** Verify they DON'T see order activities
- [ ] **Admin Hub:** Verify admin sees everything

---

### Alternative Path 1: Warehouse Rejects Order
- [ ] **Crew Hub:** Create product order
- [ ] **Warehouse Hub:** Reject order
  - [ ] Order moves to "rejected" status
  - [ ] Activity feed shows: "Rejected Product Order XXX" (purple card)
- [ ] **Crew Hub:** Verify rejection activity appears (purple card)

---

### Alternative Path 2: Order Cancelled
- [ ] **Crew Hub:** Create product order
- [ ] **Crew/Warehouse/Admin:** Cancel order
  - [ ] Order moves to "cancelled" status
  - [ ] Activity feed shows: "Cancelled Product Order XXX" (color = actor's role)
- [ ] **Crew Hub:** Verify cancellation activity appears

---

### Activity Feed Click Behavior
- [ ] **Click on "Created Product Order XXX":** Opens order modal
- [ ] **Click on "Delivered Product Order XXX":** Opens order modal
- [ ] **Verify deleted orders:** Shows DeletedBanner in modal (if archived/deleted)

---

## Known Issues / Gaps

### 1. Warehouse Accept Action Not Recorded ❌
**Impact:** No activity feed entry when warehouse accepts an order
**Location:** `apps/backend/server/domains/orders/store.ts:2093` (accept action)
**Current Behavior:** Only status changes; no `recordActivity()` call
**Expected:** Should record `order_accepted` activity

**Fix Needed:**
```typescript
case "accept":
  activityType = 'order_accepted';
  activityDescription = `Accepted ${orderType === 'product' ? 'Product' : 'Service'} Order ${input.orderId}`;
  break;
```

---

### 2. No "Approve" Action Recording ❌
**Impact:** Manager/Admin approval not tracked in activity feed
**Current Behavior:** Service orders have approval workflow, but no activity recorded
**Expected:** Should record `order_approved` activity

---

### 3. Actor Codes Are Stored, Not in Description Text ✅
**Status:** This is BY DESIGN
**Current Behavior:**
- Activity description: "Created Product Order CEN-010-PO-001"
- Actor info stored in `actorId` and `actorRole` fields
- Frontend uses color coding to show actor role

**This is correct!** The documentation was updated to reflect this design.

---

## Expected Activity Messages Summary

| Action | Activity Type | Description Template | Actor Role | Recorded? |
|--------|--------------|---------------------|------------|-----------|
| Create Order | `order_created` | "Created Product Order {orderId}" | crew | ✅ Yes |
| Accept Order | NONE | N/A | warehouse | ❌ **NO** |
| Start Delivery | `delivery_started` | "Started Delivery for Product Order {orderId}" | warehouse | ✅ Yes |
| Deliver Order | `order_delivered` | "Delivered Product Order {orderId}" | warehouse | ✅ Yes |
| Cancel Order | `order_cancelled` | "Cancelled Product Order {orderId}" | varies | ✅ Yes |
| Reject Order | `order_rejected` | "Rejected Product Order {orderId}" | warehouse | ✅ Yes |
| Approve Order | NONE | N/A | manager/admin | ❌ **NO** |

---

## Color Coding Reference

| Role | Background Color | Text Color | Visual Appearance |
|------|-----------------|------------|-------------------|
| Crew | Light red (#fee2e2) | Dark red (#991b1b) | Red card |
| Warehouse | Light purple (#fae8ff) | Dark purple (#581c87) | Purple card |
| Admin | Light gray (#f3f4f6) | Black (#111827) | Gray card |
| Manager | Light blue (#eff6ff) | Dark blue (#1e40af) | Blue card |
| Contractor | Light green (#ecfdf5) | Dark green (#065f46) | Green card |
| Customer | Light yellow (#fef3c7) | Dark brown (#78350f) | Yellow card |
| Center | Light orange (#fef2e8) | Dark orange (#7c2d12) | Orange card |

---

## Testing Notes

1. **Use the color cards to identify who performed actions** - Don't expect "Crew CRW-006" or "Warehouse WH-002" in the description text
2. **Actor codes are available in the underlying data** - Check browser console or API responses to see `actorId` and `actorRole` fields
3. **Test with multiple warehouses** - Verify WH-001 (not assigned) doesn't see WH-002's order activities
4. **Test ecosystem visibility** - Manager should see activities from their entire downstream ecosystem
5. **Check activity feed clickability** - All order activities should open the order modal when clicked

---

## Next Steps After Testing

1. **Add missing `order_accepted` activity** (warehouse accept)
2. **Add missing `order_approved` activity** (manager/admin approval for service orders)
3. **Consider adding `order_assigned` activity** (when order is assigned to warehouse)
4. **Update activity-feed-system.md** with findings from this end-to-end test
