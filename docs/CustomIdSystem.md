# CKS Custom ID System Documentation

External ID prefixes, rules, and implementation guidelines for the CKS Portal system.

## Overview

The CKS ID System provides a standardized approach for identifying all entities within the CKS Portal ecosystem. Each entity type has a unique prefix that enables instant identification, role-based access control, and systematic data organization across the platform.

## User Entity IDs

### Admins
**Format:** `Custom string` (completely flexible)
- **Pattern:** Any string the admin chooses
- **Uniqueness:** Must be globally unique across all admins
- **Case Sensitivity:** Not case-sensitive (stored/compared in lowercase)
- **Validation:** Any characters allowed except system delimiters
- **Examples:** `freedom_exe`, `JohnDoe`, `admin123`, `superuser`, `boss`
- **Notes:** Admins have complete freedom to create any ID they want

### Managers
**Format:** `MGR-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** MGR-001 to MGR-9999... (unlimited)
- **Examples:** `MGR-001`, `MGR-042`, `MGR-123`, `MGR-1234`, `MGR-10000`
- **Auto-generation:** Sequential assignment on creation, auto-extends beyond 999
- **Role Derivation:** "MGR" prefix maps to manager role

### Contractors
**Format:** `CON-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** CON-001 to CON-9999... (unlimited)
- **Examples:** `CON-001`, `CON-015`, `CON-234`, `CON-1001`, `CON-25000`
- **Auto-generation:** Sequential assignment on creation, auto-extends beyond 999
- **Role Derivation:** "CON" prefix maps to contractor role

### Customers
**Format:** `CUS-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** CUS-001 to CUS-9999... (unlimited)
- **Examples:** `CUS-001`, `CUS-100`, `CUS-456`, `CUS-1500`, `CUS-50000`
- **Auto-generation:** Sequential assignment on creation, auto-extends beyond 999
- **Role Derivation:** "CUS" prefix maps to customer role

### Centers
**Format:** `CEN-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** CEN-001 to CEN-9999... (unlimited)
- **Examples:** `CEN-001`, `CEN-025`, `CEN-789`, `CEN-1200`, `CEN-15000`
- **Auto-generation:** Sequential assignment on creation, auto-extends beyond 999
- **Role Derivation:** "CEN" prefix maps to center role

### Crew
**Format:** `CRW-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** CRW-001 to CRW-9999... (unlimited)
- **Examples:** `CRW-001`, `CRW-050`, `CRW-321`, `CRW-2500`, `CRW-100000`
- **Auto-generation:** Sequential assignment on creation, auto-extends beyond 999
- **Role Derivation:** "CRW" prefix maps to crew role

### Warehouses
**Format:** `WHS-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** WHS-001 to WHS-9999... (unlimited)
- **Examples:** `WHS-001`, `WHS-010`, `WHS-200`, `WHS-1050`, `WHS-12000`
- **Auto-generation:** Sequential assignment on creation, auto-extends beyond 999
- **Role Derivation:** "WHS" prefix maps to warehouse role
- **Note:** Different from mock data which uses "WH-XXX" - production uses "WHS-XXX"

## Data Entity IDs

### Services
**Base Format:** `SRV-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** SRV-001 to SRV-9999... (unlimited)
- **Examples:** `SRV-001` (Window Cleaning), `SRV-002` (Floor Care), `SRV-1001` (Deep Clean)
- **Type:** Global service catalog entries

#### Center-Specific Services
**Format:** `CENXXX-SRVXXX`
- **Pattern:** Center ID (no dashes) + Service ID
- **Examples:**
  - `CEN001-SRV001` (Window Cleaning service for Center 001)
  - `CEN025-SRV002` (Floor Care service for Center 025)
- **Purpose:** Services are always assigned to specific centers
- **Creation:** When a service order is approved and transformed
- **Metadata:** Service record tracks `createdBy` field showing original requester (e.g., CUS-001, CON-005)

### Products
**Base Format:** `PRD-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** PRD-001 to PRD-9999... (unlimited)
- **Examples:** `PRD-001` (Cleaning Supplies), `PRD-002` (Safety Equipment), `PRD-5000` (Specialized Tools)
- **Type:** Global product catalog entries

#### Custom Center Products
**Format:** `CENXXX-PRDXXX`
- **Pattern:** Center ID + Product ID combination
- **Examples:**
  - `CEN001-PRD001` (Cleaning Supplies for Center 001)
  - `CEN050-PRD003` (Equipment package for Center 050)
- **Purpose:** Represents product configurations specific to centers

### Orders
Orders represent the temporary state when services or products are requested but not yet fulfilled. The order ID format depends on WHO creates the order.

#### Order ID Format
**Universal Format:** `{UserID}-ORD-{TypeID}`
- **UserID:** The ID of the user/entity creating the order
- **ORD:** Fixed identifier indicating this is an order
- **TypeID:** Either SRVXXX for service orders or PRDXXX for product orders

#### Service Orders
**Format:** `CENXXX-ORD-SRVXXX`
- **Who Can Create:** Anyone can create, but service is always FOR a specific center
- **Examples:**
  - `CEN001-ORD-SRV001` (Service order for Center 001)
  - `CEN025-ORD-SRV005` (Service order for Center 025)
  - `CEN100-ORD-SRV003` (Service order for Center 100)
- **Creator Tracking:** Order metadata tracks who created it (`createdBy: "CUS-001"` or `createdBy: "CON-005"`)
- **Approval Flow:** Creator → Manager Review → Service Creation → Crew Assignment
- **Transformation:** `CEN001-ORD-SRV001` → `CEN001-SRV001` (drops "ORD" when approved)

#### Product Orders
**Format:** `{UserID}-ORD-PRDXXX`
- **Who Can Create:** Crew, Centers, Contractors, Customers, Managers
- **Examples:**
  - `CRW001-ORD-PRD001` (Product order created by Crew member 001)
  - `CEN050-ORD-PRD010` (Product order created by Center 050)
  - `CUS100-ORD-PRD005` (Product order created by Customer 100)
  - `MGR002-ORD-PRD003` (Product order created by Manager 002)
  - `CON015-ORD-PRD007` (Product order created by Contractor 015)
- **Approval Flow:** Creator → Warehouse Review → Delivery
- **Final State:** Status becomes "delivered" when warehouse completes delivery

### Training
**Format:** `TRN-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** TRN-001 to TRN-9999... (unlimited)
- **Examples:**
  - `TRN-001` (Safety Training Module)
  - `TRN-025` (Equipment Operation Course)
  - `TRN-1500` (Advanced Certification)
- **Auto-generation:** Sequential assignment on creation

### Procedures
**Format:** `PRO-XXXX+`
- **Pattern:** Variable-length numeric sequence (minimum 3 digits)
- **Range:** PRO-001 to PRO-9999... (unlimited)
- **Examples:**
  - `PRO-001` (Floor Cleaning Procedure)
  - `PRO-050` (Emergency Response Protocol)
  - `PRO-2000` (Complex Operations Manual)
- **Auto-generation:** Sequential assignment on creation
- **Note:** Uses "PRO" not "PRC" to avoid confusion with "procedures"

## ID Generation Rules

### Sequential Generation
Most IDs use sequential generation with the following rules:
1. Start at 001 for each entity type (3-digit minimum)
2. Increment by 1 for each new entity
3. Never reuse deleted IDs
4. Pad with leading zeros to maintain minimum 3 digits (001-999)
5. Auto-extend to 4+ digits when needed (1000, 1001, etc.)
6. No upper limit on ID length

### Database Implementation
-- Example sequence for Managers
CREATE SEQUENCE mgr_id_seq START WITH 1;

-- Generate next Manager ID (auto-extends beyond 999)
-- Store sequence value once to avoid double increment
WITH next_val AS (SELECT nextval('mgr_id_seq') AS val)
SELECT 'MGR-' || LPAD(next_val.val::text, GREATEST(3, LENGTH(next_val.val::text)), '0') AS next_mgr_id
FROM next_val;

-- Alternative simpler approach
SELECT 'MGR-' || LPAD(nextval('mgr_id_seq')::text, 3, '0') AS next_mgr_id; -- For 001-999
SELECT 'MGR-' || nextval('mgr_id_seq')::text AS next_mgr_id; -- For 1000+
### Validation Patterns
```typescript
// TypeScript validation examples (supports variable length IDs)
const ID_PATTERNS = {
  admin: /^.+$/,                      // Any non-empty string for admin IDs
  manager: /^MGR-\d{3,}$/,            // MGR-001, MGR-1234, etc.
  contractor: /^CON-\d{3,}$/,         // CON-001, CON-1234, etc.
  customer: /^CUS-\d{3,}$/,           // CUS-001, CUS-1234, etc.
  center: /^CEN-\d{3,}$/,             // CEN-001, CEN-1234, etc.
  crew: /^CRW-\d{3,}$/,               // CRW-001, CRW-1234, etc.
  warehouse: /^WHS-\d{3,}$/,          // WHS-001, WHS-1234, etc.
  service: /^SRV-\d{3,}$/,            // SRV-001, SRV-1234, etc.
  product: /^PRD-\d{3,}$/,            // PRD-001, PRD-1234, etc.
  training: /^TRN-\d{3,}$/,           // TRN-001, TRN-1234, etc.
  procedure: /^PRO-\d{3,}$/,          // PRO-001, PRO-1234, etc.
  centerService: /^CEN\d{3,}-SRV\d{3,}$/,      // CEN001-SRV001, CEN1234-SRV5678
  centerProduct: /^CEN\d{3,}-PRD\d{3,}$/,      // CEN001-PRD001, CEN1234-PRD5678
  serviceOrder: /^CEN\d{3,}-ORD-SRV\d{3,}$/,   // CEN001-ORD-SRV001, CEN025-ORD-SRV005
  productOrder: /^(CRW|CEN|CON|CUS|MGR)\d{3,}-ORD-PRD\d{3,}$/    // CRW001-ORD-PRD001, MGR002-ORD-PRD003
};
```

## Role Derivation from IDs

The system automatically derives user roles from ID prefixes:

```typescript
function deriveRole(cksId: string): string {
  if (!cksId || typeof cksId !== 'string') {
    return 'unknown';
  }

  // Special case for admin custom IDs (no dash means admin)
  if (!cksId.includes('-')) {
    return 'admin';
  }

  if (cksId.length < 7) { // Minimum: "XXX-001"
    return 'unknown';
  }

  // Extract first 3 characters and uppercase
  const prefix = cksId.substring(0, 3).toUpperCase();

  const roleMap = {
    'MGR': 'manager',
    'CON': 'contractor',
    'CUS': 'customer',
    'CEN': 'center',
    'CRW': 'crew',
    'WHS': 'warehouse'
  };

  return roleMap[prefix] || 'unknown';
}
## Order Lifecycle Management

Orders follow different lifecycles depending on type and creator:

### 1. Order Creation
Any authorized user creates an order:
- **Format:** `{UserID}-ORD-{TypeID}`
- **Examples:**
  - Crew creates: `CRW001-ORD-PRD001` (product request)
  - Customer creates: `CEN010-ORD-SRV002` (service request for center 010, created by customer)
  - Center creates: `CEN010-ORD-PRD005` (product request)

### 2. Order Processing & Approval
Orders follow role-based approval workflows:

**Product Orders:**
- Simple flow: Creator → Warehouse → Delivery
- Complex flow: Center → Customer → Contractor → Warehouse → Delivery
- Status progression: pending → accepted → delivered

**Service Orders:**
- Flow: Creator → Manager Review → Service Creation
- Transformation: `CEN001-ORD-SRV001` → `CEN001-SRV001` (drops "ORD")
- Service metadata includes: `createdBy` (original requester), `approvedBy` (manager)
- Status progression: pending → service-created### 3. Order Completion

**Service Orders:**
- Transform by dropping "ORD": `CEN001-ORD-SRV001` → `CEN001-SRV001`
- Original order archived with status "service-created"
- Service record maintains full audit trail:
  - `serviceId`: CEN001-SRV001
  - `createdBy`: Original requester (e.g., "CUS-050", "CON-015")
  - `approvedBy`: Manager who approved (e.g., "MGR-002")
  - `assignedTo`: Crew members (e.g., ["CRW-001", "CRW-002"])
- Service gets assigned to crew for execution

**Product Orders:**
- Maintain original order ID throughout lifecycle
- Final status becomes "delivered"
- Order moves to archive after delivery

## Authentication Integration

CKS IDs integrate with Clerk authentication:

1. **Username:** CKS ID serves as the Clerk username
2. **Login:** Users log in using their CKS ID
3. **Session Storage:** Role and ID stored in session
4. **API Authorization:** CKS ID included in API headers
5. **Route Generation:** Hub paths use lowercase CKS ID

Example routing:
- Admin: `/freedom_exe/hub`
- Manager: `/mgr-001/hub`
- Center: `/cen-001/hub`

## Best Practices

### DO's
- ✅ Always validate IDs against their pattern before database operations
- ✅ Use uppercase for ID prefixes
- ✅ Store admin IDs in lowercase for case-insensitive matching
- ✅ Maintain sequential ordering for non-admin IDs
- ✅ Store IDs as primary keys in respective tables
- ✅ Include CKS ID in all audit logs
- ✅ Auto-extend ID length beyond 999 when needed

### DON'Ts
- ❌ Don't reuse deleted IDs
- ❌ Don't allow manual ID assignment (except admins)
- ❌ Don't mix ID formats within same entity type
- ❌ Don't expose internal database IDs to users
- ❌ Don't limit IDs to 999 entities
- ❌ Don't make admin IDs case-sensitive

## Migration Considerations

When migrating from existing systems:

1. **Reserve ID Ranges:** Reserve ranges for existing data (e.g., MGR-001 to MGR-100)
2. **Map Legacy IDs:** Create mapping table for old ID → new CKS ID
3. **Batch Assignment:** Assign IDs in controlled batches
4. **Validation Phase:** Verify all IDs before go-live
5. **Rollback Plan:** Maintain ability to revert to legacy IDs if needed

## API Examples

### Creating a New Manager
```http
POST /api/admin/users
{
  "role": "manager",
  "fullName": "John Smith"
  // CKS ID auto-generated as MGR-XXX
}
```

### Creating a Service Order
```http
POST /api/orders/service
{
  "centerId": "CEN-001",    // Service is FOR this center
  "creatorId": "CUS-050",   // WHO is requesting it
  "serviceType": "Window Cleaning",
  "details": {...}
  // Generates: CEN001-ORD-SRV001
  // Metadata: createdBy: "CUS-050"
}
```

### Creating a Product Order
```http
POST /api/orders/product
{
  "creatorId": "CRW-001",  // Crew member creating the order
  "products": ["PRD-001", "PRD-002"],
  "destination": "CEN-005"
  // Generates: CRW001-ORD-PRD001
}
```

### Manager Approving Service Order
```http
POST /api/services/approve
{
  "orderId": "CEN001-ORD-SRV001",
  "managerId": "MGR-002",
  "assignedCrew": ["CRW-001", "CRW-002"]
  // Transforms to: CEN001-SRV001 (drops "ORD")
  // Service metadata:
  //   - serviceId: "CEN001-SRV001"
  //   - createdBy: "CUS-050" (original requester)
  //   - approvedBy: "MGR-002"
  //   - assignedTo: ["CRW-001", "CRW-002"]
}
```

## Error Handling

Common ID-related errors and their handling:

| Error Code | Description | Example |
|------------|-------------|---------|
| `INVALID_ID_FORMAT` | ID doesn't match expected pattern | "ABC-123" for Manager |
| `DUPLICATE_ID` | ID already exists in system | Creating MGR-001 twice |
| `ID_NOT_FOUND` | Referenced ID doesn't exist | Assigning to CEN-999 |
| `INVALID_ROLE_DERIVATION` | Cannot derive role from ID | Unknown prefix "XYZ-" |
| `SEQUENCE_ERROR` | Database sequence error | Sequence generation failed |

## Future Considerations

### ID Scaling
The system automatically handles scaling:
- IDs extend from 3 digits (001-999) to 4+ digits (1000+) seamlessly
- No manual intervention required
- No upper limit on numeric portion
- Database sequences handle the auto-increment

### Multi-tenant Support
For multi-tenant deployments:
- Prefix with tenant code: `T001-MGR-001`
- Separate sequences per tenant
- Cross-tenant ID validation

### UUID Alternative
For systems requiring globally unique IDs:
- Maintain display ID (MGR-001) for users
- Use UUID internally for database operations
- Map between display ID and UUID

---

*Property of CKS © 2025 - Manifested by Freedom*
