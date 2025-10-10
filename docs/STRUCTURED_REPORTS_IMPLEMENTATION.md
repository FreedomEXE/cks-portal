# Structured Reports/Feedback Implementation Plan

## Overview
Replace free-form text report/feedback creation with a structured dropdown system. Users select from predefined options instead of typing text.

**UPDATE (Oct 9, 2025)**: Simplified from 4 categories to 3. Product category has been removed. System now only supports Service, Order, and Procedure.

## Database Changes - COMPLETED ✓
Already added these columns to the `reports` table:
```sql
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS report_category VARCHAR(50),  -- 'service', 'order', 'procedure' (UPDATED: removed 'product')
ADD COLUMN IF NOT EXISTS related_entity_id VARCHAR(64), -- ID of the service/order/procedure
ADD COLUMN IF NOT EXISTS report_reason VARCHAR(100);   -- Predefined reason from dropdown
```

## User Flow

### For Reports:
1. **Dropdown 1: "Report For"** → Options: Service, Order, Procedure (UPDATED: removed Product)
2. **Dropdown 2: "Select [Category]"** → Dynamically populated from database
   - If "Service" selected → Fetch and show all services from `services` table
   - If "Order" selected → Fetch and show all orders from `orders` table
   - If "Procedure" selected → Currently returns empty (will be wired to services later)
3. **Dropdown 3: "Reason"** → Smart reasons based on Dropdown 1 selection
   - Service reasons: Quality Issue, Incomplete Work, Crew Behavior, Timing Problem, Safety Concern, Other
   - Order reasons: Billing Issue, Incorrect Details, Delayed Processing, Missing Information, Other
   - Procedure reasons: Unclear Instructions, Process Inefficiency, Safety Concern, Documentation Issue, Other

### For Feedback:
Same structure as reports but with different reason lists focused on positive feedback.

## Display Format
When viewing a report, show formatted text like:
```
Report: Service [SRV-001] - Quality Issue
Related Service: Lawn Mowing Service
```

## Files to Modify

### 1. Backend - New API Endpoints
**File**: `apps/backend/server/domains/reports/routes.fastify.ts`

Add new endpoints:
```typescript
// GET /api/reports/entities/services - Fetch all services for dropdown
// GET /api/reports/entities/products - Fetch all products for dropdown
// GET /api/reports/entities/orders - Fetch all orders for dropdown
```

**File**: `apps/backend/server/domains/reports/repository.ts`

Add functions to fetch entities:
```typescript
export async function getServicesForReports(managerCode: string)
export async function getProductsForReports(managerCode: string)
export async function getOrdersForReports(managerCode: string)
```

### 2. Backend - Update Report Creation
**File**: `apps/backend/server/domains/reports/routes.fastify.ts`

Modify POST `/reports` endpoint to accept:
```typescript
{
  type: 'report' | 'feedback',
  report_category: 'service' | 'product' | 'order' | 'procedure',
  related_entity_id: string,
  report_reason: string,
  // title and description will be auto-generated from the selections
}
```

**File**: `apps/backend/server/domains/reports/repository.ts`

Update `createReport()` to save the new fields and auto-generate title/description.

### 3. Frontend - API Functions
**File**: `apps/frontend/src/shared/api/hub.ts`

Add new functions:
```typescript
export async function fetchServicesForReports(): Promise<Service[]>
export async function fetchProductsForReports(): Promise<Product[]>
export async function fetchOrdersForReports(): Promise<Order[]>
```

### 4. Frontend - Constants File
**File**: `packages/domain-widgets/src/reports/reportReasons.ts` (NEW FILE)

Create constant lists:
```typescript
export const SERVICE_REASONS = [
  'Quality Issue',
  'Incomplete Work',
  'Crew Behavior',
  'Timing Problem',
  'Safety Concern',
  'Other'
];

export const PRODUCT_REASONS = [
  'Damaged',
  'Wrong Item',
  'Missing Items',
  'Quality Issue',
  'Defective',
  'Other'
];

export const ORDER_REASONS = [
  'Billing Issue',
  'Incorrect Details',
  'Delayed Processing',
  'Missing Information',
  'Other'
];

export const PROCEDURE_REASONS = [
  'Unclear Instructions',
  'Process Inefficiency',
  'Safety Concern',
  'Documentation Issue',
  'Other'
];

export const FEEDBACK_SERVICE_REASONS = [
  'Excellent Quality',
  'Professional Crew',
  'Timely Completion',
  'Great Communication',
  'Other'
];

// ... similar for FEEDBACK_PRODUCT_REASONS, etc.
```

### 5. Frontend - ReportsSection Component
**File**: `packages/domain-widgets/src/reports/ReportsSection.tsx`

Major changes:
1. Replace `reportForm` state to include new fields:
```typescript
const [reportForm, setReportForm] = useState({
  type: defaultType as 'report' | 'feedback',
  reportCategory: '',        // NEW: 'service', 'product', 'order', 'procedure'
  relatedEntityId: '',       // NEW: ID of selected entity
  reportReason: '',          // NEW: Selected reason
  // Remove: title, description (will be auto-generated)
});
```

2. Add state for fetched entities:
```typescript
const [services, setServices] = useState([]);
const [products, setProducts] = useState([]);
const [orders, setOrders] = useState([]);
```

3. Add useEffect to fetch entities when component mounts

4. Replace the form UI (around line 200-300) from text inputs to three dropdowns

5. Update `handleSubmitReport()` to format and submit structured data

### 6. Frontend - Display Logic
**File**: `packages/domain-widgets/src/reports/ReportCard.tsx`

Update display to show formatted text when `report_category` exists:
```typescript
// If report has structured data, show formatted version
if (report.report_category) {
  return `Report: ${report.report_category} [${report.related_entity_id}] - ${report.report_reason}`;
}
// Otherwise show legacy title/description
```

## Implementation Order
1. ✅ Database schema updated (columns added via Beekeeper)
2. ✅ Create constants file with reason lists (`reportReasons.ts`)
3. ✅ Add backend API endpoints to fetch services/orders/procedures
4. ✅ Update backend report creation to save structured fields
5. ✅ Add frontend API functions
6. ✅ Update ReportsSection UI with dropdowns
7. ✅ Update ReportCard display logic
8. ⏳ Test with creating a report for a service (READY FOR TESTING)

## Testing Checklist

### Basic Functionality
- [ ] Can select "Service" from Report For dropdown
- [ ] Services dropdown populates with real services from database (service CEN-010-SRV-001 should appear)
- [ ] Services dropdown shows "Name (ID)" format (e.g., "Emergency Stock Retrieval (CEN-010-SRV-002)")
- [ ] Orders dropdown populates with real orders from database (order CEN-010-SO-035 should appear)
- [ ] Orders dropdown shows "Name (ID)" format
- [ ] Procedures dropdown shows empty (expected behavior for now)
- [ ] Can select a reason from the reasons dropdown
- [ ] Submit button is disabled until all dropdowns are selected

### Priority System (Reports)
- [ ] Priority dropdown appears when creating a report
- [ ] Priority dropdown has options: Low, Medium, High
- [ ] Submit button disabled until priority is selected
- [ ] Report creates successfully with priority
- [ ] Priority displays correctly in ReportCard (LOW/MEDIUM/HIGH badge)
- [ ] Priority value stored correctly in database (`reports.priority`)

### Rating System (Feedback)
- [ ] Rating dropdown appears when creating feedback
- [ ] Rating dropdown has options: ★ 1 through ★★★★★ 5
- [ ] Submit button disabled until rating is selected (rating > 0)
- [ ] Feedback creates successfully with rating
- [ ] Rating displays correctly in FeedbackCard (star rating)
- [ ] Rating value stored correctly in database (`feedback.rating`)

### Role-Based Visibility
- [ ] **Manager**: Can see all services/orders in their ecosystem
- [ ] **Center**: Can see services/orders related to their center (via cks_manager lookup)
- [ ] **Customer**: Can see services/orders related to their customer (via cks_manager lookup)
- [ ] **Contractor**: Can see services/orders related to their contractor (via cks_manager lookup)
- [ ] **Crew**: Can see services/orders related to their assigned center (via cks_manager lookup)
- [ ] **Warehouse**: Can ONLY see orders assigned to their warehouse (NOT ecosystem-based)

### Display & Formatting
- [ ] Report displays with formatted text: "Report: Service [ID] - Reason"
- [ ] "Managed By" field shows correctly (not NULL)
- [ ] "Managed By" shows warehouse name when applicable
- [ ] "Managed By" shows manager name when applicable
- [ ] Other users can see the report with proper formatting
- [ ] Feedback works with the same structure
- [ ] Priority badge color-coded (if implemented: RED=HIGH, YELLOW=MEDIUM, GREEN=LOW)

## Notes
- NO text input fields - everything is dropdowns
- Title and description are auto-generated on the backend from the dropdown selections
- Old reports (created before this change) will still display using title/description fields
- New reports will use the structured fields for display
- **IMPORTANT**: Product category has been completely removed from the system (Oct 9, 2025)
- Services are queried from the `services` table with `manager_code` filtering
- Orders are queried from the `orders` table with `manager_id` filtering
- Procedures will be implemented later (currently returns empty array)

## Recent Updates

### Oct 9, 2025 - Session 1

#### Bug Fixes
- **Fixed critical bug**: Services dropdown was querying wrong table (`order_items` instead of `services`)
- **Fixed filtering**: Now properly filters out archived and cancelled items from dropdowns
- **Fixed validation**: Backend now rejects Product category in validation schema

#### Code Changes
- Removed all Product-related code from codebase
- Updated `ReportCategory` type: `'service' | 'order' | 'procedure'`
- Removed `fetchProductsForReports()` and `getProductsForReports()`
- Added `fetchProceduresForReports()` and `getProceduresForReports()`
- Updated all 6 Hub components to use new procedures API

### Oct 9, 2025 - Session 2

#### New Features
- **Priority System for Reports**: Added LOW/MEDIUM/HIGH priority levels (required field)
- **Rating System for Feedback**: Added 1-5 star ratings (required field)
- **Improved Dropdown UX**: Shows "Name (ID)" format (e.g., "Emergency Stock Retrieval (CEN-010-SRV-002)")
- **Role-Aware Filtering**: Non-manager users can now see services/orders in their ecosystem
- **Warehouse Isolation**: Warehouses only see reports about their assigned orders

#### Database Changes
- Migration: `20251010_01_add_priority_and_rating_to_reports_feedback.sql`
- Added `priority` (VARCHAR 10) to `reports` table
- Added `rating` (INTEGER) to `feedback` table
- Added `report_category`, `related_entity_id`, `report_reason` to `feedback` table

#### Bug Fixes
- **Empty dropdowns for non-managers**: Fixed by implementing `resolveManagerForUser()` helper
- **Services query error**: Now queries `services` table with JOIN to `orders` via `transformed_id`
- **Warehouse query error**: Removed invalid `cks_manager` subquery from warehouse filtering
- **"Managed By: NULL" display**: Added `managedBy*` fields to all hub `commonOrder` objects
- **Function signature mismatch**: Fixed `onResolve` prop signature throughout component chain

#### Code Changes
- **Backend**: `resolveManagerForUser()` determines ecosystem manager based on role
- **Backend**: Updated `getServicesForReports()` and `getOrdersForReports()` to accept `(userCode, role)`
- **Backend**: Added `getWarehouseReports()` for warehouse-specific visibility
- **Frontend**: Added priority dropdown (reports) and rating dropdown (feedback)
- **Frontend**: Refactored JSX conditionals from `&&` to ternary operators for better ESBuild compatibility
- **All Hubs**: Updated to pass `managedBy`, `managedById`, `managedByName` fields

### Oct 10, 2025 - Session 2

#### Critical Bug Fixes - Auto-Close Logic

**Files Modified**:
- `apps/backend/server/domains/reports/repository.ts`
- `apps/frontend/src/hubs/CustomerHub.tsx`
- `apps/frontend/src/hubs/ContractorHub.tsx`

#### Bug Fixes

1. **Backend 500 Errors Fixed**: Corrected database column names in SQL queries
   - Changed: `assigned_contractor` → `contractor_id`
   - Changed: `assigned_crew` → `crew_id`
   - Changed: `cks_manager` → `manager_id`
   - Applied to both `acknowledgeReport()` and `updateReportStatus()` functions

2. **Auto-Close Logic Rewritten**: Changed from ecosystem-wide to order-specific stakeholder counting
   - **OLD**: Counted all users in manager's ecosystem (incorrect)
   - **NEW**: Query orders table to identify actual order participants
   - Uses JavaScript `Set` to avoid duplicate stakeholders
   - Excludes report creator from count
   - `totalUsers = stakeholders.size` (actual participants only)
   - Report auto-closes when: `acknowledgements.length === totalUsers` AND status is "resolved"

3. **Cache Invalidation Fixed**: Reports now appear immediately after creation
   - Added `mutate: mutateReports` to CustomerHub.tsx (line 199)
   - Added `mutate: mutateReports` to ContractorHub.tsx (line 264)
   - CenterHub already had correct pattern

#### Technical Details

**Order-Specific Stakeholder Counting Algorithm**:
```typescript
// Query the orders table for specific order
const order = orderResult.rows[0];
const stakeholders = new Set<string>();

// Add each role if present and not the creator
if (order.manager_id && order.manager_id.toUpperCase() !== createdById.toUpperCase()) {
  stakeholders.add(order.manager_id.toUpperCase());
}
if (order.customer_id && order.customer_id.toUpperCase() !== createdById.toUpperCase()) {
  stakeholders.add(order.customer_id.toUpperCase());
}
if (order.contractor_id && order.contractor_id.toUpperCase() !== createdById.toUpperCase()) {
  stakeholders.add(order.contractor_id.toUpperCase());
}
if (order.crew_id && order.crew_id.toUpperCase() !== createdById.toUpperCase()) {
  stakeholders.add(order.crew_id.toUpperCase());
}
if (order.assigned_warehouse && order.assigned_warehouse.toUpperCase() !== createdById.toUpperCase()) {
  stakeholders.add(order.assigned_warehouse.toUpperCase());
}

totalUsers = stakeholders.size;
```

**Why We Use Set**: Prevents duplicate counting if a user has multiple roles in the order

**Why We Exclude Creator**: Report creator shouldn't need to acknowledge their own report

#### Bugs Resolved

1. ✅ **"Failed to acknowledge" toasts** - Backend no longer crashes after saving acknowledgments
2. ✅ **Reports not auto-closing** - Now correctly identifies all stakeholders and auto-closes when all acknowledge + resolved
3. ✅ **Reports not appearing after creation** - Cache now updates immediately without manual refresh

### Status
✅ **IMPLEMENTATION COMPLETE** - Priority/Rating features added
✅ **CRITICAL BUGS FIXED** - Auto-close logic and cache invalidation working
⏳ **TESTING IN PROGRESS** - End-to-end testing required
