# Center Hub Permissions Documentation

## Overview

Access control and security specifications for Center hub operations, defining role-based permissions and capability management.

## Role-Based Access Control (RBAC)

### Center Role Definition

The Center role provides regional operations management capabilities with oversight of multiple territories and coordination between corporate and local operations.

```typescript
interface CenterRole {
  role: 'center';
  capabilities: CenterCapability[];
  territories: string[];          // Assigned territory IDs
  region: string;                 // Geographic region
  level: 'regional' | 'district' | 'area';
}
```

## Capability Framework

### Core Capabilities

```typescript
type CenterCapability = 
  // Territory Management
  | 'territory:view'              // View territory information
  | 'territory:edit'              // Edit territory boundaries and config
  | 'territory:create'            // Create new territories
  | 'territory:delete'            // Remove territories
  | 'territory:assign'            // Assign territories to managers
  
  // Contractor Management
  | 'contractor:view'             // View contractor profiles
  | 'contractor:assign'           // Assign contractors to territories
  | 'contractor:evaluate'         // Access performance evaluations
  | 'contractor:suspend'          // Suspend contractor access
  
  // Customer Management
  | 'customer:view'               // View customer information
  | 'customer:edit'               // Edit customer details
  | 'customer:territory_assign'   // Assign customers to territories
  
  // Order Management
  | 'order:view'                  // View orders in region
  | 'order:assign'                // Assign orders to contractors
  | 'order:escalate'              // Escalate orders to management
  | 'order:cancel'                // Cancel orders
  | 'order:priority_set'          // Set order priority levels
  
  // Performance and Reporting
  | 'metrics:view'                // View performance metrics
  | 'metrics:export'              // Export performance reports
  | 'analytics:access'            // Access advanced analytics
  
  // Center Operations
  | 'center:profile_edit'         // Edit center profile
  | 'center:hours_edit'           // Edit operating hours
  | 'center:services_edit'        // Edit available services
  
  // Support and Escalation
  | 'support:create'              // Create support tickets
  | 'support:view'                // View support tickets
  | 'escalation:manage'           // Manage escalated issues;
```

## Permission Levels

### Hierarchical Access

```typescript
interface PermissionLevel {
  level: 'regional' | 'district' | 'area';
  scope: {
    territories: string[];        // Accessible territory IDs
    contractors: string[];        // Manageable contractor IDs
    orders: OrderScope;           // Order access scope
  };
}

interface OrderScope {
  can_view_all: boolean;          // Can view all regional orders
  can_assign_any: boolean;        // Can assign any available contractor
  value_limit?: number;           // Maximum order value manageable
  priority_limit?: OrderPriority; // Highest priority assignable
}
```

### Regional Manager (Level: Regional)
- Full access to all territories in region
- Can assign/reassign contractors across territories
- Can manage high-priority and high-value orders
- Access to regional performance analytics
- Can create and manage territories

### District Coordinator (Level: District)
- Access to assigned district territories only
- Can assign contractors within district
- Limited to medium-priority orders
- Basic performance metrics access
- Cannot create/delete territories

### Area Supervisor (Level: Area)
- Access to specific territory/area only
- Can assign contractors to own territory
- Limited to standard orders
- Basic operational metrics only
- Read-only territory information

## Data Access Patterns

### Territory-Based Access

```typescript
function checkTerritoryAccess(
  user: CenterUser, 
  territoryId: string
): boolean {
  // Check if user has access to this territory
  return user.territories.includes(territoryId) || 
         user.level === 'regional';
}

function filterOrdersByAccess(
  orders: CenterOrder[], 
  user: CenterUser
): CenterOrder[] {
  return orders.filter(order => {
    // Filter based on territory access
    if (!checkTerritoryAccess(user, order.territory_id)) {
      return false;
    }
    
    // Apply value limits
    if (user.scope.orders.value_limit && 
        order.estimated_value > user.scope.orders.value_limit) {
      return false;
    }
    
    return true;
  });
}
```

### Customer Data Protection

```typescript
interface CustomerDataAccess {
  can_view_personal: boolean;     // Can view PII
  can_view_financial: boolean;    // Can view payment info
  can_export_data: boolean;       // Can export customer data
  territory_restricted: boolean;  // Limited to own territories
}

function getCustomerDataAccess(user: CenterUser): CustomerDataAccess {
  return {
    can_view_personal: user.capabilities.includes('customer:view'),
    can_view_financial: user.level === 'regional',
    can_export_data: user.capabilities.includes('metrics:export'),
    territory_restricted: user.level !== 'regional'
  };
}
```

## Authentication Flow

### Center Role Validation

```typescript
export function validateCenterRole(user: any): boolean {
  // Check role assignment
  const role = getCenterRole(user);
  if (role !== 'center') return false;
  
  // Validate active status
  if (user.status !== 'active') return false;
  
  // Check territory assignments
  if (!user.territories || user.territories.length === 0) {
    return false;
  }
  
  return true;
}

export function getCenterCapabilities(user: CenterUser): CenterCapability[] {
  const baseCaps: CenterCapability[] = [
    'territory:view',
    'contractor:view',
    'customer:view',
    'order:view',
    'metrics:view',
    'support:create'
  ];
  
  // Add level-specific capabilities
  switch (user.level) {
    case 'regional':
      return [...baseCaps, 
        'territory:create', 'territory:delete',
        'contractor:suspend', 'order:escalate',
        'analytics:access', 'metrics:export'
      ];
    case 'district':
      return [...baseCaps,
        'territory:edit', 'contractor:assign',
        'order:assign', 'order:priority_set'
      ];
    case 'area':
      return [...baseCaps,
        'contractor:assign', 'order:assign'
      ];
    default:
      return baseCaps;
  }
}
```

## API Security

### Request Authentication

```typescript
interface CenterApiHeaders {
  'x-center-user-id': string;     // Center user ID
  'x-user-role': 'center';        // Role validation
  'x-territory-scope': string;    // Comma-separated territory IDs
  'x-permission-level': string;   // Permission level
}

function buildSecureHeaders(user: CenterUser): CenterApiHeaders {
  return {
    'x-center-user-id': user.center_id,
    'x-user-role': 'center',
    'x-territory-scope': user.territories.join(','),
    'x-permission-level': user.level
  };
}
```

### Endpoint Protection

```typescript
// Protected endpoint examples
const protectedEndpoints = {
  'GET /api/center/territories': ['territory:view'],
  'PUT /api/center/territories/:id': ['territory:edit'],
  'POST /api/center/territories': ['territory:create'],
  'DELETE /api/center/territories/:id': ['territory:delete'],
  
  'GET /api/center/contractors': ['contractor:view'],
  'POST /api/center/contractors/assign': ['contractor:assign'],
  'PUT /api/center/contractors/:id/suspend': ['contractor:suspend'],
  
  'GET /api/center/orders': ['order:view'],
  'POST /api/center/orders/assign': ['order:assign'],
  'PUT /api/center/orders/:id/escalate': ['order:escalate'],
  
  'GET /api/center/metrics': ['metrics:view'],
  'GET /api/center/reports/export': ['metrics:export'],
  'GET /api/center/analytics': ['analytics:access']
};
```

## Data Encryption

### Sensitive Data Protection

```typescript
// Fields requiring encryption at rest
const encryptedFields = {
  customer: ['email', 'phone', 'address'],
  contractor: ['email', 'phone', 'ssn', 'bank_info'],
  order: ['customer_notes', 'special_instructions']
};

// Fields requiring masking in UI
const maskedFields = {
  customer: ['phone'], // Show as XXX-XXX-1234
  contractor: ['ssn'], // Show as XXX-XX-1234
  financial: ['account_number'] // Show as XXXX-1234
};
```

### Session Management

```typescript
interface CenterSession {
  user_id: string;
  center_id: string;
  role: 'center';
  level: string;
  territories: string[];
  capabilities: CenterCapability[];
  expires_at: string;
  last_activity: string;
}

export function setCenterSession(sessionData: CenterSession) {
  try {
    // Encrypt sensitive session data
    const encrypted = encryptSessionData(sessionData);
    sessionStorage.setItem('center:session', encrypted);
    sessionStorage.setItem('center:lastRole', 'center');
  } catch (error) {
    console.warn('[setCenterSession] Failed to set session', error);
  }
}
```

## Audit Logging

### Security Event Tracking

```typescript
interface SecurityAuditLog {
  event_id: string;
  user_id: string;
  action: string;
  resource: string;
  result: 'success' | 'failure' | 'unauthorized';
  ip_address: string;
  user_agent: string;
  timestamp: string;
  metadata: {
    territory_id?: string;
    affected_resource?: string;
    permission_checked: string;
  };
}

// Events requiring audit logging
const auditableActions = [
  'territory:boundary_change',
  'contractor:assignment_change', 
  'order:high_value_assignment',
  'customer:data_export',
  'metrics:sensitive_access',
  'admin:privilege_escalation'
];
```

## Compliance Requirements

### Data Privacy (GDPR/CCPA)

- Customer data access limited to business necessity
- Data retention policies enforced
- Right to erasure capabilities
- Consent management for data processing
- Data portability features

### Security Standards

- SOC 2 Type II compliance
- Encryption in transit and at rest
- Regular security assessments
- Incident response procedures
- Access review processes

### Industry Compliance

- Payment Card Industry (PCI DSS) for payment data
- Service organization controls
- Regional data residency requirements
- Cross-border data transfer restrictions

## Error Handling

### Permission Denied Responses

```typescript
interface PermissionError {
  error: 'insufficient_permissions';
  required_capability: CenterCapability;
  user_level: string;
  suggested_action: string;
}

// Example error responses
const permissionErrors = {
  territory_create: {
    error: 'insufficient_permissions',
    required_capability: 'territory:create',
    user_level: 'area',
    suggested_action: 'Contact regional manager for territory creation'
  },
  high_value_order: {
    error: 'insufficient_permissions', 
    required_capability: 'order:high_value',
    user_level: 'district',
    suggested_action: 'Escalate to regional manager for approval'
  }
};
```