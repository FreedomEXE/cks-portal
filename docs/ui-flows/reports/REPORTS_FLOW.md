# CKS Reports & Feedback Flow Documentation

## Overview
The CKS reports and feedback system facilitates issue tracking, communication, and problem resolution across the entire ecosystem. It operates as a dual system: Reports for serious issues and Feedback for general communication.

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
- Customers
- Centers
- Contractors

**Cannot Create (View Only):**
- Crew members
- Managers (resolve only)
- Warehouses (operational items only)

### Feedback (Suggestions/Compliments)
**Can Create:**
- All roles

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

---

*Last Updated: 2025-09-28*
*Version: 2.0 - Consolidated from multiple sources*