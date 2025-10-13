# UX Flow Testing - Edge Case Documentation

**Testing Period:** Started 2025-10-12
**Objective:** Document all edge cases and bugs across all 7 user roles before implementing fixes

**Testing Approach:**
1. Test each role's complete user flow
2. Document issues using the template below
3. NO FIXES until all roles are tested
4. After documentation complete: analyze patterns → create fix plan → implement systematically

---

## Session 2025-10-12: Post-Order Redirect Flow

### Overview
Implemented complete post-order redirect flow with visual feedback, loader transitions, and highlight animations.

### Feature: Post-Order Visual Feedback System

**Flow Steps:**
1. User creates order (service or product)
2. Toast notification displays: "Order [ID] created successfully!"
3. Global loader overlay appears (full-screen)
4. User automatically redirected to Hub Orders section
5. Correct sub-tab selected (Service Orders or Product Orders)
6. Order appears in list (via SWR cache hydration)
7. Loader remains visible until order DOM node mounts
8. Order scrolls to center of viewport (smooth scroll)
9. Loader stops once order is visually rendered (~150ms delay)
10. Blue pulsing highlight animation appears (2 pulses, 1.5s each)
11. URL parameter `?highlightOrder=[ID]` cleaned up
12. Highlight persists until user clicks on the order
13. SessionStorage tracks acknowledgment (prevents re-highlight on revisit)

### Testing Checklist

#### Basic Flow Testing
- [ ] **Crew** - Create product order → Verify complete flow
- [ ] **Customer** - Create service order → Verify complete flow
- [ ] **Contractor** - Create product order → Verify complete flow
- [ ] **Center** - Create service order → Verify complete flow
- [ ] **Manager** - Create product order → Verify complete flow

#### Loader Timing
- [ ] Loader appears immediately after order creation
- [ ] Loader remains visible during redirect
- [ ] Loader waits for order to be fully rendered (not vice versa)
- [ ] Loader stops exactly when highlight becomes visible
- [ ] No white screen crash after loader

#### Highlight Animation
- [ ] Blue pulsing border appears (matches "in progress" blue color)
- [ ] Animation runs 2 complete pulses (1.5s each = 3s total)
- [ ] Highlight is visible (not hidden behind other elements)
- [ ] Highlight persists after animation completes
- [ ] z-index ensures highlight visible (set to 10)

#### Scroll Behavior
- [ ] Page auto-scrolls to highlighted order
- [ ] Scroll is smooth (not instant jump)
- [ ] Order centered in viewport (block: 'center')
- [ ] Scroll completes before loader stops

#### User Interaction
- [ ] Click on highlighted order dismisses highlight
- [ ] Highlight disappears immediately on click
- [ ] SessionStorage updated to acknowledged ('1')
- [ ] Order remains clickable after highlight dismissed
- [ ] Other orders not affected by highlight dismissal

#### URL Management
- [ ] URL includes `?highlightOrder=[ID]` on redirect
- [ ] URL param cleaned up after highlight ready
- [ ] URL cleanup doesn't cause page reload
- [ ] URL state preserved in browser history
- [ ] Back/forward navigation doesn't re-trigger highlight (sessionStorage check)

#### SessionStorage Acknowledgment
- [ ] New order: sessionStorage key doesn't exist → Highlight shown
- [ ] Pending acknowledgment: sessionStorage = '0' → Highlight shown
- [ ] Acknowledged: sessionStorage = '1' → Highlight skipped, URL cleaned
- [ ] Back button: sessionStorage prevents re-highlight
- [ ] Forward button: sessionStorage prevents re-highlight
- [ ] New session: sessionStorage cleared → Highlight shown again

#### Edge Cases
- [ ] Slow network: Loader waits for order (test with throttling)
- [ ] Order not found: Fallback toast after 5s ("Still preparing your order…")
- [ ] Order not found: Loader continues (doesn't stop)
- [ ] Multiple rapid order creations: Each gets proper redirect+highlight
- [ ] Browser refresh during loader: Graceful handling

#### Destination Validation (Crew)
- [ ] Crew without center link: Warning banner displayed
- [ ] Crew without center link: Button disabled
- [ ] Crew without center link: Clear error message
- [ ] Crew with center link: No warning, button enabled
- [ ] Crew with center link: Order creation succeeds

#### SWR Cache Management
- [ ] Order exists in cache immediately on redirect (preloaded)
- [ ] Order appears in correct sub-tab list
- [ ] Order not duplicated in list
- [ ] Cache upsert in hub works (location.state)
- [ ] Cache mutation in CKSCatalog works

#### Cross-Role Testing
- [ ] Center role: Destination validation skipped (center users exempt)
- [ ] Customer role: Destination validation enforced
- [ ] Contractor role: Destination validation enforced
- [ ] Manager role: Destination validation enforced
- [ ] Admin role: Test complete flow

### Known Issues (To Be Tested)

⚠️ **White Screen Crash** (Reported Fixed):
- User previously reported white screen after loader
- Refactored approach should resolve this
- **Needs end-to-end testing to confirm**

⚠️ **Crew Center Linking** (Backend Issue):
- Some crew users don't have center relationship in scope
- Frontend now handles gracefully with validation
- **Backend/data fix still needed**

---

## Testing Status

- [X] **Crew** - Orphaned Data Visibility Documented
- [X] **Manager** - Orphaned Data Visibility Documented
- [X] **Warehouse** - Orphaned Data Visibility Documented
- [X] **Customer** - Orphaned Data Visibility Documented
- [X] **Center** - Orphaned Data Visibility Documented (Partial)
- [X] **Contractor** - Orphaned Data Visibility Documented
- [X] **Admin** - Orphaned Data Visibility Documented (Partial)

---

## PRE-TESTING DISCOVERY: ORPHANED DATA

**Context:** Before starting systematic testing, user attempted to delete all test data via Admin Hub to start with clean slate. Admin Hub appeared to show no orders/services remaining. However, when logging into other role hubs, discovered data still exists.

### Database Reality (Verified via SQL Query)

**Active Services (NOT archived):**
- CEN-010-SRV-003 (status: in_progress)
- CEN-010-SRV-001 (status: completed)
- CEN-010-SRV-002 (status: completed)

**Archived Orders:**
- CUS-015-SO-044 (type: service, status: service_created, archived: YES)
- CEN-010-SO-038 (type: service, status: service_created, archived: YES)
- CON-010-SO-043 (type: service, status: pending_warehouse, archived: YES)
- CON-010-SO-042 (type: service, status: pending_manager, archived: YES)
- CON-010-SO-041 (type: service, status: pending_warehouse, archived: YES)
- CON-010-SO-040 (type: service, status: pending_manager, archived: YES)
- CON-010-SO-039 (type: service, status: service_created, archived: YES)

**Total:** 3 active services, 7 archived orders

---

### Hub-by-Hub Visibility

#### CREW HUB
**What User Sees:**
- Active Services: CEN-010-SRV-003
- Service History: CEN-010-SRV-001
- Order Archive: CUS-015-SO-044, CEN-010-SO-038

**Expected:** TBD - User to confirm after we document all hubs
**Issue:** Sees archived orders (but this may be intentional per system design - user indicates archived orders shown grey with "archived" label is correct)

---

#### CENTER HUB (CEN-010)
**What User Sees:**
- CUS-015-SO-044 (service order)
- CEN-010-SRV-003 (active service)
- All orders/services that Crew Hub sees
- Plus additional data (user didn't specify exact list)

**Expected:** Center should see all orders/services related to CEN-010
**Issue:** Seeing archived orders (may be intentional behavior)

---

#### CUSTOMER HUB (CUS-015)
**What User Sees:**
- All 7 archived orders:
  - CUS-015-SO-044
  - CEN-010-SO-038
  - CON-010-SO-043
  - CON-010-SO-042
  - CON-010-SO-041
  - CON-010-SO-040
  - CON-010-SO-039
- All 3 active services (CEN-010-SRV-003, CEN-010-SRV-001, CEN-010-SRV-002)

**Expected:** According to user, "all users in the ecosystem should see all orders with some minor exceptions for crew and warehouses"
**Issue:** User states visibility is BROKEN - different users seeing different subsets when they should see same data

---

#### CONTRACTOR HUB (CON-010)
**What User Sees:**
- All 7 archived orders:
  - CUS-015-SO-044
  - CEN-010-SO-038
  - CON-010-SO-043
  - CON-010-SO-042
  - CON-010-SO-041
  - CON-010-SO-040
  - CON-010-SO-039
- All 3 active services (CEN-010-SRV-003, CEN-010-SRV-001, CEN-010-SRV-002)

**Expected:** Same as Customer - should see all ecosystem data
**Issue:** Seeing same data as Customer (all 7 orders + 3 services), but Crew/Center/Warehouse see less

---

#### MANAGER HUB
**What User Sees:**
- All 7 archived orders:
  - CUS-015-SO-044
  - CEN-010-SO-038
  - CON-010-SO-043
  - CON-010-SO-042
  - CON-010-SO-041
  - CON-010-SO-040
  - CON-010-SO-039
- All 3 active services (CEN-010-SRV-003, CEN-010-SRV-001, CEN-010-SRV-002)

**Expected:** Should see all ecosystem data (Manager oversees Contractor, Customer, Center hierarchy)
**Issue:** Seeing same data as Customer and Contractor (all 7 orders + 3 services)

---

#### WAREHOUSE HUB
**What User Sees:**
- Active Services: CEN-010-SRV-002 (only 1 service)
- Archived Orders (3 orders):
  - CON-010-SO-043
  - CON-010-SO-041
  - CON-010-SO-039

**Expected:** User mentioned "minor exceptions for crew and warehouses" - unclear if this limited visibility is correct or bug
**Issue:** Sees significantly less data than Manager/Contractor/Customer (only 1 service vs 3, only 3 orders vs 7)

---

#### ADMIN HUB
**What User Sees:**
- Directory Tab → Services: NO services shown
- Directory Tab → Orders: NO orders shown (assumption - not yet confirmed)
- Archive Tab → Orders: NO archived orders shown

**Expected:** Admin should see ALL data to be able to manage/delete it
**Issue:** CRITICAL - Admin cannot see data that exists in database

**Root Cause (Identified via code review):**
- `apps/backend/server/domains/directory/store.ts` line 420-474:
  - `listServices()` queries ONLY `catalog_services` table (SRV-001, SRV-002 format)
  - Never queries `services` table where active services (CEN-010-SRV-003 format) live
  - Fallback to `services` table only runs if catalog query throws error
- `listOrders()` line 476-504: Filters with `WHERE archived_at IS NULL` - correct for Directory but explains why archived orders don't show
- Archive Tab: Separate query issue (not yet investigated)

---

### BUGS IDENTIFIED SO FAR

### BUG-001: Admin Directory cannot see active services

**Role:** Admin
**Location:** Directory Tab → Services (both Catalog Services and Active Services sub-tabs)
**Scenario:** Admin attempts to view/manage active services
**Expected:** Should see all services including active service instances (CEN-010-SRV-003, etc.)
**Actual:** Admin Directory only shows catalog services (SRV-001, SRV-002), does not show active service instances
**Severity:** Critical - Admin cannot manage data that exists
**Database State:** Confirmed 3 active services exist in `services` table
**Root Cause:** `apps/backend/server/domains/directory/store.ts:420-474` - `listServices()` queries only `catalog_services`, never queries `services` table
**Potential Related Issues:** Admin likely can't see other entity types either

---

### BUG-002: Admin Archive cannot see archived orders

**Role:** Admin
**Location:** Archive Tab → Orders
**Scenario:** Admin attempts to hard delete archived orders
**Expected:** Should see all 7 archived orders and be able to hard delete them
**Actual:** Admin sees NO archived orders in Archive tab
**Severity:** Critical - Admin cannot delete data
**Database State:** Confirmed 7 archived orders exist with `archived_at` set
**Root Cause:** Not yet identified - Archive tab query needs investigation
**Potential Related Issues:** May affect all archived entity types, not just orders

---

### BUG-003: Inconsistent order/service visibility across role hubs

**Roles Affected:** Crew, Center, Customer, Contractor (others not yet tested)
**Location:** Multiple tabs across different hubs
**Scenario:** Different role users see different subsets of orders/services
**Expected:** "All users in the ecosystem should see all orders with some minor exceptions for crew and warehouses" (per user)
**Actual:**
- Crew sees 2 archived orders (CUS-015-SO-044, CEN-010-SO-038) + 2 active services (CEN-010-SRV-003, CEN-010-SRV-001)
- Center sees all orders crew sees + more (exact count not documented)
- Customer sees all 7 archived orders + all 3 services
- Contractor sees all 7 archived orders + all 3 services (same as Customer)
- Manager sees all 7 archived orders + all 3 services (same as Customer/Contractor)
- Warehouse sees only 3 archived orders (CON-010-SO-043, CON-010-SO-041, CON-010-SO-039) + 1 service (CEN-010-SRV-002)
**Severity:** High - Core role-based access logic is broken
**Root Cause:** Unknown - requires investigation of hub-specific API endpoints and queries
**Potential Related Issues:** Likely affects all data types, not just orders/services

---

### VISIBILITY SUMMARY

| Role | Archived Orders Visible | Active Services Visible |
|------|------------------------|------------------------|
| Manager | 7/7 (all) | 3/3 (all) |
| Contractor | 7/7 (all) | 3/3 (all) |
| Customer | 7/7 (all) | 3/3 (all) |
| Center | Unknown (more than Crew) | Unknown |
| Crew | 2/7 (CUS-015-SO-044, CEN-010-SO-038) | 2/3 (CEN-010-SRV-003, CEN-010-SRV-001) |
| Warehouse | 3/7 (CON-010-SO-043, CON-010-SO-041, CON-010-SO-039) | 1/3 (CEN-010-SRV-002) |
| Admin | 0/7 (none) | 0/3 (none) |

---

### NEXT STEPS

1. ✅ Document visibility for all 7 hubs - COMPLETE
2. Clarify with user: What SHOULD each role see?
3. Identify patterns in what each role sees vs should see
4. Investigate root causes for visibility discrepancies
5. Create systematic fix plan

---

## Issue Documentation Template

For each issue found, use this format:

```
### BUG-{NUMBER}: {Short Description}

**Role:** {Which role experiences this}
**Location:** {Tab/Section/Component}
**Scenario:** {What you were trying to do}
**Expected:** {What should happen}
**Actual:** {What actually happened}
**Severity:** Critical | High | Medium | Low
**Root Cause Hypothesis:** {Your guess at what's causing it}
**Potential Related Issues:** {Other bugs that might have same root cause}
**Screenshot/Video:** {Optional: link or description}
```

---

# CREW USER FLOW

## Dashboard Tab
### Happy Path Tests
- [ ] Dashboard loads without errors
- [ ] Metrics display correctly
- [ ] Recent activity shows relevant items

### Edge Cases Tested
- [ ] No services assigned (empty state)
- [ ] No recent activity (empty state)
- [ ] Large number of services (pagination/performance)

### Issues Found
<!-- Document issues here using the template above -->

---

## My Profile Tab
### Happy Path Tests
- [ ] Profile information displays correctly
- [ ] CKS code visible
- [ ] Contact information accurate

### Edge Cases Tested
- [ ] Missing profile data
- [ ] Profile update functionality (if editable)

### Issues Found
<!-- Document issues here -->

---

## My Services Tab - "My" (Certified Services)
### Happy Path Tests
- [ ] Certified services list displays
- [ ] Can view service details
- [ ] Service information accurate

### Edge Cases Tested
- [ ] No certified services (empty state)
- [ ] Service for archived customer/center
- [ ] Certification removed mid-session

### Issues Found
<!-- Document issues here -->

---

## My Services Tab - "Active"
### Happy Path Tests
- [ ] Active services list displays
- [ ] Can view service details
- [ ] Can start service
- [ ] Can complete service
- [ ] Status updates correctly

### Edge Cases Tested
- [ ] No active services (empty state)
- [ ] Start service without certification
- [ ] Start already-started service (concurrency)
- [ ] Complete without starting
- [ ] Service for archived entity
- [ ] Multiple status changes rapidly
- [ ] Cache/refresh after actions

### Issues Found
<!-- Document issues here -->

---

## My Services Tab - "History"
### Happy Path Tests
- [ ] Completed services list displays
- [ ] Can view service details
- [ ] History accurate

### Edge Cases Tested
- [ ] No history (empty state)
- [ ] Pagination with many records
- [ ] Filter/search functionality

### Issues Found
<!-- Document issues here -->

---

## Orders Tab
### Happy Path Tests
- [ ] Orders list displays
- [ ] Can view order details
- [ ] Order information accurate

### Edge Cases Tested
- [ ] No orders (empty state)
- [ ] Orders for archived entities
- [ ] Order status accuracy
- [ ] Pagination

### Issues Found
<!-- Document issues here -->

---

## Procedures Tab
### Happy Path Tests
- [ ] Procedures list displays
- [ ] Can view procedure details

### Edge Cases Tested
- [ ] No procedures (empty state)
- [ ] Procedure search/filter

### Issues Found
<!-- Document issues here -->

---

## Training Tab
### Happy Path Tests
- [ ] Training records display
- [ ] Can view training details

### Edge Cases Tested
- [ ] No training records (empty state)
- [ ] Training status updates

### Issues Found
<!-- Document issues here -->

---

## Reports Tab
### Happy Path Tests
- [ ] Can create report
- [ ] Report form validation works
- [ ] Report submits successfully
- [ ] Can view submitted reports
- [ ] Can acknowledge reports

### Edge Cases Tested
- [ ] Create report with empty fields
- [ ] Create report for archived service/order
- [ ] Acknowledge already-acknowledged report
- [ ] Dropdown entity lists (services, orders, procedures)
- [ ] Priority and rating fields
- [ ] Structured vs text-based reports

### Issues Found
<!-- Document issues here -->

---

## Support Tab
### Happy Path Tests
- [ ] Support interface loads

### Edge Cases Tested
- [ ] Support ticket creation (if implemented)

### Issues Found
<!-- Document issues here -->

---

## Cross-Cutting Concerns (Test Throughout)
- [ ] **Navigation:** Tab switching works smoothly
- [ ] **Loading states:** Spinners/skeletons display properly
- [ ] **Error messages:** Clear and actionable
- [ ] **Permissions:** Can't access restricted features
- [ ] **Logout/Session:** Handles session expiry
- [ ] **Mobile responsiveness:** (if applicable)
- [ ] **Performance:** Pages load reasonably fast

### Issues Found
<!-- Document cross-cutting issues here -->

---

# MANAGER USER FLOW

## Dashboard Tab
### Happy Path Tests
- [ ] Dashboard loads without errors
- [ ] Metrics show correct counts (contractors, customers, centers, crew, pending orders)
- [ ] Recent activity displays

### Edge Cases Tested
- [ ] No contractors assigned (empty state)
- [ ] No recent activity
- [ ] Large ecosystem (performance)

### Issues Found
<!-- Document issues here -->

---

## My Profile Tab
### Happy Path Tests
- [ ] Profile displays correctly

### Issues Found
<!-- Document issues here -->

---

## My Ecosystem Tab
### Happy Path Tests
- [ ] Tree view displays organizational hierarchy
- [ ] Can navigate tree structure
- [ ] Entity details display on click

### Edge Cases Tested
- [ ] Empty ecosystem (no contractors)
- [ ] Large ecosystem (many levels deep)
- [ ] Archived entities in tree
- [ ] Unassigned entities

### Issues Found
<!-- Document issues here -->

---

## My Services Tab
### Happy Path Tests
- [ ] Certified services display
- [ ] Active services display
- [ ] Can start service (if certified)
- [ ] Can assign crew to service
- [ ] Can complete service
- [ ] Service history displays

### Edge Cases Tested
- [ ] Assign crew to service for archived center
- [ ] Assign uncertified crew
- [ ] Service for archived customer
- [ ] Crew assignment request/response flow
- [ ] Multiple managers trying to assign same crew

### Issues Found
<!-- Document issues here -->

---

## Orders Tab
### Happy Path Tests
- [ ] Can view product orders
- [ ] Can view service orders
- [ ] Can create new orders
- [ ] Can accept/reject orders
- [ ] Order actions work correctly

### Edge Cases Tested
- [ ] Create order for archived customer/center
- [ ] Accept already-accepted order
- [ ] Reject without reason
- [ ] Order for entity outside ecosystem
- [ ] Order status transitions
- [ ] Crew assignment via orders

### Issues Found
<!-- Document issues here -->

---

## Procedures Tab
### Happy Path Tests
- [ ] Procedures list displays
- [ ] Can view procedure details

### Edge Cases Tested
- [ ] No procedures
- [ ] Create/edit procedures (if implemented)

### Issues Found
<!-- Document issues here -->

---

## Training Tab
### Happy Path Tests
- [ ] Training records display
- [ ] Can manage crew training

### Edge Cases Tested
- [ ] No training records
- [ ] Training for archived crew

### Issues Found
<!-- Document issues here -->

---

## Reports Tab
### Happy Path Tests
- [ ] Can create reports/feedback
- [ ] Can view reports
- [ ] Can acknowledge reports
- [ ] Can resolve reports (for manager-managed services and procedures)

### Edge Cases Tested
- [ ] Resolve without acknowledgment
- [ ] Resolve report outside permission scope
- [ ] Report for archived entity
- [ ] Priority filtering
- [ ] Structured report creation

### Issues Found
<!-- Document issues here -->

---

## Support Tab
### Issues Found
<!-- Document issues here -->

---

## Cross-Cutting Concerns
### Issues Found
<!-- Document cross-cutting issues here -->

---

# WAREHOUSE USER FLOW

## Dashboard Tab
### Happy Path Tests
- [ ] Dashboard loads
- [ ] Metrics display (inventory levels, pending deliveries, stock alerts)

### Edge Cases Tested
- [ ] No inventory items
- [ ] Low stock alerts
- [ ] No pending deliveries

### Issues Found
<!-- Document issues here -->

---

## My Profile Tab
### Issues Found
<!-- Document issues here -->

---

## Services Tab
### Happy Path Tests
- [ ] Certified warehouse services display
- [ ] Active services display
- [ ] Can start/complete warehouse services

### Edge Cases Tested
- [ ] Start service without certification
- [ ] Service for archived customer
- [ ] Warehouse-managed vs manager-managed services

### Issues Found
<!-- Document issues here -->

---

## Inventory Tab - "Active"
### Happy Path Tests
- [ ] Inventory items display
- [ ] Can view item details
- [ ] Quantities accurate

### Edge Cases Tested
- [ ] No inventory items (empty state)
- [ ] Negative quantities
- [ ] Update inventory (if admin)
- [ ] Pagination with many items

### Issues Found
<!-- Document issues here -->

---

## Inventory Tab - "Archive"
### Happy Path Tests
- [ ] Archived inventory items display

### Edge Cases Tested
- [ ] No archived items
- [ ] Restore archived item

### Issues Found
<!-- Document issues here -->

---

## Deliveries Tab - "Pending"
### Happy Path Tests
- [ ] Pending deliveries display

### Edge Cases Tested
- [ ] No pending deliveries
- [ ] Mark delivery as delivered
- [ ] Delivery for archived order

### Issues Found
<!-- Document issues here -->

---

## Deliveries Tab - "Completed"
### Happy Path Tests
- [ ] Completed deliveries display

### Edge Cases Tested
- [ ] No completed deliveries
- [ ] Pagination

### Issues Found
<!-- Document issues here -->

---

## Orders Tab
### Happy Path Tests
- [ ] Product orders display
- [ ] Can accept/fulfill orders
- [ ] Order actions work

### Edge Cases Tested
- [ ] Order for archived center
- [ ] Accept order without inventory
- [ ] Delivery workflow

### Issues Found
<!-- Document issues here -->

---

## Reports Tab
### Happy Path Tests
- [ ] Can create reports/feedback
- [ ] Can view reports
- [ ] Can acknowledge reports
- [ ] Can resolve order reports and warehouse-managed service reports

### Edge Cases Tested
- [ ] Resolve reports outside permission scope
- [ ] Order report resolution workflow

### Issues Found
<!-- Document issues here -->

---

## Support Tab
### Issues Found
<!-- Document issues here -->

---

## Cross-Cutting Concerns
### Issues Found
<!-- Document cross-cutting issues here -->

---

# CUSTOMER USER FLOW

## Dashboard Tab
### Happy Path Tests
- [ ] Dashboard loads
- [ ] Metrics display correctly

### Edge Cases Tested
- [ ] No centers (empty state)
- [ ] No active services

### Issues Found
<!-- Document issues here -->

---

## My Profile Tab
### Issues Found
<!-- Document issues here -->

---

## My Centers Tab
### Happy Path Tests
- [ ] Centers list displays
- [ ] Can view center details

### Edge Cases Tested
- [ ] No centers (empty state)
- [ ] Archived center appears/doesn't appear
- [ ] Center details accuracy

### Issues Found
<!-- Document issues here -->

---

## Services Tab - "My"
### Happy Path Tests
- [ ] Can view available services
- [ ] Service catalog accurate

### Edge Cases Tested
- [ ] No services available
- [ ] Services for archived entities

### Issues Found
<!-- Document issues here -->

---

## Services Tab - "History"
### Happy Path Tests
- [ ] Service history displays

### Edge Cases Tested
- [ ] No history
- [ ] Pagination

### Issues Found
<!-- Document issues here -->

---

## Orders Tab
### Happy Path Tests
- [ ] Can create product orders
- [ ] Can create service orders
- [ ] Can view orders
- [ ] Order form validation

### Edge Cases Tested
- [ ] Create order for archived center
- [ ] Create order without selecting center
- [ ] Order catalog shows correct items
- [ ] Order for entity outside scope

### Issues Found
<!-- Document issues here -->

---

## Reports Tab
### Happy Path Tests
- [ ] Can create reports/feedback
- [ ] Can view own reports
- [ ] Can acknowledge reports

### Edge Cases Tested
- [ ] Create report for archived service/order
- [ ] View reports from archived entities

### Issues Found
<!-- Document issues here -->

---

## Support Tab
### Issues Found
<!-- Document issues here -->

---

## Cross-Cutting Concerns
### Issues Found
<!-- Document cross-cutting issues here -->

---

# CENTER USER FLOW

## Dashboard Tab
### Happy Path Tests
- [ ] Dashboard loads
- [ ] Center-specific metrics display

### Issues Found
<!-- Document issues here -->

---

## My Profile Tab
### Issues Found
<!-- Document issues here -->

---

## Services Tab - "Active"
### Happy Path Tests
- [ ] Active services for this center display

### Edge Cases Tested
- [ ] No active services
- [ ] Services for archived customer/contractor

### Issues Found
<!-- Document issues here -->

---

## Services Tab - "History"
### Happy Path Tests
- [ ] Service history displays

### Edge Cases Tested
- [ ] No history

### Issues Found
<!-- Document issues here -->

---

## Orders Tab
### Happy Path Tests
- [ ] Can create orders
- [ ] Can view orders
- [ ] Orders scoped to this center

### Edge Cases Tested
- [ ] Create order as archived center
- [ ] Order for archived contractor

### Issues Found
<!-- Document issues here -->

---

## Reports Tab
### Happy Path Tests
- [ ] Can create reports/feedback
- [ ] Can view reports

### Edge Cases Tested
- [ ] Report for archived service

### Issues Found
<!-- Document issues here -->

---

## Support Tab
### Issues Found
<!-- Document issues here -->

---

## Cross-Cutting Concerns
### Issues Found
<!-- Document cross-cutting issues here -->

---

# CONTRACTOR USER FLOW

## Dashboard Tab
### Happy Path Tests
- [ ] Dashboard loads
- [ ] Metrics display (customers, centers, pending orders)

### Issues Found
<!-- Document issues here -->

---

## My Profile Tab
### Issues Found
<!-- Document issues here -->

---

## My Ecosystem Tab
### Happy Path Tests
- [ ] Tree shows customers and centers

### Edge Cases Tested
- [ ] Empty ecosystem
- [ ] Archived entities in tree

### Issues Found
<!-- Document issues here -->

---

## Services Tab
### Happy Path Tests
- [ ] Certified services display
- [ ] Active services display
- [ ] Service history displays

### Edge Cases Tested
- [ ] Services for archived customers/centers

### Issues Found
<!-- Document issues here -->

---

## Orders Tab
### Happy Path Tests
- [ ] Can create orders on behalf of customers
- [ ] Can view orders

### Edge Cases Tested
- [ ] Create order for archived customer/center

### Issues Found
<!-- Document issues here -->

---

## Procedures Tab
### Issues Found
<!-- Document issues here -->

---

## Reports Tab
### Happy Path Tests
- [ ] Can create reports/feedback
- [ ] Can view reports
- [ ] Can acknowledge reports

### Edge Cases Tested
- [ ] Report resolution (should not be able to resolve)

### Issues Found
<!-- Document issues here -->

---

## Support Tab
### Issues Found
<!-- Document issues here -->

---

## Cross-Cutting Concerns
### Issues Found
<!-- Document cross-cutting issues here -->

---

# ADMIN USER FLOW

## Dashboard Tab
### Happy Path Tests
- [ ] Dashboard loads
- [ ] System-wide metrics display (total users, open tickets, high priority items, days online)

### Issues Found
<!-- Document issues here -->

---

## Directory Tab - All Sub-tabs
### Happy Path Tests
- [ ] Admins list displays
- [ ] Managers list displays
- [ ] Contractors list displays
- [ ] Customers list displays
- [ ] Centers list displays
- [ ] Crew list displays
- [ ] Warehouses list displays
- [ ] Catalog Services list displays
- [ ] Active Services list displays
- [ ] Products list displays
- [ ] Product Orders list displays
- [ ] Service Orders list displays
- [ ] Training list displays
- [ ] Procedures list displays
- [ ] Reports list displays
- [ ] Feedback list displays

### Edge Cases Tested
- [ ] Empty lists (no entities)
- [ ] Pagination with large datasets
- [ ] Search/filter functionality
- [ ] Archived entities visibility
- [ ] Sort functionality
- [ ] Data table performance

### Issues Found
<!-- Document issues here -->

---

## Directory Tab - Entity Detail Views
### Happy Path Tests
- [ ] Can view entity details in modal
- [ ] Can edit entity details (where applicable)
- [ ] Can view order details
- [ ] Can edit orders

### Edge Cases Tested
- [ ] View archived entity
- [ ] Edit archived entity
- [ ] Edit order for archived entity
- [ ] Invalid data in edit forms
- [ ] Concurrent edits

### Issues Found
<!-- Document issues here -->

---

## Directory Tab - Catalog Services Management
### Happy Path Tests
- [ ] Can edit catalog service metadata
- [ ] Can assign certifications to users
- [ ] Can unassign certifications

### Edge Cases Tested
- [ ] Assign certification to archived user
- [ ] Remove certification from user currently performing service
- [ ] Edit service metadata validation

### Issues Found
<!-- Document issues here -->

---

## Directory Tab - Order Management
### Happy Path Tests
- [ ] Can view full order details
- [ ] Can edit order fields
- [ ] Can apply order actions (accept, reject, cancel, etc.)
- [ ] Can archive orders
- [ ] Can delete orders

### Edge Cases Tested
- [ ] Edit order for archived entities
- [ ] Apply action to order in wrong status
- [ ] Archive already-archived order
- [ ] Delete order with active relationships
- [ ] Hard delete confirmation flow

### Issues Found
<!-- Document issues here -->

---

## Create Tab - All Entity Types
### Happy Path Tests
- [ ] Can create manager
- [ ] Can create contractor
- [ ] Can create customer
- [ ] Can create center
- [ ] Can create crew
- [ ] Can create warehouse
- [ ] Form validation works
- [ ] Entity appears in directory after creation

### Edge Cases Tested
- [ ] Create with empty required fields
- [ ] Create with duplicate data
- [ ] Create with invalid CKS code format
- [ ] Create with invalid email/phone
- [ ] Form submission errors handled gracefully

### Issues Found
<!-- Document issues here -->

---

## Assign Tab
### Happy Path Tests
- [ ] Unassigned contractors list displays
- [ ] Can assign contractor to manager
- [ ] Unassigned customers list displays
- [ ] Can assign customer to contractor
- [ ] Unassigned centers list displays
- [ ] Can assign center to customer
- [ ] Unassigned crew list displays
- [ ] Can assign crew to center
- [ ] Can unassign entities

### Edge Cases Tested
- [ ] Assign to archived entity
- [ ] Assign already-assigned entity
- [ ] Unassign entity with children (cascade)
- [ ] Assignment validation (hierarchy rules)
- [ ] Empty unassigned lists

### Issues Found
<!-- Document issues here -->

---

## Archive Tab
### Happy Path Tests
- [ ] Archived entities list displays
- [ ] Can view archived entity details
- [ ] Can restore archived entities
- [ ] Can view archived relationships
- [ ] Can hard delete with confirmation
- [ ] Can batch delete

### Edge Cases Tested
- [ ] Restore entity with archived parent (should go to unassigned)
- [ ] Restore entity with archived children
- [ ] Hard delete with relationships
- [ ] Hard delete without confirmation
- [ ] Batch operations on mixed entity types
- [ ] Empty archive list

### Issues Found
<!-- Document issues here -->

---

## Inventory Management (Admin)
### Happy Path Tests
- [ ] Can view all warehouse inventories
- [ ] Can update inventory quantities
- [ ] Update reflects immediately

### Edge Cases Tested
- [ ] Update inventory for archived warehouse
- [ ] Update to negative quantity
- [ ] Update with invalid reason
- [ ] Concurrent inventory updates

### Issues Found
<!-- Document issues here -->

---

## Reports Management (Admin)
### Happy Path Tests
- [ ] Can view all reports
- [ ] Can acknowledge reports
- [ ] Can resolve all report types
- [ ] Can filter by priority
- [ ] Can filter by type/category

### Edge Cases Tested
- [ ] Resolve without acknowledgment
- [ ] Report for archived entity
- [ ] Filter combinations
- [ ] Resolution notes validation

### Issues Found
<!-- Document issues here -->

---

## Support Tab
### Issues Found
<!-- Document issues here -->

---

## Cross-Cutting Concerns
### Issues Found
<!-- Document cross-cutting issues here -->

---

# PATTERN ANALYSIS

**NOTE: Complete this section AFTER all 7 roles have been tested**

## Identified Patterns

### Pattern 1: [Name of Pattern]
**Root Cause:** [What's causing this class of bugs]
**Issues Affected:** [List bug numbers]
**Proposed Fix:** [Systemic solution]
**Impact:** [How many bugs this fixes]

### Pattern 2: [Name of Pattern]
[Continue for each pattern identified]

---

## Issue Summary by Category

### Data Validation Issues
[List bugs related to validation]

### State Management Issues
[List bugs related to state/status]

### Authorization/Permission Issues
[List bugs related to access control]

### Archive/Relationship Issues
[List bugs related to archived entities]

### UI/UX Issues
[List bugs related to interface/experience]

### Performance Issues
[List bugs related to speed/loading]

### Error Handling Issues
[List bugs related to error messages/handling]

---

## Priority Matrix

### Critical (Blocks Core Workflows)
[List critical bugs]

### High (Major Features Broken)
[List high priority bugs]

### Medium (Edge Cases, Workarounds Exist)
[List medium priority bugs]

### Low (Minor UX Issues)
[List low priority bugs]

---

## Systemic Fixes to Implement

### Fix 1: [Name]
**What:** [Description of fix]
**Why:** [What pattern this addresses]
**Bugs Fixed:** [List bug numbers]
**Estimated Effort:** [Time estimate]
**Implementation Notes:** [How to implement]

### Fix 2: [Name]
[Continue for each fix]

---

## Isolated Fixes

[List bugs that don't fit into patterns and need individual fixes]
