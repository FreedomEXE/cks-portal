# Contractor Hub - Permissions & Security

## Role-Based Access Control (RBAC)

### Contractor Role Definition
```typescript
interface ContractorRole {
  role: 'contractor';
  permissions: ContractorPermission[];
  scope: 'own_data' | 'team_data';
  level: 'basic' | 'premium' | 'enterprise';
}
```

### Core Permissions
```typescript
enum ContractorPermission {
  // Profile Management
  VIEW_OWN_PROFILE = 'contractor:profile:view',
  UPDATE_OWN_PROFILE = 'contractor:profile:update',
  MANAGE_CERTIFICATIONS = 'contractor:certifications:manage',
  
  // Service Management
  VIEW_SERVICES = 'contractor:services:view',
  UPDATE_SERVICES = 'contractor:services:update',
  MANAGE_PRICING = 'contractor:services:pricing',
  MANAGE_AVAILABILITY = 'contractor:services:availability',
  
  // Order Management
  VIEW_ASSIGNED_ORDERS = 'contractor:orders:view_assigned',
  ACCEPT_ORDERS = 'contractor:orders:accept',
  DECLINE_ORDERS = 'contractor:orders:decline',
  UPDATE_ORDER_STATUS = 'contractor:orders:update_status',
  UPLOAD_ORDER_PHOTOS = 'contractor:orders:upload_photos',
  ADD_ORDER_NOTES = 'contractor:orders:add_notes',
  
  // Customer Interaction
  COMMUNICATE_WITH_CUSTOMERS = 'contractor:customers:communicate',
  VIEW_CUSTOMER_DETAILS = 'contractor:customers:view_details',
  
  // Performance & Analytics
  VIEW_OWN_METRICS = 'contractor:metrics:view_own',
  VIEW_FINANCIAL_REPORTS = 'contractor:reports:financial',
  EXPORT_REPORTS = 'contractor:reports:export',
  
  // Support & Help
  CREATE_SUPPORT_TICKETS = 'contractor:support:create_tickets',
  ACCESS_HELP_CENTER = 'contractor:support:help_center',
  
  // Activity Management
  VIEW_ACTIVITY_LOG = 'contractor:activity:view',
  CLEAR_ACTIVITY_LOG = 'contractor:activity:clear'
}
```

## Data Access Control

### Own Data Access
Contractors can access:
- ✅ Own profile and business information
- ✅ Orders assigned to them
- ✅ Own performance metrics and earnings
- ✅ Own activity history
- ✅ Own service offerings and pricing

### Restricted Data Access
Contractors cannot access:
- ❌ Other contractors' profiles or data
- ❌ Unassigned orders (until assigned)
- ❌ System-wide analytics
- ❌ Customer personal data beyond order context
- ❌ Administrative functions

### Customer Data Limitations
```typescript
interface CustomerDataAccess {
  // Allowed for assigned orders
  name: boolean;                 // ✅ For service delivery
  phone: boolean;                // ✅ For coordination
  service_address: boolean;      // ✅ For service delivery
  order_requirements: boolean;   // ✅ For completing work
  
  // Restricted data
  personal_address: boolean;     // ❌ Not needed for service
  payment_methods: boolean;      // ❌ Handled by platform
  order_history: boolean;        // ❌ Only current assignment
  financial_data: boolean;       // ❌ Platform handles billing
}
```

## Authentication & Authorization

### Authentication Requirements
```typescript
interface AuthRequirements {
  // Primary Authentication
  clerkUserId: string;           // Clerk authentication
  contractorId: string;          // Business identifier
  emailVerified: boolean;        // Email verification required
  
  // Role Verification
  roleInMetadata: 'contractor';  // Role in Clerk metadata
  contractorStatus: 'active';    // Active contractor status
  
  // Session Management
  sessionValid: boolean;         // Valid session token
  lastActivity: Date;           // Recent activity tracking
}
```

### API Authentication Headers
```typescript
const requiredHeaders = {
  'x-contractor-user-id': contractorId,
  'x-user-id': contractorId,
  'x-user-role': 'contractor',
  'x-hub-type': 'contractor',
  'Authorization': `Bearer ${clerkToken}`
};
```

### Session Security
```typescript
interface SessionSecurity {
  // Session Timeout
  maxIdleTime: 4 * 60 * 60 * 1000;      // 4 hours
  maxSessionTime: 12 * 60 * 60 * 1000;   // 12 hours
  
  // Multi-device Protection
  maxConcurrentSessions: 3;
  deviceFingerprinting: boolean;
  
  // Sensitive Actions
  requireReauth: string[];               // Actions requiring re-authentication
  rateLimiting: RateLimitConfig[];
}
```

## Feature-Level Permissions

### Tiered Access Levels
```typescript
interface AccessTiers {
  basic: {
    maxOrders: 10;                     // Monthly order limit
    features: ['dashboard', 'orders', 'profile'];
    support: 'email_only';
  };
  
  premium: {
    maxOrders: 50;
    features: ['dashboard', 'orders', 'profile', 'analytics', 'reports'];
    support: 'priority_email';
    customBranding: boolean;
  };
  
  enterprise: {
    maxOrders: 'unlimited';
    features: 'all';
    support: 'phone_support';
    customBranding: boolean;
    apiAccess: boolean;
    teamManagement: boolean;
  };
}
```

### Component-Level Security
```typescript
// Protected component wrapper
interface ProtectedComponentProps {
  requiredPermissions: ContractorPermission[];
  fallbackComponent?: React.ComponentType;
  loadingComponent?: React.ComponentType;
}

// Usage example
<ProtectedComponent
  requiredPermissions={[ContractorPermission.VIEW_FINANCIAL_REPORTS]}
  fallbackComponent={UpgradePrompt}
>
  <FinancialReports />
</ProtectedComponent>
```

## Security Policies

### Input Validation
- All user inputs sanitized and validated
- File uploads scanned for malware
- SQL injection prevention via parameterized queries
- XSS prevention via content security policy

### Data Protection
```typescript
interface DataProtectionPolicies {
  encryption: {
    atRest: 'AES-256';              // Database encryption
    inTransit: 'TLS 1.3';           // HTTPS enforcement
    sensitive: 'field_level';       // Additional encryption for PII
  };
  
  retention: {
    activityLogs: '90_days';        // Activity log retention
    orderData: '7_years';           // Order record retention
    personalData: 'user_controlled'; // User can request deletion
  };
  
  audit: {
    loginAttempts: boolean;         // Track login attempts
    dataAccess: boolean;            // Log data access
    modifications: boolean;         // Track data changes
    exports: boolean;               // Log data exports
  };
}
```

### Compliance Requirements
- **GDPR**: Data portability and deletion rights
- **CCPA**: California privacy rights compliance  
- **PCI DSS**: Payment data security (if applicable)
- **Industry Standards**: Contractor licensing and insurance verification

## Error Handling & Security

### Security Error Responses
```typescript
// Never expose internal details
const securityErrors = {
  unauthorized: 'Access denied',
  forbidden: 'Insufficient permissions',
  notFound: 'Resource not found',      // Same response for unauthorized and missing
  rateLimited: 'Too many requests'
};
```

### Audit Logging
```typescript
interface SecurityAuditLog {
  timestamp: string;
  contractorId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
}
```

---

*Security and permissions framework for Contractor hub*