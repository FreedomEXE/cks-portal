# Activity Recording Taxonomy

> **Purpose:** Define what activities need to be recorded in `system_activity` table based on the old client-side synthesis logic and current system behavior.

## Analysis Source

This taxonomy is derived from:
1. Old `buildActivities()` functions in hub .bak files (what users used to see)
2. Current order/service status flow in backend
3. Existing activity types in `system_activity` table

## Current State (Already Recorded)

### User Lifecycle ✅
- `manager_created`, `contractor_created`, `customer_created`, `center_created`, `crew_created`, `warehouse_created`
- `manager_archived`, `contractor_archived`, `customer_archived`, `center_archived`, `crew_archived`, `warehouse_archived`
- `manager_deleted`, `contractor_deleted`, `customer_deleted`, `center_deleted`, `crew_deleted`, `warehouse_deleted`
- `manager_hard_deleted`, `contractor_hard_deleted`, `customer_hard_deleted`, `center_hard_deleted`, `crew_hard_deleted`, `warehouse_hard_deleted`
- `manager_restored`, `contractor_restored`, `customer_restored`, `center_restored`, `crew_restored`, `warehouse_restored`

### Assignments ✅
- `contractor_assigned_to_manager`
- `customer_assigned_to_contractor`
- `center_assigned_to_customer`
- `crew_assigned_to_center`
- `order_assigned_to_warehouse` (if implemented)

### Archive Operations ✅
- `order_archived`, `order_hard_deleted`, `order_restored`
- `service_archived`, `service_hard_deleted`, `service_restored`
- `report_archived`, `report_hard_deleted`
- `feedback_archived`, `feedback_hard_deleted`
- `product_archived`, `product_hard_deleted`

---

## Missing (Need to Implement)

### Order Lifecycle ❌

Based on old `buildActivities()` logic which generated messages like:
- "Product order PO-123 Pending"
- "Service order SO-456 Completed"
- "Product order PO-789 Delivered"

**Order Creation:**
- `order_created` - When order is first created by any role
  - Message: "Product order {orderId} created" or "Service order {orderId} created"
  - Actor: User who created order (center, customer, etc.)
  - Target: Order ID
  - Metadata: `{ orderId, orderType: 'product'|'service', customerId?, centerId?, warehouseId?, managerId? }`

**Order Status Transitions:**
- `order_pending` - Order waiting for action (may be redundant with created)
- `order_accepted` - Order accepted by fulfiller (warehouse/manager/crew)
  - Message: "Order {orderId} accepted by {actorId}"
  - Actor: Warehouse/Manager who accepted
  - Metadata: Include all scoping keys for filtering

- `order_approved` - Order approved by authority
  - Message: "Order {orderId} approved"
  - Similar pattern

- `order_rejected` - Order rejected
  - Message: "Order {orderId} rejected by {actorId}"
  - Category: 'warning'

- `order_cancelled` - Order cancelled
  - Message: "Order {orderId} cancelled"
  - Category: 'warning'

- `order_delivered` - Order marked as delivered (FINAL STATUS)
  - Message: "Order {orderId} delivered to {destination}"
  - Category: 'success'

- `order_completed` - Order completed (may overlap with delivered)
  - Message: "Order {orderId} completed"
  - Category: 'success'

**Order Updates:**
- `order_updated` - Order details modified
  - Message: "Order {orderId} updated"
  - Category: 'info'

### Service Lifecycle ❌

**Service Creation:**
- `service_created` - Service instance created
  - Message: "Service {serviceName} created at {centerId}"
  - Actor: Admin or manager
  - Metadata: `{ serviceId, centerId, customerId?, managerId? }`

**Service Status Transitions:**
- `service_started` / `service_active` - Service begins
  - Message: "Service {serviceName} started at {centerId}"
  - Category: 'action'

- `service_completed` - Service finished
  - Message: "Service {serviceName} completed"
  - Category: 'success'

- `service_cancelled` - Service cancelled
  - Message: "Service {serviceName} cancelled"
  - Category: 'warning'

**Service Updates:**
- `service_updated` - Service details modified
  - Message: "Service {serviceName} updated"
  - Category: 'info'

### Crew Operations ❌

Based on order status flow:
- `crew_requested` - Crew requested for an order
  - Message: "Crew requested for order {orderId}"
  - Metadata: Include orderId, centerId

- `crew_assigned_to_order` - Specific crew assigned to order (different from crew_assigned_to_center)
  - Message: "Crew {crewId} assigned to order {orderId}"

### Warehouse Operations ❌

- `order_assigned_to_warehouse` - Order assigned to warehouse for fulfillment
  - Message: "Order {orderId} assigned to warehouse {warehouseId}"

### Reports & Feedback (if not already recorded)

- `report_created` - New report filed
- `report_updated` - Report status changed
- `report_resolved` - Report resolved
- `feedback_created` - New feedback submitted
- `feedback_addressed` - Feedback responded to

---

## Activity Recording Pattern

For each new activity type, the backend should write:

```sql
INSERT INTO system_activity (
  activity_type,
  description,
  actor_id,
  actor_role,
  target_id,
  target_type,
  metadata,
  created_at
) VALUES (
  'order_created',
  'Product order PO-123 created',
  'CEN-010',
  'center',
  'PO-123',
  'order',
  jsonb_build_object(
    'orderId', 'PO-123',
    'orderType', 'product',
    'centerId', 'CEN-010',
    'customerId', 'CUS-015',
    'contractorId', 'CON-010',
    'managerId', 'MGR-012'
  ),
  NOW()
)
```

**Metadata Keys for Scoping:**
Always include relevant hierarchy keys so filtering works:
- `managerId` - Manager in hierarchy
- `contractorId` - Contractor in hierarchy
- `customerId` - Customer in hierarchy
- `centerId` - Center where action occurred
- `crewId` - Crew involved
- `warehouseId` - Warehouse involved
- `orderId` - Order ID
- `serviceId` - Service ID

---

## Implementation Priority

### Phase 1 - Orders (High Impact)
1. `order_created` - Most visible, shows order activity
2. `order_delivered` / `order_completed` - Success states users want to see
3. `order_rejected` / `order_cancelled` - Error states for visibility

### Phase 2 - Order Workflow
4. `order_accepted` / `order_approved` - Mid-workflow visibility
5. `order_updated` - General changes

### Phase 3 - Services
6. `service_created` / `service_completed` / `service_cancelled`

### Phase 4 - Specialized
7. Crew/warehouse specific activities
8. Reports/feedback if not already covered

---

## Where to Instrument

### Orders Domain
- **File:** `apps/backend/server/domains/orders/store.ts`
- **Functions to instrument:**
  - `createOrder()` → write `order_created`
  - `updateOrderStatus()` / `applyOrderAction()` → write status-specific activities
  - Any order update functions → write `order_updated`

### Services Domain
- **File:** `apps/backend/server/domains/services/store.ts`
- **Functions to instrument:** Service creation, updates, status changes

### Activity Writer Utility
Create centralized writer:
```typescript
// apps/backend/server/domains/activity/writer.ts
export async function recordActivity(params: {
  activityType: string;
  description: string;
  actorId: string;
  actorRole: string;
  targetId: string;
  targetType: string;
  metadata: Record<string, unknown>;
}) {
  // Insert into system_activity
  // Non-blocking, try/catch so it never fails the main operation
}
```

---

## Next Steps

1. **Review this taxonomy** - Does it cover what you remember seeing?
2. **Prioritize** - Which activity types are most important?
3. **Implement Phase 1** - Start with order_created, order_delivered, order_completed
4. **Test with new orders** - Create fresh test data to validate
5. **Iterate** - Add more activity types based on usage

---

## Notes

- **No backfill** - Don't try to reconstruct historical activities, start fresh
- **Non-blocking writes** - Activity recording should never fail the main operation
- **Consistent metadata** - Always include scoping keys for filtering
- **Actor attribution** - Use actual authenticated user, never default to admin
- **Idempotency** - Consider adding correlation_id to prevent duplicates if needed
