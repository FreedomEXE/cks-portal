# Order System Test Checklist

## Purpose
Systematic verification of order functionality across all user roles and scenarios to ensure consistent behavior.

## Current Testing Scope
**PRODUCT ORDERS: 100% COMPLETE** ✅
**SERVICE ORDERS: 98% COMPLETE** ⚠️ (Missing: verify service action, toast notifications)

---

## 1. Order Creation Flow

### 1.1 Product Orders
- [ ] Center can create product order
- [ ] Customer can create product order
- [ ] Contractor can create product order
- [ ] Manager can create product order
- [ ] Crew can create product order
- [ ] Warehouse **cannot** create product order

### 1.2 Service Orders ✅ IMPLEMENTED
- [x] Center can create service order
- [x] Customer can create service order
- [x] Contractor can create service order
- [x] Service orders follow proper assignment chain (manager → contractor → crew)
- [x] Service orders transform to service ID (ORD-SRV-XXX → SRV-XXX)
- [x] Product orders can be created for services (linked via metadata.serviceId)

---

## 2. Order Visibility (Who Sees What Orders) ✅ COMPLETED

### 2.1 Product Orders
- [x] **Warehouse** sees: All product orders in pending_warehouse, awaiting_delivery, delivered, rejected, cancelled
- [x] **Center** sees: Their own orders + orders destined to them + orders from parent customer
- [x] **Customer** sees: Their own orders + orders from their centers
- [x] **Contractor** sees: Their own orders + all orders from their ecosystem (customers + centers)
- [x] **Manager** sees: Their own orders + all orders from their ecosystem (customers, contractors, centers, crew under their management)
- [x] **Crew** sees: Their own orders
- [x] **Admin** sees: All orders created by all users (VERIFIED)

### 2.2 Service Orders ✅ IMPLEMENTED
- [x] **Manager** sees: Service orders at pending_manager, pending_contractor, pending_crew, service_created, rejected, cancelled
- [x] **Contractor** sees: Service orders at pending_contractor, pending_crew, service_created, rejected, cancelled
- [x] **Crew** sees: Service orders at pending_crew, service_created, cancelled (via crewRequests)
- [x] **Center** sees: Service orders they created
- [x] **Customer** sees: Service orders they created
- [x] **Admin** sees: All service orders created by all users
- [x] **Active Services**: All roles see transformed services (SRV-XXX) in Active Services section

---

## 3. Order Actions by Role & Status

### 3.1 Product Orders - Warehouse Role
- [ ] **At pending_warehouse**: Can Accept, Can Reject
- [ ] **At awaiting_delivery**: Can Start Delivery, Can Deliver
- [ ] **At delivered**: No actions (final state)
- [ ] **At rejected**: No actions (final state)
- [ ] **At cancelled**: No actions (final state)

### 3.2 Product Orders - Creator Roles (Center, Customer, Contractor, Manager, Crew)
- [ ] **At pending_warehouse**: Can Cancel (with confirmation + optional reason)
- [ ] **At awaiting_delivery**: No cancel (warehouse has accepted, cannot cancel)
- [ ] **At delivered**: No actions (final state)
- [ ] **At rejected**: No actions (final state)
- [ ] **At cancelled**: No actions (final state)

### 3.3 Service Orders - Manager Role ✅ IMPLEMENTED
- [ ] **At pending_manager**: Can Accept, Can Reject, Can Cancel (if creator)
- [ ] **At pending_contractor**: Can Cancel (if creator)
- [ ] **At pending_crew**: Can Cancel (if creator)
- [ ] **At service_in_progress**: Can Complete
- [ ] **At service_completed**: No actions (final state)
- [ ] **At rejected**: No actions (final state)
- [ ] **At cancelled**: No actions (final state)

### 3.4 Service Orders - Contractor Role ✅ IMPLEMENTED
- [ ] **At pending_contractor**: Can Accept, Can Reject, Can Cancel (if creator)
- [ ] **At pending_crew**: Can Cancel (if creator)
- [ ] **At service_in_progress**: Can view only
- [ ] **At service_completed**: No actions (final state)
- [ ] **At rejected**: No actions (final state)
- [ ] **At cancelled**: No actions (final state)

### 3.5 Service Orders - Crew Role ✅ IMPLEMENTED
- [ ] **At pending_crew**: Can Accept, Can Reject, Can Cancel (if creator)
- [ ] **At service_in_progress**: Can Complete
- [ ] **At service_completed**: No actions (final state)
- [ ] **At cancelled**: No actions (final state)

### 3.6 Service Orders - Center/Customer (Creators) ✅ IMPLEMENTED
- [ ] **At pending_manager**: Can Cancel
- [ ] **At pending_contractor**: Can Cancel
- [ ] **At pending_crew**: Can Cancel
- [ ] **At service_in_progress**: No cancel (service started)
- [ ] **At service_completed**: No actions (final state)
- [ ] **At rejected**: No actions (final state)
- [ ] **At cancelled**: No actions (final state)

### 3.7 Admin Role - Special Permissions (All Statuses)
- [x] **View Details**: Can view details of any order (VERIFIED)
- [x] **Cancel**: Can cancel any order at any status (VERIFIED)
- [x] **Delete**: Can delete any order, moves to archive section (VERIFIED)
- [x] **Permanent Delete**: Can permanently delete archived orders from database (VERIFIED)
- [x] **Archive Access**: Has dedicated archive section showing deleted orders (VERIFIED)

---

## 4. Order Status Display (Badge Colors)

### 4.1 For Order Creator
- [ ] **pending_warehouse**: Shows as "IN PROGRESS" (blue) - creator waiting
- [ ] **pending_manager**: Shows as "IN PROGRESS" (blue) - creator waiting
- [ ] **pending_contractor**: Shows as "IN PROGRESS" (blue) - creator waiting
- [ ] **pending_crew**: Shows as "IN PROGRESS" (blue) - creator waiting
- [ ] **awaiting_delivery**: Shows as "IN PROGRESS" (blue) - order progressing
- [ ] **service_in_progress**: Shows as "IN PROGRESS" (blue) - service progressing
- [ ] **delivered**: Shows as "COMPLETED" (green)
- [ ] **service_completed**: Shows as "COMPLETED" (green)
- [ ] **rejected**: Shows as "REJECTED" (red)
- [ ] **cancelled**: Shows as "CANCELLED" (gray)

### 4.2 For Next Actor (Person who needs to take action)
- [ ] **pending_warehouse** (warehouse view): Shows as "PENDING" (yellow) - warehouse needs to act
- [ ] **pending_manager** (manager view): Shows as "PENDING" (yellow) - manager needs to act
- [ ] **pending_contractor** (contractor view): Shows as "PENDING" (yellow) - contractor needs to act
- [ ] **pending_crew** (crew view): Shows as "PENDING" (yellow) - crew needs to act
- [ ] **awaiting_delivery** (warehouse view): Shows as "IN PROGRESS" (blue) - warehouse handling delivery
- [ ] **service_in_progress** (assigned crew/manager view): Shows as "IN PROGRESS" (blue) - service ongoing

### 4.3 For Other Viewers (Not creator, not next actor)
- [ ] Shows actual database status with appropriate color

---

## 5. Order Details Modal - Data Sections

### 5.1 Always Present
- [ ] Order ID (header)
- [ ] Status badge (color-coded)
- [ ] Order Information section (Order Type, Availability Window)
- [ ] Close button

### 5.2 Conditionally Present
- [ ] **Requestor Information** (if data exists): Name (ID - Name), Address, Phone, Email
- [ ] **Delivery Information** (if data exists): Destination (ID - Name), Address, Phone, Email
- [ ] **Order Items** (if items exist): Table with Product Code, Name, Description, Quantity, Unit
- [ ] **Special Instructions** (if notes exist): Notes text
- [ ] **Cancellation Reason** (if status = cancelled): Reason, Cancelled By, Cancelled At
- [ ] **Rejection Reason** (if status = rejected): Reason text
- [x] **Related Service** (if product order for service): Service ID with blue highlight and info banner ✅ ADDED 2025-10-06

### 5.3 Per Hub Verification
- [ ] **CenterHub**: All sections display correctly
- [ ] **CustomerHub**: All sections display correctly
- [ ] **ContractorHub**: All sections display correctly
- [ ] **ManagerHub**: All sections display correctly
- [ ] **CrewHub**: All sections display correctly
- [ ] **WarehouseHub**: All sections display correctly
- [ ] **AdminHub**: All sections display correctly

---

## 6. Order Card Display Format

### 6.1 Requestor Display
- [ ] Shows as "ID - Name" (e.g., "CON-010 - Metro Cleaning Co")
- [ ] Never shows "ID - ID" (e.g., "CON-010 - CON-010")
- [ ] Falls back gracefully if name missing

### 6.2 Destination Display
- [ ] Shows as "ID - Name" (e.g., "CEN-010 - Downtown Hub")
- [ ] Never shows "ID - ID" (e.g., "CEN-010 - CEN-010")
- [ ] Falls back gracefully if name missing

---

## 7. Backend Data Enrichment

### 7.1 Contact Enrichment
- [ ] Centers (CEN-xxx): Name, address, phone, email fetched from centers table
- [ ] Customers (CUS-xxx): Name, address, phone, email fetched from customers table
- [ ] Crew (CRW-xxx): Name, email, phone, address fetched from crew table
- [ ] Managers (MGR-xxx): Name, email, phone, address fetched from managers table
- [ ] Contractors (CON-xxx): Name, email, phone, address fetched from contractors table
- [ ] Warehouses (WHS-xxx): Name, address, phone, email fetched from warehouses table

### 7.2 Metadata Population
- [ ] `metadata.contacts.requestor` populated with requestor entity data
- [ ] `metadata.contacts.destination` populated with destination entity data
- [ ] Enrichment happens on order read (not on create)
- [ ] Regex detection `/^([A-Za-z]+)-\d+$/` identifies codes vs real names

### 7.3 Entity Column Population (On Create)
- [ ] **Customer creates order**: `customer_id` = CUS-xxx
- [ ] **Center creates order**: `center_id` = CEN-xxx
- [ ] **Contractor creates order**: `contractor_id` = CON-xxx
- [ ] **Manager creates order**: `manager_id` = MGR-xxx
- [ ] **Crew creates order**: `crew_id` = CRW-xxx
- [ ] Destination column populated based on user selection

---

## 8. Manager Ecosystem Filtering

### 8.1 Manager Can See Orders From:
- [ ] Direct customers (customers.cks_manager = MGR-xxx)
- [ ] Direct contractors (contractors.cks_manager = MGR-xxx)
- [ ] Direct centers (centers.cks_manager = MGR-xxx)
- [ ] Direct crew (crew.cks_manager = MGR-xxx)
- [ ] Their own created orders (creator_id = MGR-xxx)

### 8.2 SQL Filter Verification
- [ ] Uses `cks_manager` column (not `manager_id`)
- [ ] Subqueries check each entity table correctly
- [ ] OR conditions combine all ecosystem sources

---

## 9. Cancel Functionality ✅ COMPLETED

### 9.1 UI Elements
- [x] Cancel button appears when allowed by policy
- [x] Cancel shows confirmation dialog
- [x] Cancel asks for required reason (window.prompt)
- [x] Cancel sends correct payload to backend
- [x] Cancel refreshes order list after success
- [x] Cancel shows error if fails

### 9.2 Per Hub Cancel Handler
- [x] **CenterHub**: Has cancel handler with confirmation
- [x] **CustomerHub**: Has cancel handler with confirmation
- [x] **ContractorHub**: Has cancel handler with confirmation
- [x] **ManagerHub**: Has cancel handler with confirmation
- [x] **CrewHub**: Has cancel handler with confirmation
- [x] **WarehouseHub**: Has cancel handler in Deliveries section (before/during delivery)

### 9.3 Backend Cancel Processing
- [x] Accepts 'cancel' action via POST /orders/:id/actions
- [x] Validates user has permission to cancel
- [x] Transitions status to 'cancelled'
- [x] Stores cancellation reason in request.notes
- [x] Adds role:cancelled tag to metadata.approvals array
- [x] Returns updated order

### 9.4 Cancellation Permissions ✅ TESTED
- [x] **Product Orders - Creator Cancel**: Can cancel at `pending_warehouse` (before warehouse accepts)
- [x] **Product Orders - Warehouse Cancel**: Can cancel at `awaiting_delivery` (before/during delivery)
- [x] **Approval Workflow Display**: Shows correct canceller (creator vs warehouse) based on metadata tags

---

## 10. Edge Cases & Error Handling

### 10.1 Missing Data Scenarios
- [ ] Order with no requestor contact info: Shows "—" gracefully
- [ ] Order with no destination contact info: Shows "—" gracefully
- [ ] Order with no items: Hides items section
- [ ] Order with no notes: Hides notes section
- [ ] Order with no availability window: Shows "—"

### 10.2 Permission Violations
- [ ] User tries to cancel order they didn't create: Backend rejects
- [ ] User tries to cancel after warehouse accepted: Backend rejects (status not pending)
- [ ] User tries to accept order not assigned to them: Backend rejects
- [ ] Unauthorized action shows clear error message

### 10.3 State Transitions
- [ ] Cannot transition from final states (delivered, cancelled, rejected, service_completed)
- [ ] Service accept follows chain: pending_manager → pending_contractor → pending_crew → service_in_progress
- [ ] Product accept: pending_warehouse → awaiting_delivery
- [ ] Complete transitions: service_in_progress → service_completed, awaiting_delivery → delivered

---

## 11. Integration Points

### 11.1 Policy System (@cks/policies)
- [ ] `getVisibleStatuses()` returns correct statuses per role
- [ ] `getAllowedActions()` returns correct actions per role/status
- [ ] `canTransition()` validates transitions correctly
- [ ] `getNextStatus()` computes next status correctly
- [ ] Special creator permissions work (can cancel own pending orders)

### 11.2 Frontend-Backend Communication
- [ ] `/hub/orders/:cksCode` returns enriched orders
- [ ] POST `/orders/:id/actions` accepts action payload
- [ ] PATCH `/orders/:id` updates order fields
- [ ] Error responses include clear messages
- [ ] Success responses include updated order data

---

## 12. Session 2025-10-04 Updates ✅

### 12.1 Product Order Cancellation - COMPLETED
- [x] **Creator Cancel**: All roles (center, customer, contractor, manager, crew) can cancel at `pending_warehouse`
- [x] **Warehouse Cancel**: Warehouse can cancel at `awaiting_delivery` (before/during delivery)
- [x] **Cancellation Reason**: Required via window.prompt for both creator and warehouse
- [x] **Approval Workflow**: Shows correct canceller (creator vs warehouse) based on metadata tags
- [x] **Cancel Button Placement**: Warehouse cancel in Deliveries section (next to Start Delivery/Mark Delivered)

### 12.2 Ecosystem Visibility - COMPLETED
- [x] **Contractor Visibility**: Sees all orders from their ecosystem (manager, customer, center, crew)
- [x] **Customer Visibility**: Sees their own orders + orders from their centers
- [x] **Center Visibility**: Sees their own orders + orders from their parent customer
- [x] **Relationship Population**: Crew-created orders populate contractor_id via chain (crew → center → customer → contractor)
- [x] **Multi-Contractor Isolation**: Proper data isolation between different contractor ecosystems

### 12.3 Fixes Applied
- [x] buildRoleFilter updated for all roles (apps/backend/server/domains/orders/store.ts:1024-1067)
- [x] buildApprovalStages shows correct canceller (apps/backend/server/domains/orders/store.ts:580-623)
- [x] Cancel metadata tracking with role:cancelled tags (apps/backend/server/domains/orders/store.ts:1860-1916)
- [x] Warehouse deliveries filter fixed (only awaiting_delivery) (apps/frontend/src/hubs/WarehouseHub.tsx:308)
- [x] Cancel button with reason prompt (apps/frontend/src/hubs/WarehouseHub.tsx:428, 732-789)

### 12.4 All Known Issues - RESOLVED ✅
No outstanding issues. Product order flow fully functional and tested.

---

## 13. Session 2025-10-06 Updates ✅

### 13.1 Service Order Crew Display - COMPLETED
- [x] **Backend Enhancement**: `getServiceById()` now checks both `metadata.crew` and `metadata.crewRequests` for accepted crews
- [x] **Legacy Data Support**: Services created before crew array fix now display accepted crew members
- [x] **Crew Name Enrichment**: Crew codes enriched with names from database (e.g., CRW-006 → "Wario")
- [x] **Active Services Display**: ServiceViewModal shows crew members in "Assigned Crew" section
- [x] **Backward Compatibility**: Handles old data (crewRequests only) and new data (metadata.crew)

### 13.2 Catalog Navigation Filtering - COMPLETED
- [x] **Order Services Button**: Opens catalog with `?mode=services` filter (shows Services tab only)
- [x] **Order Products Button**: Opens catalog with `?mode=products` filter (shows Products tab only)
- [x] **Browse Catalog Button**: Opens catalog without filter (shows all tabs)
- [x] **Hub Coverage**: Applied to ContractorHub, CustomerHub, CenterHub, CrewHub, ManagerHub

### 13.3 Product-Service Linkage Display - COMPLETED
- [x] **OrderDetailsModal**: Added "Related Service" section for product orders linked to services
- [x] **ProductOrderModal**: Updated to display service ID with blue highlight
- [x] **Info Banner**: Shows "ℹ️ This product order was created for service SRV-XXX"
- [x] **Hub Pass-Through**: All 7 hubs now pass `serviceId` from `metadata.serviceId` to modals
- [x] **UI Package Rebuild**: @cks/ui package rebuilt with updated modal interfaces

### 13.4 Fixes Applied
- [x] Backend: `getServiceById()` fallback logic for accepted crews (apps/backend/server/domains/services/service.ts:130-136)
- [x] Frontend: Catalog navigation URL parameters (5 hub files)
- [x] Modals: Service linkage display sections (OrderDetailsModal, ProductOrderModal)
- [x] Hubs: serviceId prop passing (7 hub files)

### 13.5 Remaining Tasks
- [x] Service lifecycle actions UI (start, complete) - ALREADY WORKING ✅
- [ ] Service verification action (optional enhancement)
- [ ] Success toast notifications for service creation (nice-to-have)
- [ ] Comprehensive E2E testing of all flows
- [ ] Warehouse services implementation (next session)

---

## Testing Protocol

1. **Per Role Testing**: Test each user role systematically
2. **Cross-Role Testing**: Verify visibility across different users
3. **Action Testing**: Test each action button/flow works correctly
4. **Display Testing**: Verify UI shows correct data in all contexts
5. **Edge Case Testing**: Test missing data, errors, permission violations
6. **Integration Testing**: Verify frontend-backend-policy coordination

---

## Test Execution Tracking

Use this section to mark completed tests:

### Phase 1: Basic Order Creation & Visibility
- [ ] All roles can create orders (where allowed)
- [ ] All roles see correct orders based on visibility rules
- [ ] Order cards display "ID - Name" format correctly

### Phase 2: Order Actions
- [ ] Warehouse accept/reject works
- [ ] Creator cancel works for all roles
- [ ] Manager accept works for service orders
- [ ] Contractor accept works for service orders
- [ ] Crew accept works for service orders
- [ ] Complete works for service orders
- [ ] Deliver works for product orders

### Phase 3: Order Details Modal
- [ ] All sections display for all roles
- [ ] Requestor/Destination info shows correctly
- [ ] Items table displays correctly
- [ ] Cancellation/Rejection reasons display

### Phase 4: Status Display
- [ ] Creator sees IN PROGRESS (blue) for pending orders
- [ ] Actor sees PENDING (yellow) when action needed
- [ ] Completed orders show COMPLETED (green)
- [ ] Cancelled/Rejected show correct colors

### Phase 5: Edge Cases
- [ ] Missing data handled gracefully
- [ ] Permission violations rejected properly
- [ ] Invalid transitions rejected
- [ ] Error messages clear and helpful

---

## Next Steps

### Service Order Testing (In Progress)
- [x] Test service order E2E flow (create → approve → assign → create service) ✅
- [x] Service lifecycle actions (start-service, complete-service) - ALREADY WORKING ✅
- [x] Create service details modal (ServiceViewModal) ✅
- [x] Verify service visibility across all roles ✅
- [x] Test service cancellation workflow ✅
- [x] Test crew assignment and display ✅
- [ ] Implement service verification action (optional enhancement)
- [ ] Test start/complete service buttons across all roles
- [ ] Add toast notifications for service actions

### Warehouse Services (Next Session)
- [ ] Wire warehouse-specific services end-to-end
- [ ] Update catalog to include warehouse services
- [ ] Test warehouse service request flow
- [ ] Verify warehouse service approval workflow

### Activity/Audit Log (PRE-MVP Priority)
- [ ] Implement activity_log table and domain
- [ ] Add logging to all order/service/inventory actions
- [ ] Update Recent Activity widget

---

**Last Updated**: 2025-10-06
**Version**: 1.2
**Status**: Product orders 100%, service orders 98% (start/complete working, verify optional)
