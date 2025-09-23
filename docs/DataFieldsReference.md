# CKS Portal - Data Fields Reference

**Document Version:** 1.0
**Last Updated:** September 22, 2025
**Purpose:** Comprehensive reference for all data fields used throughout the CKS Portal application

---

## Overview

This document serves as the single source of truth for all data fields in the CKS Portal. It defines what data each entity requires, the field types, validation rules, and relationships between entities.

## Table of Contents

1. [User Profile Fields](#user-profile-fields)
2. [Directory Fields](#directory-fields)
3. [Service & Order Fields](#service--order-fields)
4. [Report Fields](#report-fields)
5. [Support Fields](#support-fields)
6. [System Fields](#system-fields)

---

## User Profile Fields

### Admin Profile
**Note:** Admins do not have a profile section.

### Manager Profile
**Location:** ManagerHub → My Profile

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `managerId` | string | Yes | "MGR-001" | Primary identifier (auto-generated) |
| `fullName` | string | Yes | "John Smith" | Display name |
| `territory` | string | Yes | "Northeast Region" | Assigned territory |
| `phone` | string | Yes | "(555) 123-4567" | Contact phone |
| `email` | string | Yes | "john.smith@cks.com" | Contact email |
| `role` | string | Yes | "Senior Manager" | Dropdown selector |
| `reportsTo` | string | No | "MGR-000" | Dropdown selector (manager FK) |
| `address` | string | Yes | "123 Business Ave..." | Office address |
| `startDate` | datetime | Auto | "2020-01-15" | Account creation date |
| `status` | string | Auto | "active" | Always active for managers |

### Contractor Profile
**Location:** ContractorHub → My Profile

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `contractorId` | string | Yes | "CON-001" | Primary identifier (auto-generated) |
| `name` | string | Yes | "ABC Construction LLC" | Company name |
| `mainContact` | string | Yes | "Jane Doe" | Primary contact person |
| `email` | string | Yes | "contact@abc.com" | Primary email |
| `phone` | string | Yes | "(555) 234-5678" | Primary phone |
| `address` | string | Yes | "456 Industrial Blvd..." | Business address |
| `startDate` | datetime | Auto | "2022-01-15" | Account creation date |
| `status` | string | Auto | "unassigned" | Default until assigned to manager |

### Customer Profile
**Location:** CustomerHub → My Profile

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `customerId` | string | Yes | "CUS-001" | Primary identifier (auto-generated) |
| `name` | string | Yes | "TechCorp Industries" | Company name |
| `mainContact` | string | Yes | "Emily Chen" | Primary contact person |
| `email` | string | Yes | "services@techcorp.com" | Primary email |
| `phone` | string | Yes | "(555) 456-7890" | Primary phone |
| `address` | string | Yes | "789 Technology Way..." | Business address |
| `startDate` | datetime | Auto | "2020-01-01" | Account creation date |
| `status` | string | Auto | "unassigned" | Default until assigned to contractor |

### Center Profile
**Location:** CenterHub → My Profile

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `centerId` | string | Yes | "CEN-001" | Primary identifier (auto-generated) |
| `name` | string | Yes | "Downtown Service Center" | Center name |
| `mainContact` | string | Yes | "Robert Wilson" | Primary contact person |
| `email` | string | Yes | "downtown@cks-centers.com" | Center email |
| `phone` | string | Yes | "(555) 678-9012" | Center phone |
| `address` | string | Yes | "321 Main Street..." | Physical location |
| `startDate` | datetime | Auto | "2020-03-15" | Account creation date |
| `status` | string | Auto | "unassigned" | Default until assigned to customer |

### Crew Profile
**Location:** CrewHub → My Profile

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `crewId` | string | Yes | "CRW-001" | Primary identifier (auto-generated) |
| `name` | string | Yes | "David Martinez" | Full name |
| `emergencyContact` | string | Yes | "Maria Martinez (555) 890-5678" | Emergency contact info |
| `email` | string | Yes | "d.martinez@cks-crew.com" | Work email |
| `phone` | string | Yes | "(555) 890-1234" | Contact phone |
| `address` | string | Yes | "567 Worker Lane..." | Home address |
| `startDate` | datetime | Auto | "2020-06-01" | Account creation date |
| `status` | string | Auto | "unassigned" | Default until assigned to center |

### Warehouse Profile
**Location:** WarehouseHub → My Profile

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `warehouseId` | string | Yes | "WHS-001" | Primary identifier (auto-generated) |
| `name` | string | Yes | "Central Distribution" | Warehouse name |
| `mainContact` | string | Yes | "Kevin Thompson" | Primary contact person |
| `email` | string | Yes | "central@cks-warehouse.com" | Contact email |
| `phone` | string | Yes | "(555) 012-3456" | Contact phone |
| `address` | string | Yes | "999 Logistics Parkway..." | Physical location |
| `startDate` | datetime | Auto | "2019-05-01" | Account creation date |
| `status` | string | Auto | "operational" | Default operational status |

---

## Directory Fields

### Common Directory Fields
These fields appear in the Directory section for the AdminHub

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Entity identifier (format varies by type) |
| `name` | string | Display name |
| `status` | string | Current status |
| `createdAt` | datetime | Record creation |
| `updatedAt` | datetime | Last modification |
| `createdBy` | string | User who created record |
| `archivedAt` | datetime | Soft delete timestamp |

---

## Service & Order Fields

### Service Fields

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `serviceId` | string | Yes | "CEN001-SRV001" | Primary identifier |
| `serviceName` | string | Yes | "Window Cleaning" | Service description |
| `centerId` | string | Yes | "CEN-001" | Service location FK |
| `serviceType` | string | Yes | "cleaning" | Service category |
| `frequency` | string | No | "weekly" | Service frequency |
| `startDate` | date | Yes | "2025-01-01" | Service start |
| `endDate` | date | No | "2025-12-31" | Service end |
| `createdBy` | string | Yes | "CUS-001" | Original requester |
| `approvedBy` | string | No | "MGR-002" | Manager who approved |
| `assignedCrew` | string[] | No | ["CRW-001", "CRW-002"] | Assigned crew |
| `status` | string | Yes | "active" | active/pending/completed |

### Order Fields

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `orderId` | string | Yes | "CRW001-ORD-PRD001" | Primary identifier |
| `orderType` | string | Yes | "product" | product/service |
| `createdBy` | string | Yes | "CRW-001" | Order creator |
| `createdDate` | datetime | Yes | "2025-09-22T10:00:00Z" | Creation timestamp |
| `requestedDate` | date | No | "2025-09-25" | Requested delivery |
| `items` | array | Yes | [{"id": "PRD-001", "qty": 5}] | Order items |
| `destination` | string | No | "CEN-005" | Delivery location |
| `approvalChain` | array | Auto | [{role, userId, status, timestamp}] | Approval workflow |
| `status` | string | Yes | "pending" | pending/approved/delivered |
| `notes` | string | No | "Urgent request" | Additional notes |

---

## Report Fields

### Report Fields

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `reportId` | string | Yes | "RPT-2025-001" | Primary identifier |
| `reportType` | string | Yes | "performance" | Report category |
| `generatedBy` | string | Yes | "MGR-001" | Report creator |
| `generatedDate` | datetime | Yes | "2025-09-22T10:00:00Z" | Generation time |
| `reportPeriod` | string | No | "Q3 2025" | Coverage period |
| `data` | json | Yes | {...} | Report data |
| `severity` | string | No | "high" | For incident reports |
| `status` | string | Yes | "pending" | pending/reviewed/archived |

---

## Support Fields

### Support Ticket Fields

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `ticketId` | string | Yes | "TKT-2025-001" | Primary identifier |
| `createdBy` | string | Yes | "CUS-001" | Ticket creator |
| `assignedTo` | string | No | "ADM-001" | Support assignee |
| `priority` | string | Yes | "high" | high/medium/low |
| `category` | string | Yes | "technical" | Issue category |
| `subject` | string | Yes | "Login issues" | Ticket subject |
| `description` | text | Yes | "Cannot access..." | Issue details |
| `status` | string | Yes | "open" | open/in-progress/resolved |
| `createdDate` | datetime | Yes | "2025-09-22T10:00:00Z" | Creation time |
| `resolvedDate` | datetime | No | "2025-09-23T10:00:00Z" | Resolution time |

---

## System Fields

### Activity/Audit Fields

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `activityId` | string | Yes | "ACT-2025-001" | Primary identifier |
| `userId` | string | Yes | "MGR-001" | User who performed action |
| `action` | string | Yes | "UPDATE" | Action type |
| `entityType` | string | Yes | "customer" | Affected entity |
| `entityId` | string | Yes | "CUS-001" | Affected entity ID |
| `timestamp` | datetime | Yes | "2025-09-22T10:00:00Z" | Action time |
| `details` | json | No | {"field": "status", "from": "active", "to": "inactive"} | Action details |
| `ipAddress` | string | No | "192.168.1.1" | User IP |

---

## Validation Rules

### Common Validation Patterns

- **IDs**: Follow format defined in CustomIdSystem.md
- **Emails**: Valid email format with @ and domain
- **Phones**: Accept formats: (XXX) XXX-XXXX, XXX-XXX-XXXX, +1XXXXXXXXXX
- **Dates**: ISO 8601 format (YYYY-MM-DD)
- **Datetimes**: ISO 8601 with timezone (YYYY-MM-DDTHH:mm:ssZ)
- **Status**: Must be from predefined enum values
- **Currency**: Decimal with 2 places max
- **Percentages**: 0-100 range

---

## Relationships

### Entity Relationships

```
Customer (1) --> (N) Centers
Manager (1) --> (N) Centers
Manager (1) --> (N) Contractors
Contractor (1) --> (N) Centers
Center (1) --> (N) Crew
Center (1) --> (N) Services
Warehouse (1) --> (N) Products
```

---

## Notes

- All datetime fields should store UTC values
- All currency fields should store values in USD
- Soft deletes use `archivedAt` timestamp
- System should maintain audit trail for all changes
- Profile fields may expand based on business requirements

---

*Property of CKS © 2025 - Manifested by Freedom*
