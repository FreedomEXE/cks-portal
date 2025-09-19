# CKS REPORTS WORKFLOW DOCUMENTATION

## Overview
This document provides comprehensive documentation of the CKS Reports/Feedback system workflow, including submission processes, acknowledgment procedures, resolution flows, and role-based interactions.

## Report ID Format
All reports and feedback follow a consistent ID format: `{Type}{Number}`
- **RPT-###**: Report IDs for issues and problems (e.g., RPT-001, RPT-002)
- **FBK-###**: Feedback IDs for suggestions and compliments (e.g., FBK-001, FBK-002)

Examples:
- `RPT-001` - Report about service quality issue
- `FBK-001` - Feedback praising staff performance

## Report Types

### 1. Reports (Issues/Problems)
Reports are used to document problems, issues, or concerns that need attention and resolution.

**Who can create:**
- Customers
- Centers
- Contractors

**Purpose**: Document and track issues for resolution

**Categories**:
- Service Quality
- Product Quality
- Crew Performance
- Delivery Issues
- System Bug
- Safety Concern
- Other

### 2. Feedback (Suggestions/Compliments)
Feedback is used for positive recognition, suggestions, and constructive input.

**Who can create:**
- Crew members
- Managers
- Warehouses
- Customers (can create both)
- Centers (can create both)
- Contractors (can create both)

**Purpose**: Share suggestions, recognition, and improvement ideas

**Categories**:
- Service Excellence
- Staff Performance
- Process Improvement
- Product Suggestion
- System Enhancement
- Recognition
- Other

## Report Status States

### Primary Status Values
- **open**: Report is active and requires attention/resolution
- **closed**: Report has been resolved or feedback has been acknowledged

### Visual Indicators
- **Red Background**: Reports (issues/problems) - `#fee2e2`
- **Green Background**: Feedback (suggestions/compliments) - `#d1fae5`
- **Status Badges**:
  - Open reports: Dark red badge (`#991b1b`)
  - Open feedback: Green badge (`#10b981`)
  - Closed items: Gray badge (`#4b5563`)

## Workflow Process

### Report Submission Flow
1. **User creates report/feedback** through Create tab
2. **Ecosystem visibility**: All users in the ecosystem can view the report
3. **Acknowledgment process**: Users acknowledge they've seen the report
4. **Resolution process** (for reports only): Managers/Warehouses can resolve issues
5. **Archive**: Resolved items move to Archive tab

### Acknowledgment Process
- **Any ecosystem user** can acknowledge reports/feedback
- **Acknowledgment tracking**: System records who acknowledged and when
- **Visual display**: Acknowledgments shown as small badges with user ID and date
- **Purpose**: Confirms visibility and awareness across the ecosystem

### Resolution Process (Reports Only)
**Who can resolve**: Managers and Warehouses only

**Resolution requires**:
1. **Action Taken** (100 character limit): Brief description of what was done
2. **Resolution Notes** (300 character limit): Detailed explanation of the resolution

**Resolution workflow**:
1. Authorized user clicks "Resolve" button
2. Resolution form appears with side-by-side fields
3. Both fields must be completed to proceed
4. Upon submission, report status changes to "closed"
5. Resolution details become visible to all ecosystem users
6. Report automatically moves to Archive tab

## Tab Structure

### 1. All Reports (Default Tab)
- Shows all **open** reports and feedback in the ecosystem
- Provides ecosystem-wide visibility
- Includes search functionality
- Count badge shows number of open items

### 2. My Reports
- Shows reports/feedback submitted by the current user
- Includes both open and closed items
- Search functionality available
- Count badge shows user's total submissions

### 3. Create
- Form for submitting new reports or feedback
- Role-based restrictions on type selection
- Dynamic category options based on type
- Character limits and validation

### 4. Archive
- Shows all **closed** reports and feedback
- Historical record of resolved issues
- Search functionality available
- Count badge shows total archived items

## Role-Based Access Control

### Report Creation Rights
```
Contractors  ✓ Reports + Feedback
Customers    ✓ Reports + Feedback
Centers      ✓ Reports + Feedback
Crew         ✗ Feedback Only
Managers     ✗ Feedback Only
Warehouses   ✗ Feedback Only
```

### Resolution Rights
```
Managers     ✓ Can resolve reports
Warehouses   ✓ Can resolve reports
All Others   ✗ Cannot resolve
```

### Acknowledgment Rights
```
All Roles    ✓ Can acknowledge any report/feedback
```

## Report Card Display

### Collapsed State (Default)
Shows single-line colored header with:
- Expand arrow (rotates on click)
- Type badge (REPORT/FEEDBACK with appropriate color)
- Report ID (gray, neutral color)
- Title (gray, truncated with ellipsis)
- Status badge (colored based on type and status)

### Expanded State
Shows comprehensive details including:
- **Report Details section**: Submitted By, Date, Category, Related items, Tags
- **Description section**: Full description text
- **Acknowledgments section**: List of who acknowledged and when
- **Resolution section**: Shows resolution details for closed reports
- **Actions section**: Available actions based on user role and report status

### Color-Coded Headers
- **Reports**: Light red background (`#fee2e2`) matching OrderCard rejected status
- **Feedback**: Light green background (`#d1fae5`) matching OrderCard approved status

## Form Validation and Limits

### Create Form Requirements
**Required Fields**:
- Type (auto-set for restricted roles)
- Category (dynamic options based on type)
- Title (50% width, no character limit)
- Description (50% width, 500 character limit with counter)

**Optional Fields**:
- Tags (50% width, comma-separated)
- Related Service (50% width, CTRxxx-SRVxxx format)
- Related Order (50% width, order ID format)

### Resolution Form Requirements
**Both fields required**:
- Action Taken (50% width, 100 character limit)
- Resolution Notes (50% width, 300 character limit)

**Form Features**:
- Side-by-side layout prevents overlapping
- Live character counters
- No resize capability (`resize: none`)
- Validation prevents submission with empty fields

## Workflow Examples

### Example 1: Service Quality Report (Open)
**Report ID**: `RPT-001`
**Type**: Report
**Category**: Service Quality
**Submitted by**: CUS-001 (Customer)
**Status**: Open
**Title**: "Cleaning service incomplete"

**Workflow**:
1. Customer submits report about incomplete service
2. Crew member CRW-001 acknowledges (2025-09-18)
3. Manager MNG-001 acknowledges (2025-09-19)
4. **Next**: Manager or Warehouse can resolve

**Current State**:
- Visible to all ecosystem users
- Shows 2 acknowledgments
- "Resolve" button available to Manager/Warehouse
- Red background indicates this is a report

### Example 2: Staff Performance Feedback (Open)
**Report ID**: `FBK-001`
**Type**: Feedback
**Category**: Staff Performance
**Submitted by**: CUS-002 (Customer)
**Status**: Open
**Title**: "Excellent service from crew team"

**Workflow**:
1. Customer submits positive feedback about crew
2. Crew member CRW-001 acknowledges (2025-09-17)
3. Manager MNG-001 acknowledges (2025-09-18)
4. **Result**: Stays open for continued visibility (feedback doesn't require resolution)

**Current State**:
- Visible to all ecosystem users
- Shows 2 acknowledgments
- No resolve button (feedback doesn't get "resolved")
- Green background indicates this is feedback

### Example 3: Product Quality Report (Resolved)
**Report ID**: `RPT-002`
**Type**: Report
**Category**: Product Quality
**Submitted by**: CRW-002 (Crew)
**Status**: Closed
**Title**: "Defective cleaning supplies received"

**Resolution Details**:
- **Resolved by**: WHS-001 (Warehouse)
- **Resolved date**: 2025-09-17
- **Action taken**: "Replaced entire batch with new stock"
- **Notes**: "Contacted supplier about quality control issue. Implemented additional testing procedures for incoming products."

**Workflow**:
1. Crew reports defective products
2. Warehouse acknowledges and investigates
3. Warehouse resolves with replacement and process improvement
4. Report moves to Archive tab
5. Resolution visible to all users for transparency

### Example 4: Process Improvement Feedback (Open)
**Report ID**: `FBK-002`
**Type**: Feedback
**Category**: Process Improvement
**Submitted by**: MNG-001 (Manager)
**Status**: Open
**Title**: "Suggestion for inventory tracking"

**Description**: "It would be helpful to have real-time inventory levels visible in the ordering system to avoid requesting out-of-stock items."

**Current State**:
- Manager provides constructive feedback about system improvement
- Warehouse acknowledges suggestion (2025-09-15)
- Remains open for visibility and potential implementation
- May influence future system updates

## Search and Filtering

### Search Functionality
Available on all tabs except Create:
- **Search by**: Title, Description, Category, Submitted By
- **Case insensitive**: Flexible search terms
- **Real-time filtering**: Results update as you type
- **No results state**: Clear messaging when no matches found

### Filter Criteria
Reports and feedback are automatically filtered by:
- **Tab selection**: All Reports (open), My Reports (user's items), Archive (closed)
- **User scope**: Only shows items relevant to user's ecosystem
- **Status visibility**: Open vs closed items separated by tabs

## Data Model

### ReportFeedback Interface
```typescript
interface ReportFeedback {
  id: string;                    // RPT-### or FBK-###
  type: 'report' | 'feedback';   // Determines available actions
  category: string;              // Dynamic based on type
  tags?: string[];               // Optional comma-separated tags
  title: string;                 // Brief description
  description: string;           // Detailed information
  submittedBy: string;           // User ID who created it
  submittedDate: string;         // Creation date
  status: 'open' | 'closed';     // Current state
  relatedService?: string;       // Optional service reference
  relatedOrder?: string;         // Optional order reference
  acknowledgments: Array<{       // Tracking who has seen it
    userId: string;
    date: string;
  }>;
  resolution?: {                 // Only for resolved reports
    resolvedBy: string;
    resolvedDate: string;
    actionTaken: string;
    notes: string;
  };
}
```

## Role-Specific Views

### Customer View
- Can create reports and feedback
- Sees all ecosystem reports in "All Reports"
- Can acknowledge any report/feedback
- Cannot resolve reports
- Type dropdown available with both options

### Crew View
- Can only create feedback (type field read-only)
- Sees all ecosystem reports in "All Reports"
- Can acknowledge any report/feedback
- Cannot resolve reports
- Categories limited to feedback options

### Manager View
- Can only create feedback (type field read-only)
- Sees all ecosystem reports in "All Reports"
- Can acknowledge any report/feedback
- **Can resolve reports** with action/notes
- Categories limited to feedback options

### Warehouse View
- Can only create feedback (type field read-only)
- Sees all ecosystem reports in "All Reports"
- Can acknowledge any report/feedback
- **Can resolve reports** with action/notes
- Categories limited to feedback options

### Contractor View
- Can create reports and feedback
- Sees all ecosystem reports in "All Reports"
- Can acknowledge any report/feedback
- Cannot resolve reports
- Type dropdown available with both options

### Center View
- Can create reports and feedback
- Sees all ecosystem reports in "All Reports"
- Can acknowledge any report/feedback
- Cannot resolve reports
- Type dropdown available with both options

## Visual Design Elements

### Color Consistency
Matches OrderCard design system:
- **Report red**: `#fee2e2` (background), `#991b1b` (text/badges)
- **Feedback green**: `#d1fae5` (background), `#10b981` (text/badges)
- **Neutral gray**: `#4b5563` (closed status), `#6b7280` (labels)

### Interactive Elements
- **Hover effects**: 2px translateX with subtle shadow on card headers
- **Expand animation**: Smooth arrow rotation (0° to 90°)
- **Button states**: Clear hover and disabled states
- **Form feedback**: Character counters and validation messages

### Layout Patterns
- **Grid systems**: Consistent 1fr 1fr layouts for form fields
- **Section styling**: Gray backgrounds (`#f9fafb`) for organized content
- **Typography hierarchy**: 12px labels, 14px content, uppercase section headers
- **Spacing**: 16px gaps, 12px section padding for consistency

## Integration Points

### Service ID Format
Related services use format: `CTRxxx-SRVxxx`
- **CTRxxx**: Contractor ID (e.g., CTR001, CTR002)
- **SRVxxx**: Service number (e.g., SRV001, SRV002)
- Example: `CTR001-SRV001`

### Order ID References
Related orders can reference any valid order ID:
- Service orders: `CTRxxx-ORD-SRVxxx`
- Product orders: `USRxxx-ORD-PRDxxx`

### User ID References
All user IDs follow established CKS format:
- Customers: `CUS-xxx`
- Crew: `CRW-xxx`
- Managers: `MNG-xxx`
- Warehouses: `WHS-xxx`
- Centers: `CNT-xxx`
- Contractors: `CTR-xxx`

## Analytics and Metrics

### Trackable Metrics
1. **Report volume**: Reports vs feedback ratio
2. **Resolution time**: Average time from submission to resolution
3. **Category trends**: Most common issue/feedback types
4. **Acknowledgment rates**: How quickly items are acknowledged
5. **User participation**: Who submits most reports/feedback
6. **Resolution effectiveness**: Re-occurrence of similar issues

### Future Dashboard Ideas
- **Trend analysis**: Monthly/weekly submission patterns
- **Heat maps**: Problem areas and improvement suggestions
- **Performance indicators**: Resolution time by category
- **User engagement**: Acknowledgment and participation rates

## Future Enhancements

### Phase 1 Improvements
1. **Email notifications**: Auto-notify on acknowledgments/resolutions
2. **File attachments**: Screenshots and documents for reports
3. **Rich text editing**: Formatted descriptions
4. **Bulk acknowledgments**: Acknowledge multiple items at once

### Phase 2 Features
1. **Mobile app integration**: Submit and view reports on mobile
2. **API endpoints**: Integration with external systems
3. **Advanced analytics**: Comprehensive reporting dashboard
4. **Workflow automation**: Auto-assignment based on categories

### Phase 3 Enhancements
1. **AI categorization**: Automatic category suggestion
2. **Sentiment analysis**: Mood tracking in feedback
3. **Predictive analytics**: Identify potential issues early
4. **Integration with orders**: Direct linking to related orders/services

## Testing Scenarios

### Report Creation Flow
1. **Customer creates report**:
   - Verify type dropdown shows both options
   - Verify category options change when switching types
   - Test character limits and validation
   - Verify submission creates proper ID format

2. **Crew attempts to create report**:
   - Verify type field is read-only showing "Feedback"
   - Verify only feedback categories available
   - Test form submission creates FBK-### ID

### Acknowledgment Flow
1. **Multiple users acknowledge same item**:
   - Verify acknowledgments appear in chronological order
   - Test duplicate acknowledgment prevention
   - Verify acknowledgment badges display correctly

### Resolution Flow
1. **Manager resolves report**:
   - Verify resolve button only appears for reports
   - Test character limits in resolution form
   - Verify both fields required for submission
   - Confirm report moves to Archive after resolution

2. **Non-authorized user attempts resolution**:
   - Verify no resolve button appears
   - Confirm read-only access to resolution details

### Search and Filter Tests
1. **Search functionality**:
   - Test partial matches in title and description
   - Verify case-insensitive search
   - Test search across categories and users

2. **Tab filtering**:
   - Verify correct item counts in tab badges
   - Test My Reports shows only user's submissions
   - Confirm Archive shows only closed items

## Error Handling

### Form Validation
- **Required field validation**: Clear error messages
- **Character limit enforcement**: Prevent over-limit input
- **Category validation**: Ensure category matches type
- **Service ID format**: Validate CTRxxx-SRVxxx pattern

### Edge Cases
- **Simultaneous acknowledgments**: Handle race conditions
- **Long descriptions**: Graceful text wrapping
- **Special characters**: Proper encoding/display
- **Network failures**: Retry mechanisms and user feedback

## Notes for Developers

### Key Implementation Details
1. **Ecosystem scoping**: All queries filtered by user's ecosystem
2. **Role-based UI**: Dynamic form rendering based on user permissions
3. **Real-time updates**: Consider WebSocket integration for live acknowledgments
4. **Data consistency**: Ensure acknowledgment timestamps are accurate
5. **Security**: Validate user permissions on backend for all operations

### Performance Considerations
1. **Pagination**: Implement for large report lists
2. **Caching**: Cache category lists and user permissions
3. **Search optimization**: Index commonly searched fields
4. **Loading states**: Provide feedback during async operations

---

*Last Updated: 2025-09-19*
*Version: 1.0*