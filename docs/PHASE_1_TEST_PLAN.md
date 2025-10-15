# Phase 1 Test Plan

**Priority:** A → Quick validation before frontend work
**Time Estimate:** 30-45 minutes

---

## Prerequisites

```bash
cd apps/backend
export DATABASE_URL=<your-render-postgres-url>
# or add to .env file
```

---

## Test A1: Run Index Script ✅

**Command:**
```bash
cd apps/backend
pnpm tsx server/db/add-archive-indexes.ts
```

**Expected Output:**
```
[indexes] Starting archive index creation...
[indexes] Connected to database
[indexes] Creating index on system_activity for deleted entity lookups...
[indexes] ✓ idx_activity_deleted_lookup created
[indexes] Creating index on managers.archived_at...
[indexes] ✓ idx_managers_archived_at created
[indexes] Creating index on contractors.archived_at...
[indexes] ✓ idx_contractors_archived_at created
[indexes] Creating index on customers.archived_at...
[indexes] ✓ idx_customers_archived_at created
[indexes] Creating index on centers.archived_at...
[indexes] ✓ idx_centers_archived_at created
[indexes] Creating index on crew.archived_at...
[indexes] ✓ idx_crew_archived_at created
[indexes] Creating index on warehouses.archived_at...
[indexes] ✓ idx_warehouses_archived_at created
[indexes] Creating index on services.archived_at...
[indexes] ✓ idx_services_archived_at created
[indexes] Creating index on orders.archived_at...
[indexes] ✓ idx_orders_archived_at created
[indexes] Creating index on inventory_items.archived_at...
[indexes] ✓ idx_inventory_items_archived_at created
[indexes] Creating index on reports.archived_at...
[indexes] ✓ idx_reports_archived_at created
[indexes] Creating index on feedback.archived_at...
[indexes] ✓ idx_feedback_archived_at created
[indexes] Creating partial indexes for active-only queries...
[indexes] ✓ idx_managers_active_only created
[indexes] ✓ idx_contractors_active_only created
[indexes] ✓ idx_customers_active_only created
[indexes] ✓ idx_centers_active_only created
[indexes] ✓ idx_crew_active_only created
[indexes] ✓ idx_warehouses_active_only created
[indexes] ✓ idx_services_active_only created
[indexes] ✓ idx_orders_active_only created
[indexes] ✓ idx_inventory_items_active_only created
[indexes] ✓ idx_reports_active_only created
[indexes] ✓ idx_feedback_active_only created
[indexes] ✅ All archive indexes created successfully
[indexes] Done. Closing connection...
```

**Verification:**
```sql
-- Check indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE 'idx_%archived%' OR indexname LIKE 'idx_activity_deleted%'
ORDER BY tablename, indexname;
```

**Result:** Should show ~23 indexes (11 archived_at + 11 active_only + 1 activity_deleted_lookup)

---

## Test A2: Create & Track Orders

**Via UI:**
1. Login as CEN-010 (center user)
2. Create product order:
   - Add 2-3 items
   - Destination: warehouse or customer
   - Submit order
3. Create service order:
   - Select service type
   - Add notes
   - Submit order

**Via API (alternative):**
```bash
# Create product order
curl -X POST http://localhost:4000/api/hub/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "requestorCode": "CEN-010",
    "requestorRole": "center",
    "orderType": "product",
    "items": [
      { "catalogCode": "PRD-001", "quantity": 5 },
      { "catalogCode": "PRD-002", "quantity": 10 }
    ],
    "destination": { "code": "WHS-001", "role": "warehouse" }
  }'
```

**Expected Result:**
- Orders appear in CEN-010 hub → Orders tab
- Activity feed shows "Product order CEN-010-PO-XXX created" (blue badge, action type)
- Activity shows "Service order CEN-010-SO-YYY created"

---

## Test A3: Order Lifecycle Activities

**Actions to Test:**

### Accept Order (as warehouse/manager)
```bash
POST /api/hub/orders/CEN-010-PO-XXX/actions
{
  "action": "accept",
  "notes": "Accepted for fulfillment"
}
```
**Expected:** Activity "Order CEN-010-PO-XXX accepted" (green badge, success)

### Start Delivery
```bash
POST /api/hub/orders/CEN-010-PO-XXX/actions
{
  "action": "start-delivery"
}
```
**Expected:** Activity "Delivery started for product order CEN-010-PO-XXX" (blue badge, action)

### Deliver
```bash
POST /api/hub/orders/CEN-010-PO-XXX/actions
{
  "action": "deliver"
}
```
**Expected:** Activity "Product order CEN-010-PO-XXX delivered" (green badge, success)

### Complete (service orders)
```bash
POST /api/hub/orders/CEN-010-SO-YYY/actions
{
  "action": "complete"
}
```
**Expected:** Activity "Service order CEN-010-SO-YYY completed" (green badge, success)

### Cancel
```bash
POST /api/hub/orders/CEN-010-PO-ZZZ/actions
{
  "action": "cancel",
  "notes": "Customer requested cancellation"
}
```
**Expected:** Activity "Product order CEN-010-PO-ZZZ cancelled" (yellow badge, warning)

---

## Test A4: Archive & Hard Delete

**As Admin:**

### 1. Archive an order
```bash
POST /api/admin/archive
{
  "entityType": "order",
  "entityId": "CEN-010-PO-XXX",
  "reason": "Testing archive flow",
  "actor": "ADMIN"
}
```

**Expected:**
- Order moves to Archive tab
- Activity "Archived order CEN-010-PO-XXX" appears (admin feed only)
- Non-admin users do NOT see this activity (Tier-1 filter)

### 2. Hard delete the archived order
```bash
POST /api/admin/hard-delete
{
  "entityType": "order",
  "entityId": "CEN-010-PO-XXX",
  "confirm": true,
  "reason": "Testing tombstone",
  "actor": "ADMIN"
}
```

**Expected:**
- Order removed from archive
- Activity "Permanently deleted order CEN-010-PO-XXX" (admin feed only)
- Non-admin users do NOT see this activity

---

## Test A5: Tombstone Fetch (Deleted Entity)

### As Admin
```bash
GET /api/entity/order/CEN-010-PO-XXX?includeDeleted=1
Authorization: Bearer <admin-token>
```

**Expected Response:**
```json
{
  "entity": {
    "order_id": "CEN-010-PO-XXX",
    "order_type": "product",
    "status": "delivered",
    "requested_by_code": "CEN-010",
    "requested_by_role": "center",
    "destination_code": "WHS-001",
    "destination_role": "warehouse",
    "items": [
      { "item_id": "...", "catalog_code": "PRD-001", "quantity": 5 },
      { "item_id": "...", "catalog_code": "PRD-002", "quantity": 10 }
    ],
    "requestor_info": {
      "data": {
        "center_id": "CEN-010",
        "name": "Test Center",
        "email": "[REDACTED]",  // PII redacted
        "phone": "[REDACTED]"
      }
    },
    "destination_info": {
      "data": {
        "warehouse_id": "WHS-001",
        "name": "Main Warehouse",
        "address": "[REDACTED]"  // PII redacted
      }
    }
  },
  "state": "deleted",
  "deletedAt": "2025-10-14T22:30:00Z",
  "deletedBy": "ADMIN"
}
```

**Verify:**
- ✅ Snapshot includes order items
- ✅ Snapshot includes requestor_info and destination_info
- ✅ PII fields are `[REDACTED]`
- ✅ Order base fields present (order_id, status, etc.)

### As Non-Admin (in ecosystem)
```bash
GET /api/entity/order/CEN-010-PO-XXX?includeDeleted=1
Authorization: Bearer <center-token>
```

**Expected Response:** `403 Forbidden`
```json
{
  "error": "Forbidden",
  "reason": "Only admins can access deleted entities"
}
```

### As Non-Admin (out of ecosystem)
```bash
GET /api/entity/order/MGR-012-PO-999?includeDeleted=1
Authorization: Bearer <crew-token-for-different-ecosystem>
```

**Expected Response:** `403 Forbidden`
```json
{
  "error": "Forbidden",
  "reason": "Entity not in your ecosystem scope"
}
```

---

## Test A6: Tier-4 Activity Filters

### Non-Admin User (CEN-010) Recent Activity

**Should SEE:**
- ✅ "Product order CEN-010-PO-XXX created" (target is self)
- ✅ "Product order CEN-010-PO-XXX delivered"
- ✅ "Service order CEN-010-SO-YYY completed"
- ✅ "Product order CEN-010-PO-ZZZ cancelled"

**Should NOT SEE:**
- ❌ "Center CEN-010 created" (unless target is self, but `*_created` excluded)
- ❌ "Assigned CRW-006 to center CEN-010" (assignment event, Tier-4)
- ❌ "Archived order CEN-010-PO-XXX" (Tier-1)
- ❌ "Permanently deleted order CEN-010-PO-XXX" (Tier-1)

### Admin User Recent Activity

**Should SEE:**
- ✅ All order lifecycle events
- ✅ "Archived order CEN-010-PO-XXX"
- ✅ "Permanently deleted order CEN-010-PO-XXX"
- ✅ "Center CEN-010 created"
- ✅ "Assigned CRW-006 to center CEN-010"

---

## Test A7: Old Deletion Without Snapshot

**Setup:** Manually create deletion activity without snapshot (simulate pre-enrichment deletion)

```sql
INSERT INTO system_activity (
  activity_type, description, actor_id, actor_role,
  target_id, target_type, metadata, created_at
) VALUES (
  'order_hard_deleted',
  'Permanently deleted order OLD-PO-999',
  'ADMIN',
  'admin',
  'OLD-PO-999',
  'order',
  '{"reason": "Old deletion before enrichment", "deletedAt": "2025-09-01T10:00:00Z"}'::jsonb,
  '2025-09-01 10:00:00'
);
```

**Test:**
```bash
GET /api/entity/order/OLD-PO-999?includeDeleted=1
Authorization: Bearer <admin-token>
```

**Expected Response:**
```json
{
  "entity": {
    "order_id": "OLD-PO-999",
    "_tombstone": true,
    "_note": "Deletion occurred before snapshot enrichment was implemented"
  },
  "state": "deleted",
  "deletedAt": "2025-09-01T10:00:00Z",
  "deletedBy": "ADMIN"
}
```

**Frontend should:**
- Detect `_tombstone: true`
- Show minimal banner: "Order OLD-PO-999 was deleted on Sep 1, 2025 by ADMIN"
- Not attempt to render detailed fields

---

## Success Criteria

### Security ✅
- [ ] Non-admin cannot fetch `includeDeleted=1` (403)
- [ ] Non-admin cannot fetch out-of-ecosystem entity (403)
- [ ] Admin can fetch all entities in all states

### Data Integrity ✅
- [ ] Deleted order snapshot includes items array
- [ ] Deleted order snapshot includes requestor_info and destination_info
- [ ] PII fields are `[REDACTED]` in all snapshots

### Activity Filters ✅
- [ ] Non-admin does NOT see `*_archived`, `*_deleted`, `*_hard_deleted` (Tier-1)
- [ ] Non-admin does NOT see `*_created` (unless self) or `*_assigned*` (unless self) (Tier-4)
- [ ] Admin sees all activity types

### Performance ✅
- [ ] Deleted entity lookup uses `idx_activity_deleted_lookup` (verify with EXPLAIN ANALYZE)
- [ ] Active-only queries use `idx_{table}_active_only` partial index

### Activity Categorization ✅
- [ ] "delivered" → green badge (success)
- [ ] "completed" → green badge (success)
- [ ] "cancelled" → yellow badge (warning)
- [ ] "rejected" → yellow badge (warning)
- [ ] "created" → blue badge (action)
- [ ] "delivery_started" → blue badge (action)

---

## Quick Validation Commands

```bash
# 1. Run indexes
cd apps/backend && pnpm tsx server/db/add-archive-indexes.ts

# 2. Start backend
PORT=4000 pnpm dev:backend

# 3. In another terminal, test entity endpoint
curl http://localhost:4000/api/entity/order/CEN-010-PO-XXX?includeDeleted=1 \
  -H "Authorization: Bearer <admin-token>"

# 4. Verify indexes in DB
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_%archived%' ORDER BY indexname;"
```

---

## Notes

- Phase 1 is backend-only validation
- Frontend DeletedBanner and onClick routing will be implemented in Phase C
- Phase B (retention cron) is deferred until after frontend ships
