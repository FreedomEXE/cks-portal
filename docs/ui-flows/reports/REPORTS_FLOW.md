# CKS Reports & Feedback Flow Documentation

**Status**: ✅ 95% Complete | 🧪 In Testing (Oct 10, 2025)

## Overview
The CKS reports and feedback system facilitates issue tracking, communication, and problem resolution across the entire ecosystem. It operates as a dual system: Reports for serious issues and Feedback for general communication.

**Latest Updates (Oct 11, 2025)**:
- Managed By detection updated: services with `managed_by = 'warehouse'` or any `WHS-*` are treated as warehouse‑managed.
- Resolve permissions enforced server‑side for service reports based on `services.managed_by` (warehouse vs manager).

**Latest Updates (Oct 10, 2025)**:
- ✅ Auto-close logic fixed (now filters to stakeholders only)
- ✅ Warehouse-managed services properly routed to warehouse for resolution
- ✅ Context-aware UI (reports vs feedback terminology)
- ✅ Real-time updates via cache mutations
- 🧪 End-to-end testing in progress (3/8 scenarios passing)

## Related Code Files
- **Report Components**: `/apps/frontend/src/components/reports/`
- **Report Card UI**: `/packages/ui/src/cards/ReportCard/`
- **Report Types**: `/apps/backend/server/domains/reports/types.ts`
- **Report Service**: `/apps/backend/server/domains/reports/service.ts`

## System Distinction

### Reports (RPT)
- **Purpose**: Serious issues requiring action
- **ID Format**: `RPT-XXX` (e.g., `RPT-001`)
- **Examples**: Safety concerns, performance issues, policy violations
- **Resolution**: Mandatory tracking and resolution

### Feedback (FBK)
- **Purpose**: General communication and observations
- **ID Format**: `FBK-XXX` (e.g., `FBK-001`)
- **Examples**: Compliments, suggestions, observations
- **Resolution**: Optional acknowledgment

## Who Can Create What

### Reports (Issues/Problems)
**Can Create:**
- ✅ Customers
- ✅ Centers
- ✅ Contractors

**Cannot Create:**
- ❌ Managers (can only acknowledge/resolve reports)
- ❌ Warehouses (can only acknowledge/resolve warehouse-related reports)
- ❌ Crew members (can only acknowledge reports they're involved in)

### Feedback (Suggestions/Compliments)
**Can Create:**
- ✅ Customers
- ✅ Centers
- ✅ Contractors
- ✅ Managers
- ✅ Warehouses

**Cannot Create:**
- ❌ Crew members (view and acknowledge only)

## Report Categories

### Report Types (Issues)
- Service Quality
- Product Quality
- Crew Performance
- Delivery Issues
- System Bug
- Safety Concern
- Other

### Feedback Types
- Service Excellence
- Staff Performance
- Process Improvement
- Product Suggestion
- System Enhancement
- Recognition
- Other

## Status Flow

### Report Status Values
- `pending` - Awaiting initial review
- `acknowledged` - Seen and under review
- `in-progress` - Being investigated/resolved
- `resolved` - Solution implemented
- `closed` - Issue closed (can be reopened)
- `cancelled` - Report withdrawn

### Feedback Status Values
- `new` - Unread feedback
- `acknowledged` - Read and acknowledged
- `noted` - Recorded for consideration
- `implemented` - Suggestion implemented

## Visual Design

### Status Colors
- **Pending/New**: Yellow (#fbbf24)
  - Background: #fef3c7
- **Acknowledged**: Blue (#3b82f6)
  - Background: #dbeafe
- **In Progress**: Orange (#f59e0b)
  - Background: #fed7aa
- **Resolved**: Green (#10b981)
  - Background: #dcfce7
- **Closed/Cancelled**: Gray (#6b7280)
  - Background: #f3f4f6

### Severity Indicators (Reports Only)
- **Critical**: Red badge, pulsing border
- **High**: Orange badge
- **Medium**: Yellow badge
- **Low**: Gray badge

## Role-Based Views

### Manager View
```
Reports Dashboard
├── All Reports (System-wide visibility)
├── Filter by: Status, Severity, Type, Date
├── Actions: Acknowledge, Investigate, Resolve, Close
└── Analytics: Trends, patterns, resolution times
```

### Customer View
```
Reports & Feedback
├── My Reports (Created by me)
├── Reports About Me (If any)
├── Create New: Report or Feedback
└── Track: Status updates, resolutions
```

### Crew View
```
Feedback Section
├── Feedback About Me (Recognition, etc.)
├── Reports Involving Me (View only)
└── Create: Feedback only
```

### Center View
```
Reports Management
├── Reports I Created
├── Reports About My Center
├── Reports About My Crew
├── Create: Report or Feedback
└── Actions: Track, follow up
```

### Contractor View
```
Reports Overview
├── My Reports (Work environment issues)
├── Feedback I've Given
├── Create: Report to Managers
└── View: Resolution status
```

### Warehouse View
```
Operational Reports
├── Delivery Issues
├── Inventory Concerns
├── Order Problems
├── Actions: Acknowledge, Resolve (operational items)
└── Create: Feedback
```

## Hierarchy Rules

### Reporting Hierarchy
Users can only create reports about:
1. Entities at their level or below
2. Service-related issues they're involved in
3. Safety concerns (any level - exception)

### Example Hierarchy
```
Manager (Can view/resolve all)
├── Contractor (Reports to Manager)
│   ├── Customer (Reports about Centers/Crew)
│   │   └── Center (Reports about Crew)
│   │       └── Crew (Cannot create reports)
└── Warehouse (Operational reports only)
```

## Report Card UI

### Collapsed State
Shows single-line summary:
- Type badge (REPORT/FEEDBACK)
- ID (clickable, blue)
- Title
- Status badge
- Severity (if report)

### Expanded State
Full details including:
- Reporter information
- Subject (who/what it's about)
- Full description
- Timeline of actions
- Resolution notes
- Action buttons

## Workflow Examples

### Report Creation Flow
1. User clicks "Create Report"
2. Selects type (Report vs Feedback)
3. Choose category
4. Select subject (who/what about)
5. Enter details
6. Set severity (if report)
7. Submit

### Resolution Flow
1. Manager sees new report (pending)
2. Acknowledges report
3. Investigates issue
4. Updates status to in-progress
5. Implements solution
6. Marks as resolved with notes
7. Can close after verification

### Feedback Flow
1. User submits feedback
2. Recipient sees notification
3. Can acknowledge (optional)
4. No mandatory resolution required

## Data Model

### Report Interface
```typescript
interface Report {
  reportId: string;
  type: 'report' | 'feedback';
  category: string;
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status: ReportStatus;
  createdBy: {
    role: string;
    id: string;
    name: string;
  };
  about: {
    type: string;
    id: string;
    name: string;
  };
  timeline: Action[];
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Action Timeline
```typescript
interface Action {
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
}
```

## Notification Rules

### Immediate Notifications
- Critical severity reports
- Safety concerns
- Reports about self

### Daily Digest
- New reports in area
- Status updates
- Feedback received

### Weekly Summary
- Resolution metrics
- Trending issues
- Recognition highlights

## Search & Filters

### Filter Options
- Status (multiple select)
- Date range
- Severity level
- Category
- Reporter role
- Subject entity

### Sort Options
- Date (newest/oldest)
- Severity (highest first)
- Status (pending first)
- Recently updated

## Analytics & Metrics

### Key Metrics
- Average resolution time
- Reports by category
- Severity distribution
- Reporter satisfaction
- Feedback sentiment

### Trending Analysis
- Common issues
- Repeat problems
- Seasonal patterns
- Entity performance

## Future Enhancements

1. **Anonymous Reporting**: Allow anonymous submissions
2. **Photo Attachments**: Add images to reports
3. **Escalation Rules**: Auto-escalate based on time/severity
4. **AI Categorization**: Auto-categorize and route
5. **Mobile App**: Native mobile reporting
6. **Integration**: Connect with external ticketing systems
7. **Predictive Analytics**: Predict issues before they occur

## Recent Updates

### October 10, 2025 - Auto-Close Logic Fix

**Critical Bug Fixes**:

1. **Order-Specific Stakeholder Counting**: Reports now correctly identify which users are actually involved in each specific order/service, rather than counting all users in the manager's ecosystem.

2. **Auto-Close Behavior**:
   - Reports transition: `open` → `resolved` → `closed`
   - Auto-close occurs when: ALL order participants acknowledge + report is resolved
   - Stakeholders identified from orders table: manager_id, customer_id, contractor_id, crew_id, assigned_warehouse
   - Creator excluded from acknowledgment count

3. **Cache Synchronization**: Reports and feedback now appear immediately after creation without requiring manual page refresh.

**Files Modified**:
- `apps/backend/server/domains/reports/repository.ts` - Fixed SQL column names and auto-close logic
- `apps/frontend/src/hubs/CustomerHub.tsx` - Added cache mutation
- `apps/frontend/src/hubs/ContractorHub.tsx` - Added cache mutation

**Technical Details**:
- Database queries corrected to use actual column names: `contractor_id`, `crew_id`, `manager_id`
- Stakeholder counting uses JavaScript `Set` to avoid duplicates
- Logging added: `[acknowledgeReport] Order stakeholders:` shows identified participants

---

*Last Updated: 2025-10-10*
*Version: 2.1 - Auto-close logic and cache fixes*
