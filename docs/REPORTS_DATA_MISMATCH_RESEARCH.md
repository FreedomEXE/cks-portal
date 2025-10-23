# Reports Data Mismatch Research

## Problem
Admin sees incomplete report/feedback data:
- "User ()" instead of actual user ID
- "Invalid Date" instead of submitted date
- Missing category, acknowledgments, priority, rating, resolution data

## Root Cause

### AdminHub uses **Directory Endpoints** ❌
```typescript
// apps/frontend/src/hubs/AdminHub.tsx:220-221
const { data: directoryReports } = useReports();
const { data: directoryFeedback } = useFeedback();
```
- Endpoint: `GET /api/admin/directory/reports`
- Endpoint: `GET /api/admin/directory/feedback`
- Handler: `listReports()` in `directory/store.ts:778`
- Handler: `listFeedback()` in `directory/store.ts:797`

**SQL Query (directory/store.ts:779):**
```sql
SELECT report_id, type, severity, title, description, center_id, customer_id,
       status, created_by_role, created_by_id, created_at, updated_at, archived_at
FROM reports
WHERE archived_at IS NULL
ORDER BY report_id
LIMIT $1
```

**Returns:** `ReportDirectoryEntry` (directory/types.ts)
```typescript
{
  id: string;
  type: string;              // NOT category
  severity: string | null;
  title: string;
  description: string | null;
  centerId: string | null;
  customerId: string | null;
  status: string;
  createdByRole: string;     // NOT submittedBy
  createdById: string;       // NOT submittedBy
  createdAt: string | null;  // NOT submittedDate
  updatedAt: string | null;
  archivedAt: string | null;
  // ❌ Missing: category, acknowledgments, priority, reportCategory,
  //    relatedEntityId, reportReason, rating, resolution, etc.
}
```

### ContractorHub uses **Hub Endpoints** ✅
```typescript
// apps/frontend/src/hubs/ContractorHub.tsx:199
const { data: reportsData } = useHubReports(normalizedCode);
```
- Endpoint: `GET /api/hub/reports/{cksCode}`
- Handler: `getHubReports()` → `getAllReportsForAdmin()` in `reports/store.ts:447`

**SQL Query (reports/store.ts:153-160):**
```sql
SELECT r.report_id, r.type, r.severity, r.title, r.description, r.service_id,
       r.center_id, r.customer_id, r.status, r.created_by_id, r.created_by_role,
       r.created_at, r.tags, r.report_category, r.related_entity_id,
       r.report_reason, r.priority, s.managed_by as service_managed_by
FROM reports r
LEFT JOIN services s ON r.report_category = 'service'
  AND UPPER(s.service_id) = UPPER(r.related_entity_id)
WHERE r.archived_at IS NULL
ORDER BY r.created_at DESC NULLS LAST
```

**Additional Queries:**
- Loads acknowledgments from `report_acknowledgments` table
- Loads acknowledgments from `feedback_acknowledgments` table

**Returns:** `ReportItem` via `mapReportRow()` (reports/store.ts:36-59)
```typescript
{
  id: string;
  type: 'report' | 'feedback';
  category: string;              // ✅ Mapped from type/kind
  title: string;
  description: string;
  submittedBy: string;           // ✅ Mapped from created_by_id
  submittedDate: string;         // ✅ Mapped from created_at
  status: 'open' | 'resolved' | 'closed';
  relatedService?: string | null;
  acknowledgments?: Array<{ userId: string; date: string }>; // ✅
  tags?: string[];
  resolution_notes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  reportCategory?: string | null;     // ✅
  relatedEntityId?: string | null;    // ✅
  reportReason?: string | null;       // ✅
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null; // ✅
  rating?: number | null;             // ✅
  serviceManagedBy?: string | null;   // ✅
}
```

## Field Mapping Comparison

| Frontend Field | Directory Response | Hub Response | Status |
|---------------|-------------------|--------------|---------|
| `submittedBy` | `createdById` ❌ | `submittedBy` ← `created_by_id` ✅ | **BROKEN** |
| `submittedDate` | `createdAt` ❌ | `submittedDate` ← `created_at` ✅ | **BROKEN** |
| `reportCategory` | NOT IN RESPONSE ❌ | `reportCategory` ✅ | **BROKEN** |
| `category` | `type` ❌ (wrong field name) | `category` ← `type`/`kind` ✅ | **BROKEN** |
| `acknowledgments` | NOT IN RESPONSE ❌ | `acknowledgments` ← JOIN ✅ | **BROKEN** |
| `priority` | NOT IN RESPONSE ❌ | `priority` ✅ | **BROKEN** |
| `rating` | NOT IN RESPONSE ❌ | `rating` ✅ | **BROKEN** |
| `resolution` | NOT IN RESPONSE ❌ | `resolution_notes`, `resolvedBy`, `resolvedAt` ✅ | **BROKEN** |
| `serviceManagedBy` | NOT IN RESPONSE ❌ | `serviceManagedBy` ← LEFT JOIN ✅ | **BROKEN** |

## Why This Happens

**Frontend normalization (useReportDetails.ts:76-82):**
```typescript
return {
  id: entity.id,
  type: 'report',
  reportReason: entity.reportReason || entity.title,  // entity.reportReason = undefined
  status: entity.status as 'open' | 'resolved' | 'closed',
  priority: entity.priority as 'HIGH' | 'MEDIUM' | 'LOW' | null,  // undefined
  rating: null,
  reportCategory: entity.reportCategory,  // undefined
  submittedBy: entity.submittedBy || '',  // undefined → '' → "User ()"
  submittedDate: entity.submittedDate,    // undefined → "Invalid Date"
  // ...
};
```

Directory API returns `createdById` but frontend expects `submittedBy` → mismatch!

## Solution

**Option 1: Fix Backend Directory Endpoints** ⚠️
- Modify `listReports()` and `listFeedback()` in `directory/store.ts`
- Add all missing fields to SQL query
- Add JOINs for acknowledgments
- Map fields to match hub response shape
- **Downside:** Directory is meant to be lightweight for listing; adding JOINs/acknowledgments makes it heavy

**Option 2: Fix Frontend to Use Hub Endpoints** ✅ **RECOMMENDED**
- Change AdminHub to use `useHubReports(code)` instead of `useReports()` + `useFeedback()`
- Backend already has `getAllReportsForAdmin()` that returns complete data
- No SQL changes needed - just use correct endpoint
- **Advantage:** Hub endpoints are designed for full data; directory for lightweight lists

**Option 3: Fix Frontend Normalization** ⚠️
- Update `normalizeReport()` to handle both data shapes
- Map `createdById` → `submittedBy`, `createdAt` → `submittedDate`
- **Downside:** Still missing acknowledgments, priority, rating, resolution from directory API

## Recommended Fix

**Change AdminHub.tsx to use hub endpoints:**

```typescript
// BEFORE (apps/frontend/src/hubs/AdminHub.tsx:220-227)
const { data: directoryReports } = useReports();
const { data: directoryFeedback } = useFeedback();

const reportsDataUnified = useMemo(
  () => ({
    reports: directoryReports || [],
    feedback: directoryFeedback || []
  }),
  [directoryReports, directoryFeedback]
);

// AFTER
const { data: reportsData } = useHubReports(code);

// reportsData already has shape: { reports: [], feedback: [] }
// No transformation needed!
```

Then pass `reportsData` to `ModalProvider`:
```typescript
<ModalProvider
  role="admin"
  currentUserId={code || undefined}
  reportsData={reportsData}  // Already in correct shape
  ordersData={ordersData}
>
```

## Files to Change

1. **apps/frontend/src/hubs/AdminHub.tsx**
   - Line 220-221: Replace `useReports()` + `useFeedback()` with `useHubReports(code)`
   - Line 224-227: Remove `reportsDataUnified` - use `reportsData` directly
   - Line 281-282: Same changes for InnerAdminHub
   - Line 285: Same changes for reportsData unification

## Backend Already Supports This!

The backend `getAllReportsForAdmin()` function (reports/store.ts:149) already:
- Returns ALL reports across all ecosystems ✅
- Includes ALL fields (category, acknowledgments, priority, rating, etc.) ✅
- Properly maps `created_by_id` → `submittedBy` ✅
- Properly maps `created_at` → `submittedDate` ✅
- JOINs acknowledgments tables ✅

Admin just needs to call `/hub/reports/{adminCode}` instead of `/admin/directory/reports`.
