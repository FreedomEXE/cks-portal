# CKS Admin System Flow Documentation

## Overview
The Admin system provides comprehensive management of all users and entities within the CKS ecosystem. It handles user creation, hierarchical assignments, and archive management with full audit trails.

## Related Code Files
- **Admin Components**: `/apps/frontend/src/components/admin/`
- **Admin Hub**: `/apps/frontend/src/hubs/AdminHub.tsx`
- **User Management**: `/apps/backend/server/domains/users/`
- **Assignment Logic**: `/apps/backend/server/domains/assignments/`

## ID Format Standards

### User IDs
- **MGR-XXX**: Managers (e.g., MGR-001)
- **CON-XXX**: Contractors (e.g., CON-023)
- **CUS-XXX**: Customers (e.g., CUS-098)
- **CTR-XXX**: Centers (e.g., CTR-156)
- **CRW-XXX**: Crew members (e.g., CRW-042)
- **WHS-XXX**: Warehouses (e.g., WHS-003)

### Entity IDs
- **SRV-XXX**: Services
- **PRD-XXX**: Products
- **ORD-XXX**: Orders
- **RPT-XXX**: Reports
- **FBK-XXX**: Feedback

## Admin Sections

### 1. Create Section
**Purpose**: Streamlined creation of new users and entities

**Features**:
- Role-specific forms with validation
- Color-coded interfaces matching role themes
- Auto-generated IDs in correct format
- Real-time Directory synchronization

### 2. Assign Section
**Purpose**: Manage hierarchical user relationships

**Assignment Hierarchy**:
```
Manager (No assignment needed)
└── Contractor (Assign to Manager)
    └── Customer (Assign to Contractor)
        └── Center (Assign to Customer)
            └── Crew (Assign to Center)
```

**Unassigned Buckets**:
- Shows count badges for unassigned users
- Auto-populated when users are created
- Updated when hierarchies change

### 3. Archive Section
**Purpose**: Soft delete with restore capabilities

**Features**:
- Preserve data while removing from active use
- Restore functionality
- Archive reason tracking
- Full audit trail

## User Creation Forms

### Manager Form
```
Create New Manager
├── First Name* [___________] (300px)
├── Last Name*  [___________] (300px)
├── Email*      [___________] (400px)
├── Phone       [___________] (300px)
├── Territory*  [___________] (300px)
└── [Create Manager] button (blue)
```

### Contractor Form
```
Create New Contractor
├── Business Name* [___________] (400px)
├── Contact Name*  [___________] (300px)
├── Email*         [___________] (400px)
├── Phone*         [___________] (300px)
├── Service Type*  [Dropdown▼]
├── License #      [___________] (200px)
└── [Create Contractor] button (green)
```

### Customer Form
```
Create New Customer
├── Company Name*  [___________] (400px)
├── Contact Name*  [___________] (300px)
├── Email*         [___________] (400px)
├── Phone*         [___________] (300px)
├── Address*       [___________] (500px)
├── City*          [___________] (200px)
├── State*         [Dropdown▼]
├── ZIP*           [___________] (100px)
└── [Create Customer] button (purple)
```

### Center Form
```
Create New Center
├── Location Name* [___________] (400px)
├── Address*       [___________] (500px)
├── City*          [___________] (200px)
├── State*         [Dropdown▼]
├── ZIP*           [___________] (100px)
├── Manager Name   [___________] (300px)
├── Manager Phone  [___________] (300px)
└── [Create Center] button (orange)
```

### Crew Form
```
Create New Crew Member
├── First Name*    [___________] (300px)
├── Last Name*     [___________] (300px)
├── Email          [___________] (400px)
├── Phone*         [___________] (300px)
├── Role*          [Dropdown▼] (Team Lead/Member)
├── Certification  [___________] (300px)
└── [Create Crew] button (teal)
```

### Warehouse Form
```
Create New Warehouse
├── Facility Name* [___________] (400px)
├── Address*       [___________] (500px)
├── City*          [___________] (200px)
├── State*         [Dropdown▼]
├── ZIP*           [___________] (100px)
├── Manager Name*  [___________] (300px)
├── Capacity       [___________] (200px)
└── [Create Warehouse] button (gray)
```

## Assignment Workflow

### Assignment Rules
1. **Auto-Assignment to Unassigned**:
   - All new users (except Managers) start unassigned
   - Shows in unassigned bucket with count badge

2. **Cascade Deletion**:
   - Deleting a parent unassigns all children
   - Example: Delete Contractor → All their Customers become unassigned

3. **Assignment Interface**:
```
Assign Contractor
├── Unassigned Contractors (3)
│   ├── CON-001 [Select]
│   ├── CON-002 [Select]
│   └── CON-003 [Select]
├── Available Managers
│   ├── MGR-001 (5 contractors) [Assign Here]
│   └── MGR-002 (3 contractors) [Assign Here]
└── [Save Assignments] button
```

## Archive Management

### Archive Process
1. Select users to archive
2. Enter archive reason
3. Confirm action
4. Users moved to archive (soft delete)
5. Can be restored later

### Archive Interface
```
Archived Users
├── Search [___________] 🔍
├── Filter by: Role [▼] Date [▼]
├── User List
│   ├── CON-001 | Archived: 2025-09-28 | Reason: Inactive
│   │   [View] [Restore]
│   └── CUS-045 | Archived: 2025-09-25 | Reason: Contract ended
│       [View] [Restore]
└── Showing 1-10 of 25 archived users
```

## Visual Design

### Color Scheme by Role
- **Manager**: Blue (#3b82f6)
- **Contractor**: Green (#10b981)
- **Customer**: Purple (#8b5cf6)
- **Center**: Orange (#f59e0b)
- **Crew**: Teal (#06b6d4)
- **Warehouse**: Gray (#6b7280)

### Form Styling
```css
/* Input fields */
.admin-input {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 6px;
}

/* Required field indicator */
.required::after {
  content: " *";
  color: #ef4444;
}

/* Submit buttons match role colors */
.btn-create {
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
}
```

## Directory Integration

### Real-Time Updates
- Creating a user → Immediately appears in Directory
- Archiving a user → Removed from Directory
- Restoring a user → Returns to Directory
- Assignment changes → Updates hierarchy view

### Directory Structure
```
Directory
├── Managers (2)
│   ├── MGR-001
│   │   └── Contractors (3)
│   └── MGR-002
│       └── Contractors (2)
├── Unassigned
│   ├── Contractors (1)
│   └── Customers (3)
└── Archived (25)
```

## Validation Rules

### Email Validation
- Must be unique across system
- Format: valid email pattern
- Domain restrictions (optional)

### Phone Validation
- Format: (XXX) XXX-XXXX
- US numbers only
- Auto-formatting on input

### Required Fields
- Marked with asterisk (*)
- Cannot submit without all required
- Real-time validation feedback

## Audit Trail

### Tracked Actions
- User creation (who, when, initial data)
- Assignment changes (from, to, by whom)
- Archive actions (reason, who, when)
- Restore actions (who, when)
- Data modifications (field changes)

### Audit Log Format
```
2025-09-28 10:45:23 | ADMIN-001 | Created CON-045
2025-09-28 10:46:15 | ADMIN-001 | Assigned CON-045 to MGR-002
2025-09-28 11:00:00 | ADMIN-002 | Archived CUS-023 (Reason: Inactive)
```

## Permissions

### Admin-Only Actions
- Create any user type
- Assign/reassign users
- Archive/restore users
- View audit logs
- Modify user data

### Role Restrictions
- Non-admins cannot access Admin hub
- API validates admin role
- UI hides admin features for non-admins

## Future Enhancements

1. **Bulk Operations**: Create/assign multiple users at once
2. **Import/Export**: CSV upload for bulk user creation
3. **Approval Workflows**: Require approval for certain actions
4. **Custom Fields**: Add organization-specific user fields
5. **API Access**: REST API for external integration
6. **Scheduled Archives**: Auto-archive inactive users
7. **Role Templates**: Predefined permission sets

---

*Last Updated: 2025-09-28*
*Version: 2.0 - Consolidated from workflow documentation*