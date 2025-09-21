# CKS ADMIN WORKFLOW DOCUMENTATION

## Overview
This document provides comprehensive documentation of the CKS Admin system workflow, including user creation, assignment, and archive management processes. The Admin system manages all user types and data entities within the CKS ecosystem with role-based access control and real-time Directory synchronization.

## Admin ID Format
All admin-managed entities follow established CKS ID formats based on type:

### User ID Formats
- **MGR-###**: Manager IDs (e.g., MGR-001, MGR-002)
- **CON-###**: Contractor IDs (e.g., CON-001, CON-002)
- **CUS-###**: Customer IDs (e.g., CUS-001, CUS-002)
- **CTR-###**: Center IDs (e.g., CTR-001, CTR-002)
- **CRW-###**: Crew IDs (e.g., CRW-001, CRW-002)
- **WH-###**: Warehouse IDs (e.g., WH-001, WH-002)

### Other Entity ID Formats
- **SRV-###**: Service IDs (e.g., SRV-001, SRV-002)
- **PRD-###**: Product IDs (e.g., PRD-001, PRD-002)
- **TRN-###**: Training IDs (e.g., TRN-001, TRN-002)
- **RPT-###**: Report IDs (e.g., RPT-001, RPT-002)
- **FBK-###**: Feedback IDs (e.g., FBK-001, FBK-002)

## Admin Section Types

### 1. Create Section
The Create section provides forms for creating new users and entities across all data types in the CKS ecosystem.

**Purpose**: Streamlined creation of users with role-specific fields and validation

**Access**: Admin users only

**Features**:
- Role-based form fields
- Color-coded interfaces matching role themes
- Hierarchical relationship management
- Real-time Directory updates

### 2. Assign Section
The Assign section manages hierarchical assignment of users within the CKS organizational structure.

**Purpose**: Maintain proper user hierarchy through systematic assignment management

**Access**: Admin users only

**Features**:
- Unassigned bucket management with real-time counts
- Hierarchical assignment flow (Manager → Contractor → Customer → Center → Crew)
- Top-down cascade logic for deletions
- Role-specific assignment interfaces

**Assignment Hierarchy**:
1. **Contractors** → Assign to Manager
2. **Customers** → Assign to Contractor
3. **Centers** → Assign to Customer
4. **Crew** → Assign to Center

**Auto-Assignment Rules**:
- New users automatically go to unassigned bucket (except Managers)
- When superior is deleted, all subordinates become unassigned
- Managers are exempt from assignment (they manage others)

### 3. Archive Section
The Archive section provides soft delete functionality with restore capabilities for all entity types.

**Purpose**: Data preservation with reversible removal from active Directory

**Access**: Admin users only

**Features**:
- Soft delete (data preserved)
- Restore functionality
- Archive reason tracking
- Audit trail maintenance

## User Creation Workflows

### Manager Creation Workflow
**Form Fields**:
- **First Name** (required, 300px width)
- **Last Name** (required, 300px width)
- **Email** (required, 300px width)
- **Phone** (required, 300px width)
- **Manager Role** (dropdown: Strategic, Operations, Field, Development)
- **Reports To** (conditional dropdown based on hierarchy)
- **Access Level** (dropdown: Full, Limited, View-Only)
- **Department** (dropdown: Operations, Development, Strategic, Support)

**Business Rules**:
- Manager ID auto-generated (MNG-###)
- Strategic managers report to CEO only
- Operations managers can report to Strategic or CEO
- Field managers report to Operations or Strategic
- Development managers report to Strategic or CEO
- Reports To dropdown populated based on role selection

**Color Theme**: Blue (#3b82f6)

### Contractor Creation Workflow
**Form Fields**:
- **Company Name** (required, 300px width)
- **Contact Person** (required, 300px width)
- **Email** (required, 300px width)
- **Phone** (required, 300px width)
- **Business License** (required, 300px width)
- **Service Types** (multi-select: Cleaning, Maintenance, Repair, Installation)
- **Coverage Area** (text area, 300px width)
- **Rate Structure** (dropdown: Hourly, Project-Based, Contract)

**Business Rules**:
- Contractor ID auto-generated (CTR-###)
- Business license must be valid format
- Service types determine available assignment categories
- Coverage area affects assignment eligibility

**Color Theme**: Green (#10b981)

### Customer Creation Workflow
**Form Fields**:
- **First Name** (required, 300px width)
- **Last Name** (required, 300px width)
- **Company** (optional, 300px width)
- **Email** (required, 300px width)
- **Phone** (required, 300px width)
- **Address** (required, 300px width)
- **Customer Type** (dropdown: Residential, Commercial, Industrial)
- **Preferred Contact** (dropdown: Email, Phone, Text)

**Business Rules**:
- Customer ID auto-generated (CUS-###)
- Address validation for service area coverage
- Customer type affects available services
- Preferred contact method stored for communications

**Color Theme**: Yellow (#eab308)

### Center Creation Workflow
**Form Fields**:
- **Center Name** (required, 300px width)
- **Location** (required, 300px width)
- **Manager** (dropdown of available managers)
- **Capacity** (required, number input)
- **Services Offered** (multi-select checkboxes)
- **Operating Hours** (time ranges)
- **Contact Email** (required, 300px width)
- **Contact Phone** (required, 300px width)

**Business Rules**:
- Center ID auto-generated (CNT-###)
- Manager assignment creates reporting relationship
- Capacity affects scheduling algorithms
- Services offered determine assignment eligibility

**Color Theme**: Orange (#f59e0b)

### Crew Creation Workflow
**Form Fields**:
- **First Name** (required, 300px width)
- **Last Name** (required, 300px width)
- **Email** (required, 300px width)
- **Phone** (required, 300px width)
- **Specializations** (multi-select: General Cleaning, Deep Cleaning, Maintenance, Repair)
- **Assigned Center** (dropdown of available centers)
- **Shift Preference** (dropdown: Day, Evening, Night, Flexible)
- **Experience Level** (dropdown: Entry, Intermediate, Advanced, Senior)

**Business Rules**:
- Crew ID auto-generated (CRW-###)
- Specializations affect task assignment
- Center assignment required for scheduling
- Experience level determines task complexity eligibility

**Color Theme**: Red (#ef4444)

### Warehouse Creation Workflow
**Form Fields**:
- **Warehouse Name** (required, 300px width)
- **Location** (required, 300px width)
- **Manager** (dropdown of available managers)
- **Storage Capacity** (required, number input)
- **Specialization** (dropdown: General Supplies, Equipment, Chemicals, Tools)
- **Operating Hours** (time ranges)
- **Contact Email** (required, 300px width)
- **Contact Phone** (required, 300px width)

**Business Rules**:
- Warehouse ID auto-generated (WHS-###)
- Manager assignment creates reporting relationship
- Storage capacity affects inventory limits
- Specialization determines product categories handled

**Color Theme**: Purple (#8b5cf6)

## Tab Navigation Structure

### Admin Hub Main Tabs
1. **Directory**: View and search all users/entities
2. **Create**: User and entity creation forms
3. **Assign**: Assignment management interface
4. **Archive**: Soft delete and restore management

### Universal Sub-Tabs (Create, Assign, Archive)
All three main sections use consistent sub-tab navigation:

1. **Managers** (Blue #3b82f6)
2. **Contractors** (Green #10b981)
3. **Customers** (Yellow #eab308)
4. **Centers** (Orange #f59e0b)
5. **Crew** (Red #ef4444)
6. **Warehouses** (Purple #8b5cf6)
7. **Services** (Cyan #06b6d4)
8. **Orders** (Brown #92400e)
9. **Products** (Gray #374151)
10. **Training & Procedures** (Pink #ec4899)
11. **Reports & Feedback** (Gray #6b7280)

## Assignment System Workflow

### Smart Assignment Rules
**Hierarchy Respect**:
- Managers cannot be assigned under their subordinates
- Crew must be assigned to valid centers
- Contractors must operate within coverage areas
- Services require appropriate skill matches

**Conflict Detection**:
- Double-booking prevention
- Skill requirement validation
- Geographic feasibility checks
- Capacity limit enforcement

**Assignment Types**:
1. **User-to-User**: Manager assignments, reporting structures
2. **User-to-Entity**: Crew to centers, managers to warehouses
3. **Entity-to-Entity**: Services to centers, products to warehouses
4. **Project Assignments**: Multi-user project teams
5. **Temporary Assignments**: Short-term role changes

### Assignment Process Flow
1. **Select Assignment Type**: Choose from available assignment categories
2. **Source Selection**: Pick entity to be assigned
3. **Target Selection**: Choose assignment destination
4. **Validation Check**: System validates assignment rules
5. **Conflict Resolution**: Handle any detected conflicts
6. **Confirmation**: Review and confirm assignment
7. **Directory Update**: Real-time synchronization with Directory

## Archive Management Workflow

### Soft Delete Process
**Archive Reasons**:
- Terminated employment
- Contract completion
- Service discontinuation
- Data consolidation
- Temporary suspension
- Policy compliance

**Archive Workflow**:
1. **Selection**: Choose entity for archival
2. **Reason Entry**: Required reason selection/entry
3. **Impact Assessment**: Show dependent relationships
4. **Confirmation**: Multi-step confirmation process
5. **Execution**: Move to archive with preservation
6. **Notification**: Alert relevant stakeholders

### Restore Process
**Restore Eligibility**:
- Entity must be in archived state
- No conflicting active entities
- Restore permissions required
- Business rule compliance

**Restore Workflow**:
1. **Archive Review**: Browse archived entities
2. **Restore Selection**: Choose entity for restoration
3. **Conflict Check**: Validate no active conflicts
4. **Data Refresh**: Update stale information
5. **Confirmation**: Confirm restore operation
6. **Reactivation**: Return to active Directory

## Role-Based Access Control

### Admin User Rights
```
Admin Users    ✓ Full Create access
               ✓ Full Assign access
               ✓ Full Archive access
               ✓ Directory management
               ✓ System configuration
```

### Manager Rights (Limited Admin)
```
Managers       ✓ View Directory
               ✓ Create subordinate users
               ✓ Assign within department
               ✗ Archive users
               ✗ System configuration
```

### Standard User Rights
```
All Others     ✓ View Directory (filtered)
               ✗ Create users
               ✗ Assign users
               ✗ Archive users
               ✗ Admin functions
```

## Form Design Patterns

### Layout Standards
- **Table-based forms**: Consistent alignment and spacing
- **Fixed field widths**: 300px for uniformity
- **Two-column layout**: Label and input pairs
- **Color-coded buttons**: Match role theme colors
- **Responsive design**: Adapts to screen sizes

### Validation Rules
- **Required field indicators**: Red asterisks
- **Format validation**: Email, phone, ID patterns
- **Character limits**: Appropriate for field types
- **Dropdown constraints**: Predefined valid options
- **Cross-field validation**: Relationship consistency

### Form Submission Flow
1. **Field Validation**: Real-time validation feedback
2. **Form Completion**: All required fields filled
3. **Business Rule Check**: Custom validation rules
4. **Submission Processing**: Server-side validation
5. **ID Generation**: Auto-generated unique identifiers
6. **Directory Update**: Real-time synchronization
7. **Success Confirmation**: User feedback with new ID

## Directory Integration

### Real-Time Synchronization
- **Immediate Updates**: Changes reflect instantly in Directory
- **Cascade Updates**: Related entity updates propagate
- **Version Control**: Track all changes with timestamps
- **Audit Trail**: Complete modification history

### Search and Filter Updates
- **Index Rebuilding**: Search indexes update automatically
- **Filter Refresh**: Dynamic filter options stay current
- **Sort Consistency**: Maintain sort orders with new data
- **Cache Invalidation**: Ensure fresh data display

## Data Validation and Business Rules

### ID Generation Rules
- **Sequential Numbering**: IDs increment automatically
- **Type Prefixes**: Consistent prefixes by entity type
- **Zero Padding**: Three-digit numbers (001, 002, 003)
- **Uniqueness Guarantee**: No duplicate IDs possible
- **Format Consistency**: All IDs follow CKS standards

### Relationship Validation
- **Circular Reference Prevention**: No recursive assignments
- **Hierarchy Integrity**: Maintain proper reporting chains
- **Capacity Limits**: Respect maximum assignments
- **Skill Matching**: Validate capability requirements
- **Geographic Constraints**: Respect coverage areas

### Data Integrity Checks
- **Required Field Enforcement**: Critical fields must be complete
- **Format Validation**: Emails, phones, IDs follow patterns
- **Cross-System Consistency**: Maintain data across modules
- **Duplicate Prevention**: Avoid duplicate entries
- **Reference Integrity**: Maintain valid entity relationships

## User Interface Components

### Navigation Patterns
- **PageWrapper**: Consistent page structure with sr-only headers
- **TabContainer**: Pills variant with compact spacing
- **NavigationTab**: Color-coded tabs with active states
- **Responsive Design**: Mobile-friendly responsive layouts

### Form Components
- **Standardized Inputs**: Consistent styling across forms
- **Dropdown Selectors**: Dynamic options based on context
- **Multi-Select Options**: Checkbox groups for multiple selections
- **Date/Time Pickers**: Standardized temporal input controls
- **Validation Messages**: Clear, contextual error feedback

### Display Components
- **Data Tables**: Sortable, filterable user lists
- **Card Layouts**: Summary cards for quick overview
- **Status Indicators**: Visual status representation
- **Action Buttons**: Role-appropriate action availability
- **Progress Indicators**: Multi-step process feedback

## Workflow Examples

### Example 1: Creating a New Manager
**Scenario**: HR needs to create a new Operations Manager

**Process**:
1. Navigate to Admin Hub → Create → Managers
2. Fill required fields:
   - First Name: "John"
   - Last Name: "Smith"
   - Email: "john.smith@cks.com"
   - Phone: "+1-555-0123"
   - Manager Role: "Operations"
3. System populates Reports To dropdown with Strategic managers
4. Select Reports To: "MNG-001 (Strategic Manager)"
5. Choose Access Level: "Full"
6. Select Department: "Operations"
7. Click "Create Manager" button
8. System generates MNG-003 and updates Directory
9. Confirmation message displays new Manager ID

**Result**: New manager immediately available in Directory with proper hierarchy

### Example 2: Assigning Crew to Center
**Scenario**: Assigning newly hired crew member to appropriate center

**Process**:
1. Navigate to Admin Hub → Assign → Crew
2. Select source crew member: "CRW-005"
3. View current assignment status and specializations
4. Choose target center based on:
   - Geographic proximity
   - Specialization match
   - Center capacity
5. Select target: "CNT-002 (Downtown Cleaning Center)"
6. System validates:
   - Center has capacity
   - Crew specializations match center services
   - No scheduling conflicts
7. Confirm assignment
8. Directory updates crew's assigned center
9. Center's crew roster updates automatically

**Result**: Crew member properly assigned with valid operational constraints

### Example 3: Archiving Terminated Contractor
**Scenario**: Contractor contract ended, needs archival

**Process**:
1. Navigate to Admin Hub → Archive → Contractors
2. Locate contractor: "CTR-007"
3. Review impact assessment:
   - Active orders: 2 pending
   - Assigned services: 5 ongoing
   - Reporting relationships: None
4. Select archive reason: "Contract completion"
5. System recommends reassignment for active items
6. Confirm understanding of impacts
7. Execute archive operation
8. Contractor moves to archived state
9. Active orders require reassignment

**Result**: Contractor archived while preserving data integrity

## Testing Scenarios

### Create Section Testing
1. **Form Validation Testing**:
   - Test all required field validation
   - Verify character limits and format validation
   - Test dropdown dependency behavior
   - Validate business rule enforcement

2. **ID Generation Testing**:
   - Verify sequential ID generation
   - Test concurrent creation scenarios
   - Validate uniqueness constraints
   - Confirm proper format adherence

3. **Directory Integration Testing**:
   - Verify real-time Directory updates
   - Test search index synchronization
   - Validate filter option updates
   - Confirm sort order maintenance

### Assign Section Testing
1. **Smart Assignment Testing**:
   - Test hierarchy rule enforcement
   - Verify conflict detection accuracy
   - Validate capacity limit respect
   - Test geographic constraint checks

2. **Assignment Type Testing**:
   - Test all assignment type combinations
   - Verify proper validation for each type
   - Test bulk assignment scenarios
   - Validate assignment rollback capabilities

3. **Real-Time Update Testing**:
   - Test immediate Directory synchronization
   - Verify cascade update propagation
   - Test concurrent assignment scenarios
   - Validate conflict resolution workflows

### Archive Section Testing
1. **Soft Delete Testing**:
   - Verify data preservation during archive
   - Test impact assessment accuracy
   - Validate archive reason tracking
   - Test dependency identification

2. **Restore Testing**:
   - Test restore eligibility checking
   - Verify conflict detection on restore
   - Test data refresh on restoration
   - Validate Directory reintegration

3. **Audit Trail Testing**:
   - Verify complete audit trail maintenance
   - Test timestamp accuracy
   - Validate user attribution
   - Test historical data integrity

## Error Handling and Edge Cases

### Form Submission Errors
- **Network Failures**: Graceful retry mechanisms
- **Validation Failures**: Clear error messaging
- **Server Errors**: User-friendly error display
- **Timeout Handling**: Progress indicators and retry options

### Assignment Conflicts
- **Double Booking**: Clear conflict identification
- **Hierarchy Violations**: Explain rule violations
- **Capacity Exceeded**: Show current capacity status
- **Skill Mismatches**: Detail requirement gaps

### Data Integrity Issues
- **Orphaned References**: Automated cleanup procedures
- **Circular Dependencies**: Prevention and detection
- **Concurrent Modifications**: Optimistic locking strategies
- **System Synchronization**: Consistency validation

## Performance Considerations

### Scalability Planning
- **Database Indexing**: Optimize query performance
- **Caching Strategies**: Cache frequently accessed data
- **Pagination**: Handle large datasets efficiently
- **Search Optimization**: Fast full-text search capabilities

### User Experience Optimization
- **Form Responsiveness**: Fast field validation
- **Real-Time Updates**: Immediate feedback
- **Progressive Loading**: Load critical content first
- **Error Recovery**: Quick error resolution paths

## Security Considerations

### Access Control
- **Role-Based Permissions**: Strict access control enforcement
- **Session Management**: Secure session handling
- **Audit Logging**: Complete action tracking
- **Data Encryption**: Sensitive data protection

### Data Protection
- **Input Sanitization**: Prevent injection attacks
- **Output Encoding**: Safe data display
- **File Upload Security**: Secure file handling
- **API Security**: Protected endpoint access

## Future Enhancements

### Phase 1 Improvements
1. **Bulk Operations**: Mass create/assign/archive capabilities
2. **Templates**: Reusable form templates for common scenarios
3. **Advanced Search**: Complex filtering and search options
4. **Import/Export**: CSV/Excel data exchange capabilities

### Phase 2 Features
1. **Workflow Automation**: Rule-based automatic assignments
2. **Approval Workflows**: Multi-step approval processes
3. **Integration APIs**: External system connectivity
4. **Mobile Application**: Native mobile app for admin functions

### Phase 3 Enhancements
1. **AI-Powered Assignment**: Machine learning assignment optimization
2. **Predictive Analytics**: Forecasting admin needs
3. **Advanced Reporting**: Comprehensive admin analytics
4. **Voice Interface**: Voice-controlled admin operations

## Analytics and Metrics

### Key Performance Indicators
1. **Creation Velocity**: Users created per time period
2. **Assignment Efficiency**: Time to complete assignments
3. **Archive Recovery Rate**: Percentage of restored entities
4. **Error Rates**: Form submission and validation errors
5. **User Adoption**: Admin feature utilization rates

### Reporting Capabilities
- **User Creation Reports**: Track creation patterns and trends
- **Assignment Analysis**: Monitor assignment effectiveness
- **Archive Management**: Track archival and restore patterns
- **System Performance**: Monitor response times and errors
- **Audit Reports**: Complete administrative action history

## Integration Points

### Directory System
- **Real-Time Sync**: Immediate data synchronization
- **Search Integration**: Unified search across all data
- **Filter Coordination**: Consistent filter behavior
- **Sort Consistency**: Maintain sort orders

### Order Management
- **User Validation**: Verify users exist for order creation
- **Assignment Coordination**: Ensure valid user assignments
- **Status Synchronization**: Coordinate order and user status

### Reports & Feedback
- **User Attribution**: Link reports to valid users
- **Escalation Paths**: Route issues to proper managers
- **Resolution Tracking**: Monitor admin-related issues

### External Systems
- **HR Systems**: Employee data synchronization
- **Accounting**: User-based billing and cost tracking
- **CRM Integration**: Customer relationship management
- **Compliance**: Regulatory reporting and auditing

## Notes for Developers

### Implementation Guidelines
1. **Component Reusability**: Maximize shared component usage
2. **Type Safety**: Comprehensive TypeScript implementation
3. **Error Boundaries**: Graceful error handling throughout
4. **Performance Monitoring**: Track and optimize performance
5. **Accessibility**: Full WCAG compliance

### Code Organization
- **Domain-Driven Design**: Organize by business domains
- **Service Layer**: Separate business logic from UI
- **Data Access Layer**: Abstracted data operations
- **Utility Functions**: Shared helper functions
- **Testing Strategy**: Comprehensive test coverage

### Best Practices
- **Validation Consistency**: Shared validation rules
- **Error Handling**: Consistent error response patterns
- **Loading States**: Unified loading indicators
- **Success Feedback**: Consistent success messaging
- **Documentation**: Comprehensive code documentation

---

*Last Updated: 2025-09-19*
*Version: 1.0*