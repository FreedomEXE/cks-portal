# Post-MVP Architecture Recommendations

This document tracks architectural improvements and refactorings that should be addressed after MVP launch. Many of these involve activating existing stub modules that were created but not yet implemented.

## 1. Auth Package Refactoring

**Current State:**
- Auth logic scattered across multiple domains
- Stub files exist in `/packages/auth/src/utils/` but are unused
- Clerk provisioning logic duplicated in `apps/backend/server/domains/provisioning/store.ts`

**Recommendations:**
- **Activate `/packages/auth/src/utils/user-management.ts`**
  - Move Clerk user provisioning logic here
  - Create unified interface for user creation across all roles
  - Add bulk user import capabilities

- **Activate `/packages/auth/src/utils/validation.ts`**
  - Centralize clerk_user_id validation
  - Add consistency checks between DB and Clerk
  - Implement permission validation helpers

- **Activate `/packages/auth/src/utils/session.ts`**
  - Handle bootstrap/role resolution flows
  - Manage session state across hubs
  - Add session timeout handling

- **Activate `/packages/auth/src/utils/tokens.ts`**
  - Implement proper token refresh logic
  - Add token validation utilities
  - Handle JWT claim extraction

## 2. Domain Widget Architecture

**Current State:**
- Many stub widget components exist but aren't integrated
- Widget registration system partially implemented
- Cross-hub widget sharing not fully realized

**Recommendations:**
- Complete widget registration system in `/packages/domain-widgets/`
- Implement widget composition patterns for hub dashboards
- Add widget permission boundaries
- Create widget marketplace/catalog for hub customization

## 3. API Client Consolidation

**Current State:**
- API calls scattered throughout frontend components
- No unified error handling or retry logic
- Inconsistent request/response transformations

**Recommendations:**
- Create centralized API client package
- Implement request interceptors for auth headers
- Add response caching layer
- Standardize error handling across all API calls
- Add automatic retry with exponential backoff

## 4. Database Migration System

**Current State:**
- Manual SQL scripts for schema changes
- No automated rollback capabilities
- Migrations not version controlled properly

**Recommendations:**
- Implement proper migration tooling (e.g., Prisma, Knex, or TypeORM)
- Add migration versioning and rollback support
- Create seed data management system
- Add database schema validation on startup

## 5. Testing Infrastructure

**Current State:**
- Minimal test coverage
- No E2E testing framework
- Manual testing for hub interactions

**Recommendations:**
- Set up comprehensive test suites for each package
- Add E2E tests for critical user flows
- Implement visual regression testing for UI components
- Add API contract testing
- Create test data factories for consistent test setup

## 6. Monitoring and Observability

**Current State:**
- Basic console logging
- No centralized error tracking
- Limited performance metrics

**Recommendations:**
- Integrate error tracking service (Sentry, Rollbar)
- Add performance monitoring (DataDog, New Relic)
- Implement structured logging with correlation IDs
- Add custom metrics for business KPIs
- Create alerting rules for critical failures

## 7. Hub Decoupling

**Current State:**
- Hubs tightly coupled to admin-directory data
- Role-specific logic mixed with shared components
- No clear boundaries between hub domains

**Recommendations:**
- Extract shared hub components to common package
- Implement hub-specific data loaders
- Create hub plugin architecture for extensibility
- Add hub feature flags for gradual rollout

## 8. Event System

**Current State:**
- Direct database writes for all state changes
- No event sourcing or audit trail
- Activity tracking is basic

**Recommendations:**
- Implement event bus for inter-domain communication
- Add event sourcing for critical business operations
- Create comprehensive audit trail system
- Add webhook support for external integrations

## 9. Background Job Processing

**Current State:**
- No background job system
- Long-running operations block API responses
- No retry mechanism for failed operations

**Recommendations:**
- Add job queue system (Bull, BullMQ, or similar)
- Implement scheduled jobs for maintenance tasks
- Add job retry logic with dead letter queues
- Create job monitoring dashboard

## 10. Configuration Management

**Current State:**
- Environment variables scattered across packages
- No centralized configuration validation
- Feature flags hardcoded

**Recommendations:**
- Create centralized configuration service
- Add configuration schema validation
- Implement feature flag system (LaunchDarkly, Unleash)
- Add runtime configuration updates without restart

## 11. Security Enhancements

**Current State:**
- Basic auth implementation
- No rate limiting
- Limited input validation

**Recommendations:**
- Add rate limiting middleware
- Implement CSRF protection
- Add input sanitization layer
- Implement API key management for service accounts
- Add IP allowlisting for admin operations

## 12. Performance Optimizations

**Current State:**
- No caching strategy
- Database queries not optimized
- Frontend bundle size not optimized

**Recommendations:**
- Implement Redis caching layer
- Add database query optimization (indexes, query analysis)
- Implement code splitting for frontend bundles
- Add CDN for static assets
- Implement server-side rendering for public pages

## 13. Package Publishing Cleanup

**Current State:**
- Missing "files" field in package.json files
- Packages not optimized for npm publishing

**Recommendations:**
- Add `"files": ["dist"]` to auth/package.json and other publishable packages
- Configure proper package exports and entry points
- Add prepublish scripts for build validation

## 14. Database Seeds Organization

**Current State:**
- Seeds located in `apps/backend/server/db/seeds/`
- Not following standard database structure

**Recommendations:**
- Move DB seeds from `apps/backend/server/db/seeds/` to `database/seeds/`
- Update migrate.js to reference new location
- Standardize seed file naming conventions
- Add environment-specific seed data sets

## 15. API Gateway Implementation

**Current State:**
- Gateway app exists at `/apps/gateway/` with stub files
- Has Clerk middleware already implemented in `auth/clerkMiddleware.ts`
- Stub files for router, proxy, rateLimit, telemetry, featureFlags, health
- Not actively used—all requests go directly to backend

**Why Gateway is S-tier (but not MVP critical):**
- **Single entry point**: All API traffic flows through one place for monitoring/control
- **Service isolation**: Backend services can evolve independently
- **Cross-cutting concerns**: Handle auth, rate limiting, logging once at the edge
- **Load balancing**: Distribute traffic across multiple backend instances
- **Circuit breaking**: Prevent cascading failures when services are down
- **API versioning**: Route to different backends based on API version

**Recommendations for Post-MVP Implementation:**

### Phase 1: Basic Gateway Activation (Month 1)
- Implement `index.ts` as Express server listening on port 3001
- Wire up basic proxy to forward `/api/*` requests to backend
- Move Clerk token validation to gateway (already has the middleware)
- Add request/response logging with correlation IDs
- Deploy alongside existing backend (no traffic yet)

### Phase 2: Traffic Migration (Month 2)
- Update frontend to point to gateway instead of backend directly
- Implement health checks and readiness probes
- Add basic rate limiting per user/IP
- Monitor performance impact and adjust

### Phase 3: Advanced Features (Months 3-4)
- Implement circuit breaker pattern in `proxy.ts`
- Add tenant routing in `router.ts` for multi-tenancy support
- Implement feature flags at gateway level
- Add request/response transformation capabilities
- Cache common responses (user profiles, static data)

### Phase 4: Service Decomposition (Months 5-6)
- Split backend into microservices (provisioning, identity, etc.)
- Gateway routes to appropriate service based on path
- Implement service discovery/registration
- Add API composition for complex queries

**Critical Separation of Concerns:**
- **Gateway handles**: Token validation, rate limiting, routing, circuit breaking, caching
- **Gateway does NOT handle**: Business logic, user provisioning, role management, database access
- **Auth service handles**: User creation, role assignment, permission checks
- **Gateway only validates**: "Is this token valid?" not "Can this user do X?"

**Implementation Notes:**
- Start with a simple reverse proxy, add features incrementally
- Use existing `clerkMiddleware.ts` as foundation
- Consider using established gateway frameworks (Express Gateway, Kong, or Tyk) instead of building from scratch
- Keep gateway stateless—no database connections
- All gateway config should be environment-driven

**Success Metrics:**
- Reduced backend load (via caching)
- Improved observability (single point for metrics)
- Faster feature rollout (via feature flags)
- Better resilience (circuit breakers prevent cascades)
- Simplified backend (removes cross-cutting concerns)

## 16. Hub Configuration-Driven Architecture

**Current State:**
- Empty JSON config files in `shared/roles/configs/` for each role (admin.v1.json, contractor.v1.json, etc.)
- Hubs contain hardcoded business logic and UI configuration
- No separation between configuration and implementation

**Why Configuration-Driven Hubs are S-tier:**
- **Single source of truth**: Hub behavior defined in JSON, not scattered in code
- **Runtime customization**: Change hub features without deploying code
- **A/B testing**: Serve different configs to different user segments
- **White-labeling**: Different configurations for different tenants/brands
- **Feature flags at scale**: Toggle entire sections/widgets via config
- **Versioning**: The "v1" suffix already anticipates config evolution

**Proposed Configuration Schema:**

```json
// shared/roles/configs/contractor.v1.json
{
  "metadata": {
    "role": "contractor",
    "version": "1.0.0",
    "displayName": "Contractor Portal",
    "icon": "hardhat",
    "theme": {
      "primaryColor": "#2563eb",
      "accentColor": "#10b981"
    }
  },
  "navigation": {
    "sidebarItems": [
      { "id": "dashboard", "label": "Dashboard", "icon": "home", "path": "/" },
      { "id": "jobs", "label": "Jobs", "icon": "briefcase", "path": "/jobs" },
      { "id": "crews", "label": "My Crews", "icon": "users", "path": "/crews" }
    ],
    "quickActions": [
      { "id": "new-job", "label": "New Job", "action": "createJob", "icon": "plus" }
    ]
  },
  "dashboard": {
    "layout": "grid",
    "widgets": [
      {
        "id": "stats-overview",
        "type": "stats-card",
        "gridArea": "1 / 1 / 2 / 4",
        "dataSource": "/api/contractor/stats",
        "refreshInterval": 30000
      },
      {
        "id": "recent-activity",
        "type": "activity-feed",
        "gridArea": "2 / 1 / 4 / 3",
        "dataSource": "/api/contractor/activity",
        "maxItems": 10
      }
    ]
  },
  "permissions": {
    "canCreateJobs": true,
    "canManageCrews": true,
    "canViewFinancials": true,
    "canEditProfile": true
  },
  "features": {
    "messaging": { "enabled": true, "provider": "internal" },
    "notifications": { "enabled": true, "channels": ["email", "push"] },
    "reporting": { "enabled": false },
    "bulkOperations": { "enabled": true, "maxBatchSize": 100 }
  },
  "dataFetching": {
    "endpoints": {
      "profile": "/api/contractor/profile",
      "dashboard": "/api/contractor/dashboard",
      "jobs": "/api/contractor/jobs"
    },
    "caching": {
      "profile": { "ttl": 3600, "staleWhileRevalidate": true },
      "dashboard": { "ttl": 60 }
    }
  }
}
```

**Implementation Strategy:**

### Phase 1: Config Loading Infrastructure (Week 1-2)
- Create config loader that fetches role-specific JSON at hub initialization
- Build TypeScript types from config schema
- Add config validation layer
- Implement fallback to hardcoded defaults if config fails

### Phase 2: Navigation & Layout (Week 3-4)
- Move sidebar items to config
- Make dashboard grid layout config-driven
- Extract quick actions to config
- Theme colors and branding from config

### Phase 3: Widget System (Month 2)
- Create widget registry mapping type → component
- Move widget placement to config
- Add widget-specific configuration
- Implement dynamic widget loading

### Phase 4: Permissions & Features (Month 3)
- Extract permission checks to config
- Feature flags move to config
- Data endpoints become config-driven
- Add caching strategies to config

### Phase 5: Advanced Features (Month 4+)
- Config hot-reloading in development
- Config versioning and migration system
- Per-tenant config overrides
- Config inheritance (base + role + tenant)

**Benefits:**
- **Non-engineers can modify hubs**: Product managers can tweak layouts
- **Instant rollback**: Revert config changes without code deployment
- **Experimentation**: Try new layouts/features with specific user segments
- **Reduced code complexity**: Hubs become thin rendering layers
- **Consistent behavior**: All hubs follow same config-driven pattern

**Critical Success Factors:**
- Keep business logic in code, configuration in JSON
- Config describes "what", code implements "how"
- Strong TypeScript types for configs
- Comprehensive config validation
- Good defaults when config is missing

## 17. Security Hardening & Remediation

**Current State (per Sept 23 Code Review):**
- CORS configuration: FIXED ✅ (now using proper whitelist)
- Security headers: Helmet imported but configuration needs review
- Rate limiting: Imported but needs proper configuration
- Sensitive data in logs still present
- Empty security modules in `apps/backend/server/core/fastify/`
- No CSRF protection beyond CORS
- Missing audit logging for security events

**Critical Security Fixes Still Needed:**

### Information Disclosure in Logs
**Location:** `apps/backend/server/core/auth/authenticate.ts`
```typescript
// REMOVE IN PRODUCTION:
console.log('[auth] Header received:', token ? `yes (preview: ${token.slice(0, 10)}...)` : 'no');
console.log('[auth] Verified userId:', userId);
```

### Security Module Implementation
**Empty files needing implementation:**
- `apps/backend/server/core/fastify/auth.ts`
- `apps/backend/server/core/fastify/roleGuard.ts`
- `apps/backend/server/core/fastify/requireCaps.ts`

**Post-MVP Security Roadmap:**

### Phase 1: Immediate Hardening (Week 1)
- Configure Helmet.js properly with CSP headers
- Set up rate limiting per endpoint and user
- Remove all sensitive data from logs
- Add structured logging with log levels
- Implement CSRF tokens for state-changing operations

### Phase 2: Authorization System (Week 2-3)
- Implement capability-based access control in `requireCaps.ts`
- Complete role guard implementation
- Add resource-level permissions
- Implement field-level data filtering
- Add permission caching layer

### Phase 3: Audit & Monitoring (Week 4)
- Implement comprehensive audit logging
- Add security event monitoring
- Set up intrusion detection alerts
- Create security dashboard
- Add automated vulnerability scanning

### Phase 4: Advanced Security (Month 2)
- Implement API key management for service accounts
- Add OAuth2/OIDC providers beyond Clerk
- Implement end-to-end encryption for sensitive data
- Add database encryption at rest
- Set up secrets rotation

### Security Testing Requirements
- Automated security scanning in CI/CD
- Regular penetration testing
- OWASP Top 10 compliance checks
- Dependency vulnerability scanning
- Security regression tests

### Compliance & Governance
- GDPR/CCPA compliance for data handling
- SOC 2 Type II preparation
- Security policies documentation
- Incident response procedures
- Data retention policies

**Security Best Practices Checklist:**
- [ ] All user input validated and sanitized
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (output encoding)
- [ ] Proper session management
- [ ] Secure password policies (handled by Clerk)
- [ ] HTTPS enforcement in production
- [ ] Security headers properly configured
- [ ] Regular security updates and patches
- [ ] Principle of least privilege
- [ ] Defense in depth strategy

## Priority Matrix

### High Priority (Address within 1-2 months post-MVP)
1. Auth Package Refactoring
2. API Client Consolidation
3. Database Migration System
4. Monitoring and Observability

### Medium Priority (3-6 months post-MVP)
5. Testing Infrastructure
6. Hub Decoupling
7. Configuration Management
8. Security Enhancements

### Low Priority (6+ months post-MVP)
9. Domain Widget Architecture
10. Event System
11. Background Job Processing
12. Performance Optimizations
13. Package Publishing Cleanup
14. Database Seeds Organization

## Implementation Notes

- Each refactoring should be done incrementally to avoid disrupting production
- Create feature flags for gradual rollout of architectural changes
- Maintain backwards compatibility during transition periods
- Document migration paths for existing code
- Consider creating a dedicated "platform team" to handle these improvements

## 18. Role-Based Logic Separation & Store Refactoring

**Current State:**
- Large monolithic store files (scope/store.ts at 1186 lines, provisioning/store.ts at 803 lines, assignments/store.ts at 712 lines)
- Role-specific business logic duplicated across multiple functions
- Each role has its own nearly-identical function (6x duplication for 6 roles)
- Mixed concerns: domain logic, role rules, data access, and business validation all in single files

**Problem Analysis:**
The scope/store.ts explosion to 1186 lines occurred because:
- Added 6 separate scope builder functions (getManagerRoleScope, getContractorRoleScope, etc.) ~150 lines each
- Added 6 separate activity builder functions (getManagerActivities, getContractorActivities, etc.) ~100 lines each
- Each function contains 80% identical code with minor query variations
- No abstraction or shared logic between role implementations

**Similar patterns in other stores:**
- **provisioning/store.ts**: createManager, createContractor, createCustomer, createCenter, createCrew, createWarehouse
- **assignments/store.ts**: assign/unassign functions for each role relationship combination
- **archive/store.ts**: Likely to grow with role-specific archive rules

**Architectural Debt Impact:**
- Adding new features requires modifying 6+ places
- Bug fixes must be applied to multiple duplicate functions
- Testing burden multiplied by role count
- Difficult to ensure consistency across roles
- High cognitive load for developers

### Recommended Refactoring Strategy

#### Phase 1: Extract Role Strategies (Week 1-2)
Create role-specific strategy files that define behavior, not implementation:

```typescript
// domains/scope/strategies/index.ts
export interface RoleScopeStrategy {
  includeRelationships: string[];
  includeUpward: string[];  // Empty for most, ['center'] for crew
  activityFilters: string[];
  summaryMetrics: string[];
}

// domains/scope/strategies/contractor.strategy.ts
export const contractorStrategy: RoleScopeStrategy = {
  includeRelationships: ['customers', 'centers', 'crew'],
  includeUpward: [],  // Contractors don't see managers
  activityFilters: ['contractorId'],
  summaryMetrics: ['customerCount', 'centerCount', 'crewCount', 'serviceCount']
};

// Single generic function replaces 6 role-specific ones
async function getRoleScope(role: HubRole, cksCode: string) {
  const strategy = strategies[role];
  return buildScopeWithStrategy(cksCode, strategy);
}
```

#### Phase 2: Separate Concerns (Week 3-4)

```
domains/
├── scope/
│   ├── store.ts                    # Generic scope operations (200 lines)
│   ├── strategies/                 # Role-specific rules
│   │   ├── index.ts               # Strategy interface
│   │   ├── manager.strategy.ts    # Manager-specific rules (50 lines)
│   │   ├── contractor.strategy.ts # Contractor rules (50 lines)
│   │   └── ...                    # Other roles
│   ├── queries/                    # SQL query builders
│   │   └── scope.queries.ts       # Reusable query functions
│   └── transformers/               # Data transformation
│       └── scope.transformer.ts   # Format API responses
│
├── provisioning/
│   ├── store.ts                    # Generic entity creation (150 lines)
│   ├── validators/                 # Role-specific validation
│   │   └── role-validators.ts
│   └── templates/                  # Role creation templates
│       └── role-templates.ts
│
└── permissions/                    # NEW - Centralized permissions
    ├── policies/
    │   ├── manager.policy.ts
    │   ├── contractor.policy.ts
    │   └── ...
    └── rbac.ts                     # Role-based access control
```

#### Phase 3: Implement RBAC Layer (Month 2)

Create single source of truth for permissions:

```typescript
// domains/permissions/rbac.ts
export const permissions = {
  manager: {
    scope: {
      view: ['contractors', 'customers', 'centers', 'crew'],
      edit: ['contractors', 'customers', 'centers', 'crew']
    },
    reports: {
      view: ['all'],
      create: ['report', 'feedback']
    }
  },
  contractor: {
    scope: {
      view: ['customers', 'centers', 'crew'],
      edit: ['customers', 'centers']
    },
    reports: {
      view: ['own', 'subordinate'],
      create: ['feedback']
    }
  }
  // ... other roles
};

// Use in any domain
function canView(role: HubRole, resource: string): boolean {
  return permissions[role]?.scope?.view?.includes(resource) ?? false;
}
```

#### Phase 4: Query Builder Pattern (Month 2-3)

Replace duplicate SQL with composable builders:

```typescript
// domains/shared/query-builder.ts
class ScopeQueryBuilder {
  private baseQuery: string;
  private joins: string[] = [];
  private conditions: string[] = [];

  forRole(role: HubRole): this {
    const strategy = strategies[role];
    this.applyStrategy(strategy);
    return this;
  }

  includeRelationship(type: string): this {
    const joinMap = {
      'customers': 'LEFT JOIN customers ON ...',
      'centers': 'LEFT JOIN centers ON ...'
    };
    this.joins.push(joinMap[type]);
    return this;
  }

  build(): string {
    return `${this.baseQuery} ${this.joins.join(' ')} WHERE ${this.conditions.join(' AND ')}`;
  }
}

// Usage - replaces 6 different functions
const query = new ScopeQueryBuilder()
  .forRole('contractor')
  .includeRelationship('customers')
  .includeRelationship('centers')
  .build();
```

### Expected Outcomes

**File size reduction:**
- scope/store.ts: 1186 → ~200 lines (83% reduction)
- provisioning/store.ts: 803 → ~150 lines (81% reduction)
- assignments/store.ts: 712 → ~150 lines (79% reduction)

**Development velocity improvements:**
- Add new feature: Modify 1 strategy file instead of 6 functions
- Fix bug: Single fix applies to all roles automatically
- Add validation: One validator works for all roles
- Test coverage: Test strategy + generic function, not 6x duplication

**Code quality improvements:**
- Single source of truth for role behaviors
- Clear separation of concerns
- Testable, composable units
- Reduced cognitive load
- Easier onboarding for new developers

### Migration Strategy

1. **Start with new features**: Implement new features using the pattern
2. **Gradual refactoring**: Refactor one domain at a time
3. **Maintain compatibility**: Keep old functions as wrappers during transition
4. **Feature flag protection**: Use flags to switch between old/new implementations
5. **Comprehensive testing**: Ensure behavior parity before removing old code

### Success Metrics

- Lines of code reduced by 70%+ in store files
- Time to implement role-related features reduced by 50%
- Bug rate in role logic reduced by 60%
- Test coverage increased to 80%+
- Developer satisfaction improved (measured via survey)

## Success Metrics

- Reduced time to implement new features
- Decreased bug rate in production
- Improved system observability (MTTR reduction)
- Better developer experience (measured via surveys)
- Reduced technical debt (tracked via code quality metrics)