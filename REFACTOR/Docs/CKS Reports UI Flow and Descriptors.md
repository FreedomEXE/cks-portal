# CKS Reports & Feedback UI Flow and Descriptors

**Document Version:** 1.0  
**Last Updated:** September 12, 2025  
**Purpose:** Comprehensive specification for CKS reports and feedback system architecture, UI flows, and business logic

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Report Types & Structure](#report-types--structure)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Report Lifecycle](#report-lifecycle)
5. [UI Layout & Functionality](#ui-layout--functionality)
6. [Report ID Structure](#report-id-structure)
7. [Cross-Role Interactions](#cross-role-interactions)
8. [Ecosystem Hierarchy](#ecosystem-hierarchy)
9. [Technical Implementation](#technical-implementation)
10. [Business Rules](#business-rules)

---

## System Overview

The CKS reports and feedback system facilitates issue tracking, communication, and problem resolution across six primary user types:
- **Managers** - System-wide oversight, view/resolve all reports and feedback
- **Contractors** - Create reports about work environment, primarily viewed by managers
- **Customers** - Create reports about centers and crew, view reports involving them
- **Centers** - Create reports about crew, customers, and contractors under their management
- **Crews** - View-only access to reports and feedback involving them
- **Warehouses** - View and resolve reports/feedback related to operational items (orders, deliveries, inventory)

*Note: Admin role will be added in future iterations for system-wide administration*

### Core Principles
1. **Dual System**: Reports (serious/action-required) and Feedback (general/lighthearted)
2. **Ecosystem Hierarchy**: Users can only create reports about entities below them in the hierarchy
3. **Role-Based Visibility**: Users see only reports/feedback they're authorized to view
4. **Resolution Tracking**: Complete audit trail from creation to resolution

### Report vs Feedback Distinction
- **Reports**: Serious issues requiring action (safety concerns, performance issues, violations)
- **Feedback**: General communication (compliments, suggestions, observations)

---

## Report Types & Structure

### 1. Reports
**Purpose:** Serious issues requiring investigation and resolution  
**ID Format:** `RPT-[XXX]`  
**Examples:** `RPT-001`, `RPT-045`

**Key Fields:**
- `report_id`: Unique identifier
- `title`: Brief description of issue
- `type`: Category (safety, performance, policy, operational, etc.)
- `severity`: Low/Medium/High/Critical
- `status`: Open/In Progress/Resolved/Closed
- `created_by_role`: Reporter's role
- `created_by_id`: Reporter's ID
- `about_type`: What entity is being reported (crew, customer, center, etc.)
- `about_id`: Specific entity ID
- `description`: Detailed issue description
- `resolution_notes`: Notes added when resolved

### 2. Feedback
**Purpose:** General communication and observations  
**ID Format:** `FDB-[XXX]`  
**Examples:** `FDB-001`, `FDB-023`

**Key Fields:**
- `feedback_id`: Unique identifier
- `title`: Brief subject line
- `kind`: Type (compliment, suggestion, observation, concern)
- `status`: Open/Acknowledged/Resolved (optional)
- `created_by_role`: Sender's role
- `created_by_id`: Sender's ID
- `about_type`: What entity feedback is about
- `about_id`: Specific entity ID
- `message`: Feedback content
- `resolution_notes`: Response when addressed

---

## User Roles & Permissions

### Manager Permissions
**Can Create:**
- Reports: ❌ (System oversight role)
- Feedback: ❌ (System oversight role)

**Can View:**
- All reports system-wide: ✅
- All feedback system-wide: ✅
- Complete ecosystem visibility: ✅

**Can Resolve:**
- Any report: ✅
- Any feedback: ✅
- System-wide resolution authority: ✅

**Special Actions:**
- Resolution modal with notes: ✅
- Status change capabilities: ✅
- Complete audit trail access: ✅

### Contractor Permissions
**Can Create:**
- Reports about work environment: ✅ (viewed by managers)
- Feedback about work environment: ✅ (viewed by managers)

**Can View:**
- Own reports/feedback: ✅
- Reports/feedback about them: ✅
- Other contractor reports: ❌

**Can Resolve:**
- Reports: ❌
- Feedback: ❌

**Navigation:**
- Create Report/Feedback tabs: ✅
- My Reports/Feedback tabs: ✅
- View All (reports/feedback involving them): ✅

### Customer Permissions
**Can Create:**
- Reports about centers: ✅ (ecosystem hierarchy)
- Reports about crew: ✅ (ecosystem hierarchy)
- Feedback about centers: ✅
- Feedback about crew: ✅

**Can View:**
- Own reports/feedback: ✅
- Reports/feedback involving them: ✅
- Reports/feedback about entities under them: ✅

**Can Resolve:**
- Reports: ❌
- Feedback: ❌

**Navigation:**
- Create Report/Feedback with entity selection: ✅
- My Reports/Feedback tabs: ✅
- View All with toggle: ✅

### Center Permissions
**Can Create:**
- Reports about crew: ✅ (direct management)
- Reports about customers: ✅ (service relationship)
- Reports about contractors: ✅ (work relationship)
- Feedback about crew/customers/contractors: ✅

**Can View:**
- Own reports/feedback: ✅
- Reports/feedback involving them: ✅
- Reports/feedback about entities under management: ✅

**Can Resolve:**
- Reports: ❌
- Feedback: ❌

**Navigation:**
- Create Report/Feedback with comprehensive entity selection: ✅
- My Reports/Feedback tabs: ✅
- View All with toggle: ✅

### Crew Permissions
**Can Create:**
- Reports: ❌ (View-only role)
- Feedback: ❌ (View-only role)

**Can View:**
- Reports/feedback about them: ✅
- Reports/feedback involving them: ✅

**Can Resolve:**
- Reports: ❌
- Feedback: ❌

**Navigation:**
- Reports/Feedback toggle view: ✅
- Status filtering: ✅
- Read-only interface: ✅

### Warehouse Permissions
**Can Create:**
- Reports: ❌ (Operational focus)
- Feedback: ❌ (Operational focus)

**Can View:**
- Reports/feedback about operational items: ✅ (orders, deliveries, inventory)
- Reports/feedback involving warehouse operations: ✅

**Can Resolve:**
- Operational reports: ✅
- Operational feedback: ✅

**Navigation:**
- View/resolve interface: ✅
- Status filtering: ✅
- Resolution capabilities: ✅

---

## Report Lifecycle

### Report Lifecycle
```
1. CREATED (by authorized user)
   ↓
2. OPEN (visible to authorized viewers)
   ↓
3. IN_PROGRESS (being investigated/addressed)
   ↓
4. RESOLVED (resolution notes added)
   ↓
5. CLOSED (final status, archived)

Alternative paths:
- DISMISSED (determined not actionable)
- ESCALATED (moved to higher authority)
```

### Feedback Lifecycle
```
1. CREATED (by authorized user)
   ↓
2. OPEN (visible to authorized viewers)
   ↓
3. ACKNOWLEDGED (reviewed by recipient)
   ↓
4. RESOLVED (response/action taken)

Alternative paths:
- NO_ACTION_NEEDED (informational only)
- ESCALATED (requires management attention)
```

---

## UI Layout & Functionality

### Reports Tab Structure by Role

#### Manager Interface
**Layout:** Single view with resolution capabilities
- **All Reports Section**: System-wide report visibility
- **All Feedback Section**: System-wide feedback visibility
- **Resolution Modal**: Complete resolution interface with notes
- **Filtering**: By status, severity, role, date range
- **Features**: Status updates, resolution tracking, export capabilities

#### Contractor Interface
**Layout:** Three-tab structure
1. **Create Report Tab**: Form for reporting work environment issues
2. **Create Feedback Tab**: Form for general work environment feedback
3. **My Reports Tab**: Own reports with status tracking
4. **My Feedback Tab**: Own feedback with status tracking
5. **View All**: Reports/feedback involving them (toggle view)

**Form Fields (Create Report):**
- Title: Text input
- Type: Dropdown (safety, equipment, policy, etc.)
- Severity: Dropdown (low, medium, high)
- Description: Textarea
- Location: Text input (optional)

#### Customer Interface
**Layout:** Five-tab structure
1. **Create Report Tab**: 
   - Entity selection (center/crew dropdown)
   - Report form with entity-specific context
2. **Create Feedback Tab**:
   - Entity selection (center/crew dropdown)  
   - Feedback form with kind selection
3. **My Reports Tab**: Own reports by entity
4. **My Feedback Tab**: Own feedback by entity
5. **View All Tab**: Toggle between reports/feedback, simplified display

**Entity Selection:**
- Center dropdown: Available centers
- Crew dropdown: Available crew members
- Dynamic form updates based on selection

#### Center Interface
**Layout:** Five-tab structure (identical to customer)
1. **Create Report Tab**:
   - Entity selection (crew/customer/contractor dropdown)
   - Comprehensive form with role-specific fields
2. **Create Feedback Tab**:
   - Entity selection (crew/customer/contractor dropdown)
   - Feedback form with context
3. **My Reports Tab**: Own reports organized by entity type
4. **My Feedback Tab**: Own feedback organized by entity type
5. **View All Tab**: Toggle view with minimal display format

**Advanced Features:**
- Bulk creation capabilities
- Template suggestions based on entity type
- Historical pattern recognition

#### Crew Interface
**Layout:** Single view with toggle
- **Reports/Feedback Toggle**: Switch between viewing reports and feedback
- **Status Filter**: All/Open/In Progress/Resolved/Acknowledged
- **Read-Only Cards**: Display involving crew member
- **No Creation Capabilities**: View-only role

**Display Format:**
- Card-based layout with essential information
- Color-coded status indicators
- Resolution notes visibility when available
- Creator and date information

#### Warehouse Interface
**Layout:** Single view with resolve capabilities
- **Reports/Feedback Toggle**: Switch between types
- **Status Filter**: Focus on actionable items
- **Resolution Interface**: For operational items
- **Operational Focus**: Orders, deliveries, inventory, services

**Resolution Features:**
- Resolution modal for operational reports
- Status update capabilities
- Notes and action tracking
- Integration with operational systems

---

## Report ID Structure

### Format: `[TYPE]-[NUMBER]`

#### Components Breakdown:

**TYPE (3 chars):**
- `RPT` = Report (serious issues)
- `FDB` = Feedback (general communication)

**NUMBER (3 digits):**
- Sequential numbering: 001, 002, 003, etc.
- Global sequence (not per-user or per-role)
- Zero-padded for consistent formatting

#### Examples with Context:
- `RPT-001` = First report in system
- `FDB-023` = Twenty-third feedback item
- `RPT-045` = Forty-fifth report (serious issue)

### ID Evolution Through Lifecycle:
- **ID remains constant** throughout entire lifecycle
- **Status tracking** via separate status history table
- **Resolution tracking** via resolution notes and timestamps
- **Audit trail** maintains complete history

---

## Cross-Role Interactions

### Customer → Center Report Flow

#### Report Creation Example:
1. **Customer Creates:** `RPT-012` about center performance
   - Customer UI: Report appears in "My Reports" (Open)
   - Center UI: Report appears in "View All" (involving them)
   - Manager UI: Report appears in system-wide view (Open)

2. **Manager Reviews:**
   - Manager UI: Updates status to "In Progress"
   - All UIs: Status updates reflected immediately
   - Investigation begins

3. **Manager Resolves:**
   - Manager UI: Resolution modal with notes
   - All UIs: Status changes to "Resolved" with notes visible
   - Resolution timestamp recorded

### Center → Crew Report Flow

#### Report Creation Example:
1. **Center Creates:** `RPT-025` about crew safety violation
   - Center UI: Report in "My Reports" (Open)
   - Crew UI: Report visible in their view (involving them)
   - Manager UI: Report in system-wide view (Open)

2. **Manager Investigation:**
   - Status updates to "In Progress"
   - Resolution process initiated
   - All parties notified of status changes

### Contractor Feedback Flow

#### Feedback Creation Example:
1. **Contractor Creates:** `FDB-008` about work environment
   - Contractor UI: Feedback in "My Feedback" (Open)
   - Manager UI: Feedback visible for review
   - No other roles see contractor feedback

2. **Manager Acknowledges:**
   - Status updates to "Acknowledged"
   - Optional response notes added
   - Contractor sees acknowledgment

---

## Ecosystem Hierarchy

### Hierarchy Structure
```
Manager (Top)
├── All entities (system-wide view)
├── Can resolve any report/feedback
└── Complete ecosystem oversight

Customer
├── Can report about: Centers, Crew
├── Cannot report about: Other customers, contractors, managers
└── Ecosystem position: Service requester

Center  
├── Can report about: Crew (direct management)
├── Can report about: Customers (service relationship)
├── Can report about: Contractors (work coordination)
└── Ecosystem position: Service coordinator

Contractor
├── Can report about: Work environment (to managers)
├── Cannot report about: Other entities
└── Ecosystem position: Service provider

Crew
├── View-only access
├── Cannot create reports/feedback
└── Ecosystem position: Managed service provider

Warehouse
├── Operational focus only
├── Can resolve operational reports/feedback
└── Ecosystem position: Logistics provider
```

### Business Logic Rules:
1. **Upward Reporting Only**: Cannot report about entities above in hierarchy
2. **Lateral Restrictions**: Limited lateral reporting (center ↔ customer specific cases)
3. **Downward Visibility**: Can report about entities below in management chain
4. **Resolution Authority**: Higher levels can resolve lower-level issues

---

## Technical Implementation

### Database Schema Considerations

#### Reports Table:
```sql
reports {
  report_id VARCHAR(10) PRIMARY KEY -- RPT-001
  title VARCHAR(255)
  type VARCHAR(50) -- safety, performance, operational
  severity ENUM('low', 'medium', 'high', 'critical')
  status VARCHAR(20) -- open, in_progress, resolved, closed
  created_by_role VARCHAR(20)
  created_by_id VARCHAR(10)
  about_type VARCHAR(20) -- crew, customer, center, etc.
  about_id VARCHAR(10)
  description TEXT
  resolution_notes TEXT
  resolved_by VARCHAR(10)
  created_at TIMESTAMP
  resolved_at TIMESTAMP
}
```

#### Feedback Table:
```sql
feedback {
  feedback_id VARCHAR(10) PRIMARY KEY -- FDB-001
  title VARCHAR(255)
  kind VARCHAR(50) -- compliment, suggestion, concern
  status VARCHAR(20) -- open, acknowledged, resolved
  created_by_role VARCHAR(20)
  created_by_id VARCHAR(10)
  about_type VARCHAR(20)
  about_id VARCHAR(10)
  message TEXT
  resolution_notes TEXT
  resolved_by VARCHAR(10)
  created_at TIMESTAMP
  resolved_at TIMESTAMP
}
```

#### Status History Tracking:
```sql
status_history {
  id INT PRIMARY KEY AUTO_INCREMENT
  item_id VARCHAR(10) -- RPT-001 or FDB-001
  item_type ENUM('report', 'feedback')
  old_status VARCHAR(20)
  new_status VARCHAR(20)
  changed_by VARCHAR(10)
  changed_at TIMESTAMP
  notes TEXT
}
```

### API Endpoints Structure:

#### Report Management:
```
GET /api/reports -- Get reports for current user role
POST /api/reports -- Create new report
PUT /api/reports/{id}/status -- Update report status
PUT /api/reports/{id}/resolve -- Resolve report with notes
GET /api/reports/{id}/history -- Get status history
```

#### Feedback Management:
```
GET /api/feedback -- Get feedback for current user role
POST /api/feedback -- Create new feedback
PUT /api/feedback/{id}/acknowledge -- Acknowledge feedback
PUT /api/feedback/{id}/resolve -- Resolve feedback with notes
```

#### Role-Specific Endpoints:
```
GET /api/manager/all-reports -- System-wide report view
GET /api/customer/my-reports -- Customer's created reports
GET /api/center/resolution-queue -- Center's actionable items
GET /api/crew/involving-me -- Reports/feedback involving crew
GET /api/warehouse/operational -- Operational reports/feedback
```

---

## Business Rules

### Creation Rules
1. **Hierarchy Enforcement**: Users can only report about entities below them
2. **Role Restrictions**: Some roles cannot create reports/feedback
3. **Entity Validation**: Must select valid entity when creating
4. **Content Requirements**: Title and description/message required

### Visibility Rules
1. **Creator Always Sees**: Own reports/feedback always visible
2. **Subject Always Sees**: Entities being reported about can see reports
3. **Hierarchy Visibility**: Higher roles see lower-level items
4. **Resolution Authority**: Only certain roles can resolve

### Resolution Rules
1. **Manager Authority**: Managers can resolve any report/feedback
2. **Warehouse Operational**: Warehouses can resolve operational items
3. **Resolution Notes**: Required when resolving items
4. **Status Transitions**: Defined progression through statuses

### Notification Rules
1. **Status Changes**: All involved parties notified
2. **New Items**: Relevant parties notified of creation
3. **Resolutions**: Creator and subject notified of resolution
4. **Escalations**: Management notified of critical items

---

## Status Color Coding

### Reports:
- 🔵 **Open** - Blue (newly created, awaiting review)
- 🟡 **In Progress** - Yellow (being investigated/addressed)  
- 🟢 **Resolved** - Green (resolution completed with notes)
- 🟠 **Closed** - Orange (archived, final status)
- 🔴 **Critical** - Red (high severity, immediate attention)

### Feedback:
- 🔵 **Open** - Blue (newly created, awaiting acknowledgment)
- 🟡 **Acknowledged** - Yellow (reviewed, no action needed)
- 🟢 **Resolved** - Green (response provided or action taken)
- ⚪ **No Action Needed** - Gray (informational only)

### Severity Indicators (Reports Only):
- 🟢 **Low** - Green background
- 🟡 **Medium** - Yellow background  
- 🟠 **High** - Orange background
- 🔴 **Critical** - Red background

---

## Error Handling

### Common Error Scenarios:
1. **Unauthorized Creation** → Hierarchy violation error with explanation
2. **Invalid Entity Selection** → Entity not found or not accessible error
3. **Missing Required Fields** → Form validation with specific field errors
4. **Resolution Without Authority** → Permission denied with role explanation
5. **System Errors** → Graceful fallback with error logging

### User Notifications:
- **Real-time Status Updates** → WebSocket notifications for status changes
- **Creation Confirmations** → Success messages with item ID
- **Resolution Notifications** → All parties notified when items resolved
- **Error Messages** → Clear, actionable error descriptions

---

## View All Section Simplification

### Simplified Display Format:
All "View All" sections use minimal information display:

**Reports Display:**
- Report ID (bold, clickable)
- Title
- Creator role and status
- Format: `RPT-001 - Safety Concern | Created by: center | Status: Open`

**Feedback Display:**
- Feedback ID (bold, clickable)  
- Title
- Creator role and status
- Format: `FDB-005 - Great Service | Created by: customer | Status: Acknowledged`

### Toggle Functionality:
- Single section with toggle buttons
- "Reports (X)" and "Feedback (Y)" with counts
- No stacking - one type visible at a time
- Clean, minimal styling without complex UI

---

## Future Considerations

### Planned Enhancements:
1. **AI-powered Categorization** → Automatic report type and severity detection
2. **Pattern Recognition** → Identify recurring issues and suggest preventive measures  
3. **Integration with Orders** → Link reports to specific orders/services
4. **Mobile Notifications** → Push notifications for critical reports
5. **Analytics Dashboard** → Trend analysis and reporting metrics

### Scalability Considerations:
1. **Database Partitioning** → Partition by date ranges for historical data
2. **Caching Strategies** → Cache frequently accessed reports and user permissions
3. **API Rate Limiting** → Prevent abuse of creation/resolution endpoints
4. **Search Optimization** → Full-text search for report/feedback content

---

**Document End**

*This document serves as the authoritative reference for CKS reports and feedback system implementation. All UI components, API endpoints, and business logic should align with the specifications outlined above.*