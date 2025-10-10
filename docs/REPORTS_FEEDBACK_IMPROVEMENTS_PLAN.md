# Reports & Feedback System - Improvements Plan

**Date**: October 10, 2025
**Status**: Planning Phase
**Priority**: High - Critical UX Issues Found

---

## Executive Summary

Based on Test Case 1A results (CUS-015-RPT-003), we identified **6 critical issues** that need immediate attention:

1. ❌ Missing success toasts on acknowledgment
2. ❌ Missing success toasts on resolution
3. ❌ No auto-refresh after state changes (requires manual page refresh)
4. ❌ **BUSINESS RULE VIOLATION**: Reports archive immediately upon resolution, even if not all users acknowledged
5. ❌ No proper "View Details" modal for reports/feedback
6. ❌ Current expanded view lacks proper structure and information

---

## Part 1: Report/Feedback View Modal Design

### Design Goals
- **Consistency**: Match the structure and polish of Service Order and Product Order modals
- **Clarity**: Clearly show what the report/feedback is about based on user selections
- **Completeness**: Show all relevant information including acknowledgments and resolution
- **Role Awareness**: Display "Managed By" similar to service modals

---

### Modal Layout Structure

Based on Service Order and Product Order modal examples, here's the proposed structure:

```
┌─────────────────────────────────────────────────────────┐
│  Report Details                               [X] Close  │
│  CUS-015-RPT-003                                         │
│                                                          │
│  ┌──────────────────────┐                               │
│  │ REPORT │ or │ FEEDBACK │ [Medium Priority Badge]     │
│  └──────────────────────┘                               │
│                                                          │
│  Report Information                                      │
│  ────────────────────────────────────────────────────   │
│  REPORT TYPE              REPORTED FOR                   │
│  Report (Issue/Problem)   Order                          │
│                                                          │
│  RELATED ENTITY          MANAGED BY                      │
│  CEN-010-PO-071          WHS-004 - North Logistics       │
│  Product Order - 1 items                                 │
│                                                          │
│  REASON                  PRIORITY                        │
│  Billing Issue           Medium                          │
│                                                          │
│  SUBMITTED BY            DATE SUBMITTED                  │
│  CUS-015 - Customer      2025-10-10 14:40:13             │
│                                                          │
│  Submission Details                                      │
│  ────────────────────────────────────────────────────   │
│  Auto-generated summary based on selections:             │
│                                                          │
│  "Report submitted for Order [CEN-010-PO-071] regarding  │
│   Billing Issue. Priority: Medium"                       │
│                                                          │
│  Acknowledgment Status                                   │
│  ────────────────────────────────────────────────────   │
│  ACKNOWLEDGED BY (4/5)                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │CRW-006│CEN-010│CON-010│WHS-004│                       │
│  └──────┘ └──────┘ └──────┘ └──────┘                    │
│                                                          │
│  PENDING ACKNOWLEDGMENT (1)                              │
│  ┌──────┐                                                │
│  │MGR-012│                                               │
│  └──────┘                                                │
│                                                          │
│  Resolution (if resolved)                                │
│  ────────────────────────────────────────────────────   │
│  STATUS: Resolved                                        │
│                                                          │
│  RESOLVED BY             DATE RESOLVED                   │
│  WHS-004 - Warehouse     2025-10-10 15:23:45             │
│                                                          │
│  RESOLUTION NOTES                                        │
│  "Contacted billing department. Corrected invoice       │
│   amount from $150 to $125 as per original quote."      │
│                                                          │
│  ACTION TAKEN                                            │
│  "Issued corrected invoice CEN-010-INV-071-REV1.        │
│   Customer will receive credit of $25."                  │
│                                                          │
│  ┌────────┐                                             │
│  │  Close │                                             │
│  └────────┘                                             │
└─────────────────────────────────────────────────────────┘
```

---

### Modal Fields Breakdown

#### Header Section
- **Report ID**: `CUS-015-RPT-003` (large, prominent)
- **Type Badge**: "REPORT" (red/orange) or "FEEDBACK" (green/blue)
- **Priority/Rating Badge**: Priority for reports, star rating for feedback
- **Close Button**: X in top-right corner

#### Report Information Section
| Field | Description | Example |
|-------|-------------|---------|
| **Report Type** | Report or Feedback | "Report (Issue/Problem)" |
| **Reported For** | Category | "Order", "Service", "Procedure" |
| **Related Entity** | The specific item | "CEN-010-PO-071<br>Product Order - 1 items" |
| **Managed By** | Who handles this type | "WHS-004 - North Logistics" |
| **Reason** | Selected reason | "Billing Issue" |
| **Priority/Rating** | Medium/High/Low or 1-5 stars | "Medium" or "★★★★★" |
| **Submitted By** | Creator ID and role | "CUS-015 - Customer" |
| **Date Submitted** | Timestamp | "2025-10-10 14:40:13" |

#### Submission Details Section
- **Auto-generated summary** from selections in sentence format:
  - For Reports: `"Report submitted for {category} [{entity-id}] regarding {reason}. Priority: {priority}"`
  - For Feedback: `"Feedback submitted for {category} [{entity-id}]: {reason}. Rating: {rating} stars"`

#### Acknowledgment Status Section
- **Visual tracker** showing who has/hasn't acknowledged
- **Acknowledged By**: Grid of user ID badges (with checkmarks)
- **Pending Acknowledgment**: Grid of user ID badges (grayed out)
- **Progress Indicator**: "4/5 acknowledged"

#### Resolution Section (only if resolved)
- **Status Badge**: "Resolved" (green)
- **Resolved By**: Resolver ID, name, role
- **Date Resolved**: Timestamp
- **Resolution Notes**: Text area content
- **Action Taken**: Text area content

---

### "Managed By" Logic

Similar to Service Orders, reports/feedback should show who manages them:

| Report For | Managed By |
|------------|------------|
| **Service** | Manager who owns the service (look up from services table) |
| **Order** (Product) | Warehouse that fulfilled the order |
| **Order** (Service) | Manager who owns the service |
| **Procedure** | Manager (default MGR-012 or assigned manager) |

---

### Data Requirements

To build this modal, we need to fetch:

1. **Report/Feedback basic info** (already have)
2. **Related entity details** (order name, service name, etc.)
3. **Manager/Warehouse who manages** the related entity
4. **List of all ecosystem members** who should acknowledge
5. **Acknowledgment records** (who acknowledged, when)
6. **Resolution details** (if resolved)

---

## Part 2: Acknowledgment System Overhaul

### Current Problem
- Reports archive immediately when resolved, even if not all users acknowledged
- No tracking of who should acknowledge vs. who has acknowledged
- No visual feedback (toasts) when acknowledging

### Proposed Solution: Multi-Stage Acknowledgment

#### Database Schema Changes

**New Table**: `report_acknowledgments`
```sql
CREATE TABLE IF NOT EXISTS report_acknowledgments (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(16) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(report_id, user_id),
  INDEX idx_ack_report (report_id),
  INDEX idx_ack_user (user_id)
);
```

**Modify `reports` table**:
```sql
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS required_acknowledgers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS acknowledgment_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_by_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS resolved_by_role VARCHAR(20),
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS action_taken TEXT;
```

---

### Business Logic: Who Should Acknowledge?

When a report/feedback is created, calculate `required_acknowledgers` based on:

#### For Customer Reports (like CUS-015-RPT-003):
```javascript
required_acknowledgers = [
  creator_id,                    // CUS-015
  related_center_id,             // CEN-010 (from order)
  related_contractor_id,         // CON-010 (from order)
  assigned_crew_ids[],           // CRW-006 (from order)
  manager_id,                    // MGR-012 (ecosystem manager)
  warehouse_id                   // WHS-004 (if order-related)
]
```

#### For Manager Reports:
```javascript
required_acknowledgers = [
  manager_id,                    // Creator
  ...ecosystem_members           // All members involved
]
```

#### For Center Reports:
```javascript
required_acknowledgers = [
  center_id,                     // Creator
  manager_id,                    // Manager
  warehouse_id (if applicable)
]
```

---

### Acknowledgment Workflow

```
Report Created
    ↓
System calculates required_acknowledgers[]
    ↓
Store in report record
    ↓
Users can acknowledge
    ↓
On each acknowledgment:
  - Insert record into report_acknowledgments
  - Check if all required users acknowledged
  - If yes: Set acknowledgment_complete = TRUE
    ↓
When resolved AND acknowledgment_complete = TRUE:
  - Move to archive
    ↓
When resolved BUT acknowledgment_complete = FALSE:
  - Mark as resolved but keep in active tab
  - Show "Pending Acknowledgments" warning
```

---

### API Endpoints to Add/Modify

**New Endpoints**:
```typescript
POST   /api/reports/:id/acknowledge       // Acknowledge a report
GET    /api/reports/:id/acknowledgments   // Get acknowledgment list
GET    /api/reports/:id/required-acks     // Get who needs to acknowledge
```

**Modified Endpoints**:
```typescript
PUT    /api/reports/:id/resolve
// Now checks acknowledgment_complete before archiving
// If not complete, marks resolved but keeps in active view
```

---

## Part 3: Toast Notifications & Auto-Refresh

### Problem
1. No feedback when acknowledging
2. No feedback when resolving
3. No auto-refresh of data (requires manual page refresh)

### Solution: SWR Mutation + Toast Integration

#### Install Toast Library (if not already installed)
```bash
pnpm add react-hot-toast
```

#### Implementation Pattern

**In ReportsSection or ReportCard component**:
```typescript
import toast from 'react-hot-toast';
import { mutate } from 'swr';

const handleAcknowledge = async (reportId: string) => {
  try {
    // Call API
    await acknowledgeReport(reportId);

    // Show success toast
    toast.success('Report acknowledged successfully');

    // Auto-refresh data
    mutate('/api/reports');
    mutate(`/api/reports/${reportId}`);

  } catch (error) {
    toast.error('Failed to acknowledge report');
  }
};

const handleResolve = async (reportId: string, details: ResolutionDetails) => {
  try {
    await resolveReport(reportId, details);

    toast.success('Report resolved successfully');

    // Refresh all report lists
    mutate('/api/reports');
    mutate('/api/reports/my');

  } catch (error) {
    toast.error('Failed to resolve report');
  }
};
```

---

## Part 4: Archival Logic Update

### Current (Broken) Logic
```typescript
// When resolved → immediately archive
if (status === 'resolved') {
  archived_at = NOW();
  status = 'closed';
}
```

### New Logic
```typescript
// When resolved
if (status === 'resolved') {
  resolved_at = NOW();
  resolved_by_id = userId;

  // Check if all acknowledgments complete
  const allAcknowledged = checkAcknowledgmentComplete(reportId);

  if (allAcknowledged) {
    // Can archive
    archived_at = NOW();
    status = 'closed';
  } else {
    // Mark as resolved but keep active
    status = 'resolved_pending_ack';
  }
}
```

### UI Indicators
- **Resolved but not archived**: Show badge "Resolved - Pending Acknowledgments"
- **Fully resolved and acknowledged**: Move to archive automatically

---

## Part 5: Implementation Phases

### Phase 1: Critical Fixes (Immediate)
**Priority**: CRITICAL
**Estimated Time**: 2-3 hours

1. ✅ Update test checklist with results
2. Add toast notifications to acknowledge function
3. Add toast notifications to resolve function
4. Add SWR mutate calls for auto-refresh
5. Test acknowledgment flow with toasts

---

### Phase 2: Acknowledgment System (High Priority)
**Priority**: HIGH
**Estimated Time**: 4-6 hours

1. Create `report_acknowledgments` table migration
2. Modify `reports` table with new columns
3. Implement `calculateRequiredAcknowledgers()` function
4. Create acknowledgment API endpoints
5. Update report creation to calculate required acknowledgers
6. Implement acknowledgment tracking in backend
7. Update archival logic to respect acknowledgments

---

### Phase 3: View Modal (High Priority)
**Priority**: HIGH
**Estimated Time**: 6-8 hours

1. Create `ReportDetailsModal` component (similar to OrderDetailsModal)
2. Implement data fetching for modal
3. Add "Managed By" calculation
4. Implement acknowledgment status display
5. Implement resolution details display
6. Style modal to match Order/Service modals
7. Add "View Details" button to ReportCard
8. Wire up modal open/close handlers

---

### Phase 4: Testing & Polish (Medium Priority)
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours

1. Test full acknowledgment flow
2. Test resolution flow with partial acknowledgments
3. Verify archival only happens when complete
4. Test across all roles (Customer, Center, Contractor, Manager, Warehouse)
5. Test toast notifications
6. Test auto-refresh behavior

---

## Database Migration Files Needed

### Migration 1: Add Acknowledgment Tracking
**File**: `database/migrations/20251010_01_add_acknowledgment_system.sql`

```sql
-- +migrate Up

-- Create acknowledgments table
CREATE TABLE IF NOT EXISTS report_acknowledgments (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(16) NOT NULL REFERENCES reports(report_id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  user_name VARCHAR(255),
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ack_report ON report_acknowledgments(report_id);
CREATE INDEX IF NOT EXISTS idx_ack_user ON report_acknowledgments(user_id);

-- Add columns to reports table
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS required_acknowledgers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS acknowledgment_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_by_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS resolved_by_role VARCHAR(20),
ADD COLUMN IF NOT EXISTS resolved_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
ADD COLUMN IF NOT EXISTS action_taken TEXT;

-- +migrate Down
DROP TABLE IF EXISTS report_acknowledgments;
ALTER TABLE reports
DROP COLUMN IF EXISTS required_acknowledgers,
DROP COLUMN IF EXISTS acknowledgment_complete,
DROP COLUMN IF EXISTS resolved_at,
DROP COLUMN IF EXISTS resolved_by_id,
DROP COLUMN IF EXISTS resolved_by_role,
DROP COLUMN IF EXISTS resolved_by_name,
DROP COLUMN IF EXISTS resolution_notes,
DROP COLUMN IF EXISTS action_taken;
```

---

## Component Structure

### New Components to Create

```
packages/domain-widgets/src/reports/
├── ReportDetailsModal.tsx          (NEW - main view modal)
├── ReportDetailsModal.module.css   (NEW - modal styles)
├── AcknowledgmentTracker.tsx       (NEW - shows who acknowledged)
├── AcknowledgmentTracker.module.css
└── index.ts                        (update exports)
```

---

## API Functions to Add

**File**: `apps/frontend/src/shared/api/reports.ts`

```typescript
// Acknowledgment
export async function acknowledgeReport(reportId: string): Promise<void> {
  return fetch(`/api/reports/${reportId}/acknowledge`, {
    method: 'POST',
  }).then(res => res.json());
}

// Get acknowledgments
export async function getReportAcknowledgments(reportId: string): Promise<Acknowledgment[]> {
  return fetch(`/api/reports/${reportId}/acknowledgments`).then(res => res.json());
}

// Get required acknowledgers
export async function getRequiredAcknowledgers(reportId: string): Promise<string[]> {
  return fetch(`/api/reports/${reportId}/required-acks`).then(res => res.json());
}

// Resolve report
export async function resolveReport(
  reportId: string,
  details: { resolutionNotes: string; actionTaken: string }
): Promise<void> {
  return fetch(`/api/reports/${reportId}/resolve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  }).then(res => res.json());
}
```

---

## Testing Checklist (After Implementation)

- [ ] Acknowledgment creates record in DB
- [ ] Acknowledgment shows success toast
- [ ] Data auto-refreshes without manual page reload
- [ ] Report does NOT archive until all users acknowledge
- [ ] Resolved reports show "Pending Acknowledgment" if incomplete
- [ ] View Details modal opens and shows correct data
- [ ] "Managed By" displays correctly for each category
- [ ] Acknowledgment tracker shows who acknowledged and who's pending
- [ ] Resolution details display in modal
- [ ] Modal styling matches Order/Service modals

---

## Summary of Changes

| Area | Changes | Priority |
|------|---------|----------|
| **UX** | Add toasts, auto-refresh | CRITICAL |
| **Database** | Add acknowledgment tracking | HIGH |
| **Business Logic** | Fix archival rules | HIGH |
| **UI** | Create view modal | HIGH |
| **API** | Add acknowledgment endpoints | HIGH |
| **Testing** | Verify all flows work | MEDIUM |

---

**Total Estimated Time**: 14-20 hours
**Recommended Approach**: Implement in phases, test after each phase

---

**Next Steps**:
1. Get approval on design and approach
2. Start with Phase 1 (Critical Fixes) - 2-3 hours
3. Move to Phase 2 (Acknowledgment System)
4. Implement Phase 3 (View Modal)
5. Comprehensive testing

---

**End of Plan**
