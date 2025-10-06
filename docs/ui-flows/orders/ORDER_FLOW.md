# CKS Order Flow Documentation

> 2025-10-01 Update (Codex)
>
> - Creator stage is canonical and remains "requested" (green) in the workflow; only the fulfillment stage reflects final outcomes (cancelled, delivered, rejected).
> - Status chip added to Order Details with color mapping: pending (yellow), in‑progress (blue), completed (green), cancelled/rejected (red).
> - Product orders now use an Availability Window (days + time range, with timezone) displayed in Order Details; the previous Expected Delivery date is no longer shown in the modal.
> - Creators always see "View Details" in actions alongside "Cancel" while the next actor has not accepted yet.

## Overview
Single source of truth for all order workflows in the CKS Portal system, including service and product order lifecycles, approval stages, status logic, and visual states.

## Related Code Files
- **Order Card UI Component**: `/packages/ui/src/cards/OrderCard/OrderCard.tsx`
- **Order Types**: `/apps/backend/server/domains/orders/types.ts`
- **Store Logic**: `/apps/backend/server/domains/orders/store.ts`
- **Order Service**: `/apps/backend/server/domains/orders/service.ts`
- **API Routes**: `/apps/backend/server/domains/orders/routes.fastify.ts`

## Order Types

### Service Orders
Requests for CKS services (cleaning, maintenance, etc.)

**Who can create:**
- Customers
- Centers
- Contractors

**Workflow:**
1. Customer/Center/Contractor creates service request
2. Manager reviews and creates service (transforms to service ID)
3. Service is scheduled and assigned to crew
4. Service execution and completion

### Product Orders
Requests for supplies and equipment from the warehouse.

**Who can create:**
- Crew members
- Centers
- Contractors
- Customers
- Managers

**Note:** Warehouse users do not initiate product orders; they only review and fulfill.

**Workflow:**
1. Requester creates product order
2. Warehouse reviews (Accept/Deny)
3. If accepted, warehouse prepares for delivery
4. Delivery completion

## Order ID Format
All orders follow: `{UserID}-ORD-{TypeID}`
- **UserID**: Creator's ID (e.g., CRW001, CTR002, CUS003)
- **ORD**: Fixed identifier
- **TypeID**: Either SRV### for service or PRD### for product

Examples:
- `CRW001-ORD-PRD001` - Product order by Crew member CRW001
- `CTR002-ORD-SRV005` - Service order by Center CTR002

When transformed to service, the `transformedId` field stores the service ID (e.g., `SRV-2025-001`) while the original orderId remains unchanged for auditing.

## Status System

### Order Status Values (`OrderStatus` type)
These are the canonical statuses stored in the database:
- `pending` - Action required by next actor
- `in-progress` - Waiting for other users to take action
- `approved` - Order approved but not yet fulfilled
- `rejected` - Order was denied
- `delivered` - Product order delivered (final state)
- `service-created` - Service order transformed (final state)
- `cancelled` - Order cancelled

### Viewer Status (`viewerStatus` field)
Derived status shown to each user based on their role:
- **Next actor sees**: `pending` (yellow, pulsing)
- **Requester waiting sees**: `in-progress` (blue)
- **Others see**: Canonical status
- **Final states**: Same for all viewers

### Approval Stage Status Values
Used in the workflow visualization boxes:
- `requested` - Requester completed their part (green)
- `pending` - Awaiting action (yellow, pulsing)
- `accepted` - Warehouse accepted, awaiting delivery (yellow, pulsing)
- `approved` - Approved/completed (green)
- `rejected` - Denied (red)
- `cancelled` - Cancelled (red)
- `delivered` - Delivered (green)
- `service-created` - Service created (green)
- `waiting` - Future actor waiting (yellow, no pulse)

## Visual Design System

### Color Coding
- **Yellow (#fbbf24)**: Active states requiring attention
  - Background: #fef3c7 (light yellow)
  - States: pending, accepted (pulsing indicates action needed)
- **Blue (#3b82f6)**: In-progress/waiting states
  - Background: #dbeafe (light blue)
  - States: in-progress
- **Green (#10b981)**: Completed/approved states
  - Background: #dcfce7 (light green)
  - States: approved, delivered, service-created, requested
- **Red (#ef4444)**: Failed states
  - Background: #fee2e2 (light red)
  - States: rejected, cancelled
- **Gray (#6b7280)**: Inactive/informational elements
  - Background: #f9fafb

### Pulsing Animation
Applied only to stages requiring immediate action:
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
  }
  50% {
    opacity: 0.9;
    box-shadow: 0 0 0 8px rgba(251, 191, 36, 0);
  }
}
```
**Pulsing rules:**
- Only `pending` and `accepted` stages pulse
- Only the FIRST pending/accepted stage in the workflow pulses
- Indicates "action needed here now"

## Workflow Examples

### Product Order Flow

#### Stage 1: Created by Crew, Pending Warehouse
**Order State:**
- Status: `pending`
- Crew viewerStatus: `in-progress`
- Warehouse viewerStatus: `pending`

**Workflow Display:**
```
Crew (✓ requested/green) → Warehouse (⏳ pending/yellow PULSING)
```

#### Stage 2: Accepted by Warehouse, Awaiting Delivery
**Order State:**
- Status: `approved`
- Crew viewerStatus: `in-progress`
- Warehouse viewerStatus: `approved`

**Workflow Display:**
```
Crew (✓ requested/green) → Warehouse (⏳ accepted/yellow PULSING)
```

#### Stage 3: Delivered
**Order State:**
- Status: `delivered`
- All viewerStatus: `delivered`

**Workflow Display:**
```
Crew (✓ requested/green) → Warehouse (✓ delivered/green)
```

### Service Order Flow

#### Stage 1: Created by Center, Pending Manager
**Order State:**
- Status: `pending`
- Center viewerStatus: `in-progress`
- Manager viewerStatus: `pending`

**Workflow Display:**
```
Center (✓ requested/green) → Manager (⏳ pending/yellow PULSING)
```

#### Stage 2: Service Created
**Order State:**
- Status: `service-created`
- All viewerStatus: `service-created`
- transformedId: `SRV-2025-001`

**Workflow Display:**
```
Center (✓ requested/green) → Manager (✓ service-created/green)
```

## Role-Based Permissions

### Manager
- **View**: ALL orders in ecosystem
- **Actions**: Create Service (for service orders), monitor others
- **Tabs**: Service Orders, Product Orders, Archive

### Warehouse
- **View**: Product orders requiring warehouse action
- **Actions**: Accept, Deny, Deliver, Cancel
- **Special**: Deliveries tab with sub-tabs (One-Time, Recurring, Archive)
- **Cannot**: Create orders

### Crew
- **View**: Own product orders, assigned service orders
- **Actions**: Create product orders, cancel own pending orders
- **Limited**: Workflow visibility

### Center/Customer/Contractor
- **View**: Orders they created or are involved in
- **Actions**: Create both order types, cancel own pending orders
- **Full**: Workflow visibility for their orders

## Order Card UI States

### Collapsed (Default)
Single-line colored header showing:
- Expand arrow
- Order type badge (SERVICE/PRODUCT)
- Order ID (blue, clickable)
- Title (gray)
- Status badge (right-aligned)

### Expanded
Full details including:
- Order Details section
  - Requested By
  - Destination (product orders)
  - Date Requested
  - Expected Date
  - Service Start Date (when service-created)
  - Delivery Date (when delivered)
- Approval Workflow visualization
- Items list
- Action buttons (role-specific)
- Transformation notice (for service-created)

## Tab Organization

All order sections have three tabs:
1. **Service Orders**: Active service order requests
2. **Product Orders**: Active product order requests
3. **Archive**: Final states (delivered, service-created, rejected, cancelled)

Each tab displays:
- Count badge
- Search functionality
- Role-specific action buttons

## Action Buttons

### By Action Type
- **Approve/Accept/Create Service**: Green style
- **Reject/Deny/Cancel**: Red style
- **Assign/Add/Deliver**: Blue style
- **View Details**: Default gray

### By Role
- **Request Service**: Contractor, Customer, Center
- **Request Products**: Contractor, Customer, Center, Crew, Manager
- **Accept/Deny**: Warehouse (for pending product orders)
- **Deliver**: Warehouse (for accepted product orders)
- **Create Service**: Manager (for pending service orders)
- **Cancel**: Creator (for own pending orders)

## Data Model

### Required Fields
- `orderId`: Unique identifier
- `orderType`: 'service' | 'product'
- `title`: Order title/description
- `requestedBy`: User ID who created
- `requestedDate`: Creation timestamp
- `status`: Current order status
- `viewerStatus`: Derived status for current viewer

### Optional Fields
- `destination`: Delivery destination
- `expectedDate`: Requested delivery/service date
- `deliveryDate`: Actual delivery completion
- `serviceStartDate`: When service begins
- `approvalStages`: Workflow visualization array
- `transformedId`: Service ID after transformation
- `items`: Array of products/services
- `notes`: Additional notes
- `rejectionReason`: Why order was rejected
- `nextActorRole`: Who needs to act next
- `assignedWarehouse`: Warehouse handling order

## Critical Implementation Notes

1. **Status vs ViewerStatus**: The `status` field is canonical truth; `viewerStatus` is derived per user role
2. **Approval Stages**: Use different status enum than main order status
3. **Pulsing Logic**: Find first pending/accepted stage, apply pulse only there
4. **Type Safety**: Keep `OrderStatus`, `OrderViewerStatus`, and `ApprovalStage.status` as separate types
5. **Archive Logic**: Orders with final states (delivered, service-created, rejected, cancelled) go to Archive tab

## Warehouse Delivery Workflow

### Product Order Delivery States

#### Stage 1: Warehouse Accepts Order
**Order State:**
- Canonical Status: `pending_warehouse` → `awaiting_delivery`
- Warehouse viewerStatus: `approved`
- Creator viewerStatus: `in-progress`

**Actions Available:**
- Warehouse: Start Delivery, View Details

**Workflow Display:**
```
Creator (✓ requested/green) → Warehouse (⏳ accepted/yellow PULSING)
```

#### Stage 2: Delivery Started
**Order State:**
- Canonical Status: `awaiting_delivery`
- Metadata: `{ deliveryStarted: true }`
- Warehouse viewerStatus: `approved`

**Actions Available:**
- Warehouse: Mark Delivered, View Details

**Workflow Display:**
```
Creator (✓ requested/green) → Warehouse (🚚 out for delivery/yellow PULSING)
```

#### Stage 3: Delivered
**Order State:**
- Canonical Status: `delivered`
- All viewerStatus: `completed`
- deliveryDate: timestamp set
- Inventory decreased automatically

**Actions Available:**
- All users: View Details only

**Workflow Display:**
```
Creator (✓ requested/green) → Warehouse (✓ delivered/green)
```

### Deliveries Section UI (Warehouse Only)

The Deliveries section in WarehouseHub provides dedicated delivery management separate from the Orders section.

**Pending Deliveries Tab:**
- Shows: Orders with canonical status `pending_warehouse` or `awaiting_delivery`
- Action Buttons:
  - Before delivery starts: "Start Delivery"
  - After delivery starts: "Mark Delivered"
- Columns: DELIVERY ID, ITEM, DESTINATION, STATUS, SCHEDULED DATE, ACTIONS

**Completed Deliveries Tab:**
- Shows: Orders with canonical status `delivered`
- Read-only view with completion details
- Columns: DELIVERY ID, ITEM, DESTINATION, STATUS, SCHEDULED DATE, COMPLETED DATE

### Inventory Impact

When marking order as delivered via "Mark Delivered" action:

1. **Query Order Items**: Retrieve all items in order from `order_items` table
2. **Get Warehouse**: Identify assigned warehouse from order
3. **Decrease Inventory**: For each item at assigned warehouse:
   - Decrease `quantity_on_hand` in `inventory_items` by order quantity
   - Update occurs automatically in same transaction as status change
4. **Update Order**:
   - Set `deliveryDate` timestamp to current time
   - Change canonical status to `delivered`
   - Archive order for all users
5. **Notify Users**: All users see order in Archive tab with "completed" viewer status

### Orders vs Deliveries Separation

**Orders Section (Warehouse):**
- Shows pending product orders requiring accept/reject decision
- Actions: Accept, Deny (for pending), View Details (for accepted)
- NO delivery actions shown here

**Deliveries Section (Warehouse):**
- Shows accepted orders requiring delivery fulfillment
- Actions: Start Delivery, Mark Delivered
- Delivery workflow managed here exclusively

This separation ensures warehouse users have clear action contexts:
- Orders = Decision to accept/reject
- Deliveries = Physical fulfillment process

---

*Last Updated: 2025-10-06*
*Version: 2.3 - Service-product linking and catalog UX improvements*

## Progress Update (2025-10-06)

- **Service-to-Product Order Linking**: Product orders can now be linked to services via `metadata.serviceId`
- **Products Section in ServiceViewModal**: New section displays all product orders linked to a service
- **Progressive Disclosure UX**: Cascading destination selectors in CKS Catalog now reveal one dropdown at a time based on selections
  - Manager: Contractor → Customer (after contractor selected) → Center (after customer selected)
  - Contractor: Customer → Center (after customer selected)
  - Customer/Crew: Just Center (no cascading)
- **Context-Aware Catalog Views**: Catalog supports URL parameter filtering
  - `?mode=products`: Shows only Products tab (used by "Request Products" buttons)
  - `?mode=services`: Shows only Services tab (future use)
  - No parameter: Full catalog with both tabs (used by "Browse Catalog" buttons)
- **Fresh Service Data Fetching**: Service modals now fetch from `/services/:serviceId` endpoint when opened (applied to CustomerHub, CrewHub, ContractorHub, CenterHub)
- **Known Issues**: Crew assignments and start dates not displaying correctly in service view modals for non-manager users - investigation ongoing

## Progress Update (2025-10-02)

- Warehouse delivery workflow complete: Start Delivery → Mark Delivered → Archive
- Delivery actions (start-delivery, deliver) added to policy for warehouse role at awaiting_delivery status
- Inventory automatically decreased when order marked as delivered
- deliveryStarted metadata flag tracks delivery state for UI button display
- Status normalization fixed across all 6 hub files to recognize 'completed' and 'archived' viewer statuses
- Archive filtering updated to include 'completed' and 'archived' statuses
- Orders section filters out delivery actions for warehouse product orders
- Deliveries section uses canonical status for filtering, viewer status for display
- Cross-user consistency: All users see delivered orders correctly in Archive with proper status

## Progress Update (2025-09-29)

- Canonical status usage: Frontend now reads canonical `status` values directly for Admin Directory views; role/viewer remapping is being phased out in favor of a central policy lookup.
- Warehouse accept/deliver flow: Accept moves `pending_warehouse → awaiting_delivery`; the UI now shows the updated state and “Deliver” action as expected after refresh.
- Admin Directory → Orders table mapping fixed:
  - TYPE shows "One-Time" for now (recurring/ongoing orders planned post‑MVP).
  - REQUESTED BY prefers `created_by` (fallback: `center_id` → `customer_id`).
  - DESTINATION uses `destination` (center/customer) rather than `assigned_warehouse`.
- Archive integration for orders:
  - Orders now support soft delete (archive), restore, and hard delete.
  - Directory lists exclude archived orders (`WHERE archived_at IS NULL`).
  - Archive routes: `GET /api/archive/list`, `POST /api/archive/delete`, `POST /api/archive/restore`, `DELETE /api/archive/hard-delete`.
- Directory consistency: Services, Products, Reports, and Feedback directory queries also exclude archived items.
- Next up (post‑MVP): Add `is_recurring` + `recurrence` to orders to label TYPE as “Ongoing” where applicable; automation/generation to follow later.
