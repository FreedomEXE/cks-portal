# Admin Hub Modular Fix - Complete Report Data

## What We Changed

### Before (Broken - Hardcoded Directory Endpoints) ❌

```typescript
// apps/frontend/src/hubs/AdminHub.tsx

import { useReports, useFeedback } from '../shared/api/directory';

export default function AdminHub({ initialTab = 'dashboard' }: AdminHubProps) {
  const { code } = useAuth();
  const { data: directoryReports } = useReports();        // ❌ Admin-only directory endpoint
  const { data: directoryFeedback } = useFeedback();      // ❌ Admin-only directory endpoint

  // Manual unification (shouldn't be needed)
  const reportsDataUnified = useMemo(
    () => ({
      reports: directoryReports ?? [],
      feedback: directoryFeedback ?? [],
    }),
    [directoryReports, directoryFeedback],
  );

  return (
    <ModalProvider currentUserId={code || ''} role="admin" reportsData={reportsDataUnified}>
      <AdminHubContent initialTab={initialTab} />
    </ModalProvider>
  );
}

function AdminHubContent({ initialTab = 'dashboard' }: AdminHubProps) {
  const { code } = useAuth();
  const { data: directoryReports, isLoading: reportsLoading } = useReports();
  const { data: directoryFeedback, isLoading: feedbackLoading } = useFeedback();

  const reportsData = useMemo(
    () => ({
      reports: directoryReports ?? [],
      feedback: directoryFeedback ?? [],
    }),
    [directoryReports, directoryFeedback],
  );

  // ... rest of component
}
```

**Problems:**
- Uses admin-specific directory endpoints `/admin/directory/reports`
- Returns incomplete data (missing `submittedBy`, `submittedDate`, `acknowledgments`, `priority`, `rating`, etc.)
- Requires manual shape unification
- NOT modular - hardcoded to admin role

### After (Fixed - Modular Hub Endpoint) ✅

```typescript
// apps/frontend/src/hubs/AdminHub.tsx

import { useHubReports } from '../shared/api/hub';

export default function AdminHub({ initialTab = 'dashboard' }: AdminHubProps) {
  const { code } = useAuth();
  // Use hub endpoint for complete report data (submittedBy, submittedDate, acknowledgments, etc.)
  const { data: reportsData } = useHubReports(code);   // ✅ Universal hub endpoint

  return (
    <ModalProvider currentUserId={code || ''} role="admin" reportsData={reportsData ?? undefined}>
      <AdminHubContent initialTab={initialTab} />
    </ModalProvider>
  );
}

function AdminHubContent({ initialTab = 'dashboard' }: AdminHubProps) {
  const { code } = useAuth();
  // Use hub endpoint for complete report data (same as all other roles)
  const { data: reportsData, isLoading: reportsLoading } = useHubReports(code);

  // ... rest of component (reportsData already has correct shape!)
}
```

**Benefits:**
- Uses universal hub endpoint `/hub/reports/{cksCode}`
- Returns complete data (all fields needed for modals)
- No manual unification needed (backend returns correct shape)
- **FULLY MODULAR** - same code works for all roles

## Why This Is Modular

### Same Code, Different Data Based on User

**The hub endpoint adapts automatically:**

```typescript
// SAME HOOK, DIFFERENT USERS
useHubReports(code)  // code is the user's CKS ID
```

**Backend routing (routes.fastify.ts:10-24):**
```typescript
fastify.get('/hub/reports/:cksCode', async (request, reply) => {
  const user = await requireActiveRole(request, reply);
  // ↑ Extracts role from JWT token (no hardcoding!)

  const { cksCode } = request.params;
  // ↑ Uses the user's code to scope data

  const reports = await getHubReports(user.role, cksCode);
  // ↑ Calls the SAME function with role + code

  return reply.send({ data: reports });
});
```

**Backend scoping logic (store.ts:447-465):**
```typescript
export async function getHubReports(role: HubRole, cksCode: string) {

  // ✅ Admin sees ALL reports (global)
  if (role === 'admin') {
    return getAllReportsForAdmin(cksCode);
  }

  // ✅ Warehouse sees only reports about THEIR orders
  if (role === 'warehouse') {
    return getWarehouseReports(cksCode);
  }

  // ✅ Everyone else: ecosystem-scoped
  // (contractor, center, customer, crew, manager)
  return getEcosystemReports(cksCode, role);
  // ↑ Finds their manager, returns only reports in that ecosystem
}
```

### Real-World Examples

#### Example 1: Admin ADM-001 calls endpoint

**Request:**
```
GET /hub/reports/ADM-001
Authorization: Bearer {JWT with role=admin}
```

**Backend Logic:**
```typescript
getHubReports('admin', 'ADM-001')
  → getAllReportsForAdmin('ADM-001')
  → SQL: SELECT * FROM reports WHERE archived_at IS NULL  (ALL reports)
  → Returns: 1000 reports across ALL ecosystems ✅
```

**Frontend receives:**
```typescript
reportsData = {
  role: 'admin',
  cksCode: 'ADM-001',
  reports: [/* 500 reports */],
  feedback: [/* 500 feedback */]
}
```

#### Example 2: Contractor CON-042 calls endpoint

**Request:**
```
GET /hub/reports/CON-042
Authorization: Bearer {JWT with role=contractor}
```

**Backend Logic:**
```typescript
getHubReports('contractor', 'CON-042')
  → getEcosystemReports('CON-042', 'contractor')
  → getManagerForUser('CON-042', 'contractor')
      → SQL: SELECT cks_manager FROM contractors WHERE contractor_id = 'CON-042'
      → Returns: 'MGR-005'
  → SQL: SELECT * FROM reports WHERE
         (center_id IN (SELECT center_id FROM centers WHERE cks_manager = 'MGR-005')
         OR customer_id IN (SELECT customer_id FROM customers WHERE cks_manager = 'MGR-005'))
  → Returns: Only reports in MGR-005's ecosystem ✅
```

**Frontend receives:**
```typescript
reportsData = {
  role: 'contractor',
  cksCode: 'CON-042',
  reports: [/* 15 reports in their ecosystem */],
  feedback: [/* 8 feedback in their ecosystem */]
}
```

#### Example 3: Center CEN-023 calls endpoint

**Request:**
```
GET /hub/reports/CEN-023
Authorization: Bearer {JWT with role=center}
```

**Backend Logic:**
```typescript
getHubReports('center', 'CEN-023')
  → getEcosystemReports('CEN-023', 'center')
  → getManagerForUser('CEN-023', 'center')
      → SQL: SELECT cks_manager FROM centers WHERE center_id = 'CEN-023'
      → Returns: 'MGR-012'
  → SQL: SELECT * FROM reports WHERE
         (center_id IN (SELECT center_id FROM centers WHERE cks_manager = 'MGR-012'))
  → Returns: Only reports in MGR-012's ecosystem ✅
```

**Frontend receives:**
```typescript
reportsData = {
  role: 'center',
  cksCode: 'CEN-023',
  reports: [/* 5 reports in their ecosystem */],
  feedback: [/* 3 feedback in their ecosystem */]
}
```

### Scaling to 1000 Users

**No code changes needed!**

| Users | Frontend Code | Backend Code | Notes |
|-------|--------------|--------------|-------|
| 1 admin | `useHubReports(code)` | Same | Sees all reports |
| 100 admins | `useHubReports(code)` | Same | Each sees all reports |
| 1000 contractors | `useHubReports(code)` | Same | Each sees their ecosystem |
| 500 centers | `useHubReports(code)` | Same | Each sees their ecosystem |
| 10,000 total users | `useHubReports(code)` | Same | ✅ **FULLY MODULAR** |

The `code` parameter is what makes it modular - it tells the backend "who is asking" and the backend figures out "what they can see".

## Data Completeness

### Directory Endpoint (Old - Broken)
```typescript
{
  id: "RPT-042",
  type: "safety",              // ❌ Wrong field name
  severity: "high",
  title: "Safety Issue",
  description: "...",
  centerId: "CEN-010",
  customerId: null,
  status: "open",
  createdByRole: "center",     // ❌ Wrong field name
  createdById: "CEN-010",      // ❌ Wrong field name
  createdAt: "2025-01-15",     // ❌ Wrong field name
  updatedAt: "2025-01-16",
  archivedAt: null
  // ❌ Missing: category, submittedBy, submittedDate, acknowledgments,
  //            priority, rating, resolution, reportCategory, etc.
}
```

### Hub Endpoint (New - Complete)
```typescript
{
  id: "RPT-042",
  type: "report",
  category: "Safety Concern",   // ✅ Correct field
  title: "Safety Issue",
  description: "...",
  submittedBy: "CEN-010",       // ✅ Correct field
  submittedDate: "2025-01-15T14:30:00Z",  // ✅ Correct field
  status: "open",
  relatedService: "SRV-100",
  acknowledgments: [            // ✅ Loaded via JOIN
    { userId: "MGR-005", date: "2025-01-15T15:00:00Z" }
  ],
  tags: ["urgent", "safety"],
  resolution_notes: null,
  resolvedBy: null,
  resolvedAt: null,
  reportCategory: "service",    // ✅ New structured field
  relatedEntityId: "SRV-100",   // ✅ New structured field
  reportReason: "Equipment Malfunction",  // ✅ New structured field
  priority: "HIGH",             // ✅ New structured field
  rating: null,
  serviceManagedBy: "MGR-005"   // ✅ Loaded via LEFT JOIN
}
```

## Summary

**What we did:**
- Replaced admin-specific directory endpoints with universal hub endpoint
- Removed manual data unification (not needed anymore)
- Same pattern now used across ALL hubs (admin, contractor, center, etc.)

**Why it's modular:**
- ✅ Same frontend code for all roles
- ✅ Same backend endpoint for all roles
- ✅ Backend automatically scopes data based on `role` + `cksCode`
- ✅ Scales to unlimited users with zero code changes
- ✅ No hardcoding of roles, ecosystems, or data

**Result:**
- Admin now sees complete report data (submittedBy, submittedDate, acknowledgments, etc.)
- Modal displays correctly: "User (CEN-010)" → "Center (CEN-010)"
- "Invalid Date" → "Jan 15, 2025 2:30 PM"
- All fields populated correctly
