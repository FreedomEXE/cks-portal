# CKS Orders UI Flow and Descriptors

**Document Version:** 1.0  
**Last Updated:** September 11, 2025  
**Purpose:** Comprehensive specification for CKS order system architecture, UI flows, and business logic

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Order Types & Structure](#order-types--structure)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Order Lifecycle](#order-lifecycle)
5. [UI Layout & Functionality](#ui-layout--functionality)
6. [Order ID Structure](#order-id-structure)
7. [Cross-Role Interactions](#cross-role-interactions)
8. [Order-to-Service Transformation](#order-to-service-transformation)
9. [Technical Implementation](#technical-implementation)
10. [Business Rules](#business-rules)

---

## System Overview

The CKS order system facilitates procurement and service requests across six primary user types:
- **Managers** - Oversight, reporting, and system administration
- **Contractors** - Provide services, request supplies and services
- **Customers** - Request services from contractors, limited supply access
- **Centers** - Request supplies and services, approve contractor/crew requests
- **Crews** - Request supplies and services (similar to contractors but center-managed)
- **Warehouses** - Fulfill supply orders, provide logistics services

*Note: Admin role will be added in future iterations for system-wide administration*

### Core Principles
1. **Dual Order System**: Supply Orders (SUP) and Service Orders (SRV)
2. **Permission-Based Workflows**: Different approval chains based on user roles
3. **Traceability**: Every order maintains complete audit trail
4. **Status-Driven UI**: Interface adapts based on order status and user permissions

---

## Order Types & Structure

### 1. Supply Orders (SUP)
**Purpose:** Request physical supplies/equipment from warehouses  
**ID Format:** `[REQUESTER]-ORD-SUP[XXX]`  
**Examples:** `CRW001-ORD-SUP001`, `CTR002-ORD-SUP003`

**Key Fields:**
- `order_id`: Unique identifier
- `requester_id`: Who initiated the order
- `supply_id`: What supply is being ordered
- `quantity`: Amount requested
- `priority`: Low/Medium/High/Urgent
- `delivery_location`: Where to deliver
- `requested_date`: When needed
- `approval_status`: Pending/Approved/Denied
- `fulfillment_status`: Pending/Processing/Shipped/Delivered

### 2. Service Orders (SRV)
**Purpose:** Request services from contractors/warehouses  
**ID Format:** `[REQUESTER]-ORD-SRV[XXX]`  
**Examples:** `CTR001-ORD-SRV001`, `CRW003-ORD-SRV002`

**Key Fields:**
- `order_id`: Unique identifier
- `requester_id`: Who initiated the order
- `service_id`: What service is being ordered
- `service_provider`: Who will provide the service
- `location`: Where service is needed
- `scheduled_date`: When service is needed
- `approval_status`: Pending/Approved/Denied
- `service_status`: Pending/Scheduled/In Progress/Completed

---

## User Roles & Permissions

### Contractor Permissions
**Can Create:**
- Supply Orders: ✅ (requires center approval)
- Service Orders: ✅ (requires center approval)

**Can View:**
- Own orders: ✅ (all statuses)
- Center orders: ❌
- Other contractor orders: ❌

**Can Approve:**
- Supply Orders: ❌
- Service Orders: ❌

**Special Actions:**
- Cancel own pending orders: ✅
- Modify pending orders: ✅ (before approval)

### Center Permissions
**Can Create:**
- Supply Orders: ✅ (direct to warehouse)
- Service Orders: ✅ (direct to provider)

**Can View:**
- Own orders: ✅ (all statuses)
- Contractor orders from their contractors: ✅
- Other center orders: ❌

**Can Approve:**
- Contractor supply orders: ✅
- Contractor service orders: ✅
- Own orders: Auto-approved

**Special Actions:**
- Bulk approve contractor orders: ✅
- Modify contractor orders: ✅ (before forwarding to warehouse)
- Cancel orders: ✅ (before fulfillment starts)

### Warehouse Permissions
**Can Create:**
- Service Orders: ❌ (warehouses provide services, don't order them)
- Supply Orders: ❌ (warehouses fulfill, don't create)

**Can View:**
- All supply orders assigned to them: ✅
- Service orders for their services: ✅
- Other warehouse orders: ❌

**Can Approve:**
- Supply Orders: ✅ (for fulfillment)
- Service Orders: ✅ (for scheduling)

**Special Actions:**
- Mark orders as "In Progress": ✅
- Complete/deliver orders: ✅
- Reject orders (insufficient inventory): ✅

### Manager Permissions
**Can Create:**
- Any type of order: ✅
- Emergency/priority orders: ✅

**Can View:**
- All orders system-wide: ✅
- Order analytics and reports: ✅

**Can Approve:**
- Any order: ✅ (override capability)
- Bulk operations: ✅

**Special Actions:**
- Emergency order prioritization: ✅
- System-wide order cancellation: ✅
- Order reassignment: ✅

---

## Order Lifecycle

### Supply Order Lifecycle
```
1. CREATED (by contractor/center)
   ↓
2. PENDING_APPROVAL (if contractor → center approval)
   ↓
3. APPROVED (by center/auto if center-created)
   ↓
4. FORWARDED_TO_WAREHOUSE
   ↓
5. WAREHOUSE_PENDING (warehouse review)
   ↓
6. WAREHOUSE_APPROVED (warehouse accepts)
   ↓
7. IN_PROGRESS (warehouse processing)
   ↓
8. READY_FOR_DELIVERY
   ↓
9. OUT_FOR_DELIVERY
   ↓
10. DELIVERED (completed)

Alternative paths:
- DENIED (at any approval stage)
- CANCELLED (by requester before processing)
- REJECTED (by warehouse - insufficient inventory)
```

### Service Order Lifecycle
```
1. CREATED (by contractor/center)
   ↓
2. PENDING_APPROVAL (if contractor → center approval)
   ↓
3. APPROVED (by center/auto if center-created)
   ↓
4. FORWARDED_TO_PROVIDER
   ↓
5. PROVIDER_PENDING (service provider review)
   ↓
6. PROVIDER_APPROVED (service provider accepts)
   ↓
7. SCHEDULED (date/time confirmed)
   ↓
8. IN_PROGRESS (service being performed)
   ↓
9. COMPLETED (service finished)

Alternative paths:
- DENIED (at any approval stage)
- CANCELLED (by requester before service starts)
- REJECTED (by provider - unavailable/conflict)
```

---

## UI Layout & Functionality

### Orders Tab Structure (All Roles)
The Orders tab uses a consistent three-section layout:

#### 1. In Progress Section
**Purpose:** Active orders requiring attention  
**Filters:** Status = Pending, Approved, In Progress  
**Display:** Table format with action buttons

**Columns (Supply Orders):**
- Order ID (clickable for details)
- Supply Name
- Quantity
- Requester
- Priority (color-coded badge)
- Status (color-coded badge)
- Actions (Approve/Deny/View buttons)

**Columns (Service Orders):**
- Order ID (clickable for details)
- Service Name  
- Provider
- Requester
- Scheduled Date
- Status (color-coded badge)
- Actions (Approve/Deny/Schedule buttons)

#### 2. Pending Approval Section
**Purpose:** Orders awaiting user's approval  
**Visibility:** Only for users with approval permissions  
**Features:**
- Bulk approval checkbox
- "Approve All" button
- Individual approve/deny actions
- Priority sorting

#### 3. Order History Section
**Purpose:** Completed, cancelled, or denied orders  
**Filters:** Status = Delivered, Completed, Cancelled, Denied  
**Features:**
- Read-only view
- Search/filter functionality
- Export capability (CSV/PDF)

### Action Buttons by Role

#### Contractor Actions
- **"Request Supplies"** - Opens supply order form
- **"Request Service"** - Opens service order form
- **"Cancel"** - Cancel pending orders (own orders only)
- **"View Details"** - View order details and status

#### Center Actions
- **"Request Supplies"** - Create direct supply order
- **"Request Service"** - Create direct service order
- **"Approve"** - Approve contractor orders
- **"Deny"** - Deny contractor orders with reason
- **"Modify"** - Edit contractor orders before approval
- **"Bulk Approve"** - Approve multiple contractor orders

#### Warehouse Actions
- **"Accept"** - Accept supply/service orders for fulfillment
- **"Reject"** - Reject orders with reason
- **"Start Processing"** - Mark order as in progress
- **"Ready for Delivery"** - Mark supplies ready
- **"Complete"** - Mark order as fulfilled/delivered

#### Manager Actions
- **"Override Approve"** - Force approve any order
- **"Prioritize"** - Change order priority
- **"Reassign"** - Change order assignment
- **"Generate Report"** - Export order data

---

## Order ID Structure

### Format: `[REQUESTER]-ORD-[TYPE][NUMBER]`

#### Components Breakdown:

**REQUESTER (3-6 chars):**
- `CRW###` = Contractor ID (e.g., CRW001, CRW045)
- `CTR###` = Center ID (e.g., CTR001, CTR012)
- `WHS###` = Warehouse ID (e.g., WHS001)
- `MGR###` = Manager ID (e.g., MGR001)

**ORD (3 chars):**
- Fixed literal "ORD" indicating this is an order
- Distinguishes from direct service IDs (SRV-001) or supply IDs (SUP-001)

**TYPE+NUMBER (6 chars):**
- `SUP###` = Supply order (e.g., SUP001, SUP045)
- `SRV###` = Service order (e.g., SRV001, SRV023)

#### Examples with Context:
- `CRW001-ORD-SUP001` = Contractor 001 ordered Supply 001
- `CTR002-ORD-SRV003` = Center 002 ordered Service 003
- `MGR001-ORD-SUP012` = Manager 001 emergency ordered Supply 012

### ID Evolution Through Lifecycle:

**Original Order:** `CRW001-ORD-SUP001`
1. Order created by contractor
2. Approved by center → same ID
3. Forwarded to warehouse → same ID
4. Becomes delivery → `DEL-001` (references original order ID)

**Service Transformation:** `CTR001-ORD-SRV002`
1. Order created by center
2. Accepted by contractor → becomes `SRV002-CTR001` (service instance)

---

## Cross-Role Interactions

### Contractor → Center → Warehouse Flow

#### Supply Order Example:
1. **Contractor Creates:** `CRW001-ORD-SUP001`
   - Contractor UI: Order appears in "In Progress" (Pending Approval)
   - Center UI: Order appears in "Pending Approval" section

2. **Center Approves:**
   - Center UI: Approve button → Order moves to "In Progress" 
   - System: Order forwarded to warehouse automatically
   - Warehouse UI: Order appears in "Pending Approval"

3. **Warehouse Accepts:**
   - Warehouse UI: Accept → Order moves to "In Progress"
   - System: Creates delivery record `DEL-001`
   - Contractor/Center UI: Status updates to "Being Processed"

4. **Warehouse Delivers:**
   - Warehouse UI: Complete delivery
   - All UIs: Order moves to "Order History" with "Delivered" status

### Direct Center → Warehouse Flow

#### Supply Order Example:
1. **Center Creates:** `CTR002-ORD-SUP003`
   - Auto-approved (no center approval needed)
   - Immediately forwarded to warehouse
   - Warehouse UI: Appears in "Pending Approval"

2. **Warehouse Processing:** Same as above from step 3

### Service Order Flows

#### Center → Contractor Service:
1. **Center Creates:** `CTR001-ORD-SRV002`
2. **Contractor Accepts:** Creates service instance `SRV002-CTR001`
3. **Service Completion:** Both order and service marked complete

---

## Order-to-Service Transformation

### When Orders Become Services

**Supply Orders:**
- Never become services
- Remain as orders through entire lifecycle
- Generate delivery records for tracking

**Service Orders:**
- Transform when accepted by service provider
- Original order ID preserved for traceability
- New service instance created with provider-specific ID

### Transformation Examples:

#### Service Order Transformation:
```
Original: CTR001-ORD-SRV002 (Center orders HVAC repair)
↓ (Contractor accepts)
Service Instance: SRV002-CTR001 (HVAC repair for Center 001)
Provider View: Active service in their "My Services" tab
Client View: Order completed in "Order History"
```

#### Supply Order Flow (No Transformation):
```
Original: CRW001-ORD-SUP001 (Contractor orders supplies)
↓ (Approved and processed)
Delivery: DEL-001 (References CRW001-ORD-SUP001)
Final Status: Order remains as order, delivery completed
```

---

## Technical Implementation

### Database Schema Considerations

#### Orders Table:
```sql
orders {
  order_id VARCHAR(20) PRIMARY KEY -- CRW001-ORD-SUP001
  order_type ENUM('supply', 'service')
  requester_id VARCHAR(10) -- CRW001, CTR002, etc.
  target_id VARCHAR(10) -- SUP001, SRV002, etc.
  target_type ENUM('supply', 'service')
  approval_status ENUM('pending', 'approved', 'denied')
  fulfillment_status VARCHAR(20) -- varies by order type
  created_at TIMESTAMP
  approved_at TIMESTAMP
  completed_at TIMESTAMP
  -- Additional fields...
}
```

#### Order Status Tracking:
```sql
order_status_history {
  id INT PRIMARY KEY AUTO_INCREMENT
  order_id VARCHAR(20) FOREIGN KEY
  status VARCHAR(20)
  changed_by VARCHAR(10) -- user who made change
  changed_at TIMESTAMP
  notes TEXT
}
```

### API Endpoints Structure:

#### Order Management:
```
GET /api/orders -- Get orders for current user
POST /api/orders -- Create new order
PUT /api/orders/{id}/approve -- Approve order
PUT /api/orders/{id}/deny -- Deny order
PUT /api/orders/{id}/status -- Update order status
DELETE /api/orders/{id} -- Cancel order
```

#### Role-Specific Endpoints:
```
GET /api/contractor/orders -- Contractor's orders
GET /api/center/pending-approvals -- Center's approval queue
GET /api/warehouse/fulfillment-queue -- Warehouse's work queue
GET /api/manager/all-orders -- System-wide order view
```

---

## Business Rules

### Order Creation Rules
1. **Contractors must have center approval** for all orders
2. **Centers can create direct orders** without additional approval
3. **Emergency orders** can bypass normal approval chains (manager override)
4. **Order value limits** may apply based on user role and approval level

### Approval Rules
1. **Single approver required** for contractor→center orders
2. **Automatic approval** for center-created orders
3. **Warehouse acceptance** required for all supply orders
4. **Service provider acceptance** required for service orders

### Cancellation Rules
1. **Creators can cancel** pending orders before approval
2. **Centers can cancel** contractor orders before warehouse processing
3. **Warehouses cannot cancel** orders once processing starts
4. **Managers can cancel** any order with system-wide override

### Priority Rules
1. **Priority affects queue ordering** in all interfaces
2. **Urgent orders** bypass normal processing delays
3. **Emergency orders** can interrupt current workflows
4. **Priority changes** require manager approval after order creation

### Inventory Rules (Supply Orders)
1. **Stock availability** checked at warehouse acceptance
2. **Partial fulfillment** allowed with requester notification
3. **Substitute items** require approval from requester
4. **Back-order processing** for out-of-stock items

### Scheduling Rules (Service Orders)
1. **Provider availability** must be confirmed
2. **Service location** must be accessible and valid
3. **Recurring services** generate multiple order instances
4. **Service conflicts** prevent double-booking

---

## Status Color Coding

### Supply Orders:
- 🔵 **Pending** - Blue
- 🟡 **Approved** - Yellow  
- 🟠 **In Progress** - Orange
- 🟢 **Delivered** - Green
- 🔴 **Denied** - Red
- ⚪ **Cancelled** - Gray

### Service Orders:
- 🔵 **Pending** - Blue
- 🟡 **Scheduled** - Yellow
- 🟠 **In Progress** - Orange  
- 🟢 **Completed** - Green
- 🔴 **Denied** - Red
- ⚪ **Cancelled** - Gray

---

## Error Handling

### Common Error Scenarios:
1. **Insufficient inventory** → Warehouse rejection with alternative suggestions
2. **Service provider unavailable** → Automatic reassignment to available provider
3. **Invalid delivery location** → Order returned to requester for correction
4. **Approval timeout** → Automatic escalation to manager
5. **System errors** → Order placed in error queue for manual review

### User Notifications:
- **Real-time status updates** via websocket connections
- **Email notifications** for status changes requiring action
- **Mobile push notifications** for urgent orders
- **Dashboard alerts** for overdue approvals

---

## Future Considerations

### Planned Enhancements:
1. **AI-powered order suggestions** based on historical patterns
2. **Automated approval chains** for routine orders
3. **Integration with external suppliers** for expanded inventory
4. **Mobile app** for field-based order management
5. **Advanced analytics** for order pattern analysis

### Scalability Considerations:
1. **Database partitioning** by date ranges for historical orders
2. **Caching strategies** for frequently accessed order data  
3. **API rate limiting** for high-volume order processing
4. **Load balancing** for approval workflow endpoints

---

**Document End**

*This document serves as the authoritative reference for CKS order system implementation. All UI components, API endpoints, and business logic should align with the specifications outlined above.*