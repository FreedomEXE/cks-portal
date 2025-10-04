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

## 13. Certification Via Training (Managers, Crew, Warehouses)

Problem with ad‑hoc assignment
- Manually “assigning” a service to a user as a proxy for certification does not scale and lacks auditability/skills validation.
- For MVP we paused this; treat any current assignment data as temporary.

Proposed model
- Certification is earned by completing training modules/tests tied to a service (and optionally, role + level).
- Entities:
  - `training_modules(module_id, service_id, role, version, prerequisites, pass_score, expires_after_days, metadata)`
  - `training_enrollments(user_id, module_id, status[pending|in_progress|passed|failed], score, started_at, completed_at, assessor_id, evidence, metadata)`
  - `service_certifications(user_id, service_id, role, issued_at, expires_at, source_enrollment_id, revoked_at, metadata)`
- “My Services” lists services for which the user holds an active (non‑expired) certification.

Workflow
- Admin (or org admin/manager later) assigns/enrolls users into modules.
- User completes curriculum/tests; automatic or assessor verification records result.
- Passing creates/renews `service_certifications` with `expires_at` (optional) and links back to enrollment.
- Revocation/expiry removes the service from “My Services.”

Governance & UX
- Versioned modules allow re‑certification when content changes.
- Role‑specific tracks (manager vs crew) with different pass criteria.
- Admin override (issue/revoke) with reason and audit event.

Migration/Transition
- If any ad‑hoc `service_certifications` exist from MVP, migrate them to stub `training_enrollments` with an issued certification and short expiry; backfill via real training over time.

Impacted surfaces
- Manager/Crew/Warehouse Hubs: “My Services” fed by active certifications (not global role flags).
- Admin: manage training modules, view enrollments, approve/verifications, report on status/expiry.

## 16. Warehouse-Scoped Catalog (Availability by Location)

**Current State:**
- Catalog items come from `catalog_products` and are shown only when there is at least one non-archived `inventory_items` row with stock. MVP assumes a single warehouse, so the catalog is effectively global.

**Problem Post-MVP:**
- Multi-warehouse deployments need centers/customers to see a catalog limited to their assigned warehouse(s).

**Recommendations:**
- Add a warehouse→center mapping:
  - Simple: `centers.default_warehouse_id` (one-to-one)
  - Flexible: `center_warehouses(center_id, warehouse_id)` (many-to-many)
- Backend filter:
  - Resolve allowed warehouses from the viewer (warehouse → own WHS; center → assigned WHS; contractor → union of their centers; manager/admin → unrestricted).
  - In the catalog query, require:
    `EXISTS (SELECT 1 FROM inventory_items ii
             WHERE ii.item_id = p.product_id
               AND ii.warehouse_id = ANY($allowedWarehouses)
               AND ii.status = 'active'
               AND ii.archived_at IS NULL
               AND ii.quantity_on_hand > 0)`.
- API surface:
  - Keep endpoint unchanged; derive allowed warehouses server-side from auth/hub context.
  - Optional `warehouse=` override for admins.
- UI:
  - No changes needed; same catalog view automatically scopes items.
- Indexing:
  - Add composite index `(warehouse_id, item_id, status, archived_at)` on `inventory_items`.

**Why Post-MVP:**
- MVP has a single warehouse; global availability suffices. Scoping adds mapping and auth logic that are easy to layer in later without UI changes.

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

## 19. Component Organization Refactor

**Current State:**
- UI components scattered across multiple locations causing confusion
- Components exist in:
  - `packages/ui` - Core UI components
  - `packages/domain-widgets` - Domain-specific widgets
  - `packages/auth` - Auth-related components (login/signup)
  - `apps/frontend/src/components` - App-specific components
  - `apps/frontend/src/hubs/components` - Hub-specific components
  - `apps/frontend/src/pages` - Page components
  - `apps/frontend/src/contexts` - Context providers

**Problems:**
- Developer confusion about where to create/find components
- Duplication of similar components in different locations
- Inconsistent patterns and styles
- Difficult maintenance and updates
- Confusing onboarding for new developers and AI assistants

**Recommended Structure:**
```
packages/
  ui/                    # Pure, reusable UI components
    Button, Card, Modal, DataTable, etc.

  domain-widgets/        # Business logic components
    OrdersSection, ProfileCard, ReportsSection, etc.

  features/             # Feature-specific components (NEW)
    auth/               # Login, Signup, AuthGuard, etc.
    catalog/            # CatalogCard, CartPanel, DateSelector, etc.
    orders/             # OrderCard, OrderWorkflow, OrderActions, etc.
    hubs/               # Hub-specific shared components

apps/frontend/
  src/
    pages/              # Page compositions only (no business logic)
    layouts/            # Layout wrappers
    hooks/              # Custom hooks
    contexts/           # Global contexts only
    utils/              # Utilities
```

**Migration Strategy:**

### Phase 1: Documentation (Week 1)
- Create `COMPONENT_GUIDELINES.md` with clear rules
- Document current locations and intended destinations
- Establish naming conventions

### Phase 2: New Component Guidelines (Immediate)
- All new reusable components go in `packages/domain-widgets`
- Hub-specific components temporarily stay in place
- Stop creating components in `apps/frontend/src/components`

### Phase 3: Gradual Migration (3-6 months)
- When modifying a component, move it to proper location
- Update imports across the codebase
- Add deprecation warnings to old locations

### Phase 4: Final Cleanup (6+ months)
- Remove empty component directories
- Update all documentation
- Enforce structure through linting rules

**Benefits:**
- Clear mental model for developers
- Reduced duplication
- Better code reuse
- Faster development
- Easier testing strategy
- Improved discoverability

## 20. Organization Layer for Multi-Tenancy

**Current State:**
- Manager-based hierarchy provides ecosystem isolation
- Each manager manages multiple contractors with isolated data
- Data isolation achieved through SQL filters based on relationships
- No concept of "organization" at the data layer

**Why Not MVP:**
- Current system handles single-company (CKS) with multiple managers perfectly
- SQL filters properly isolate contractor ecosystems under same manager
- No immediate need for cross-company separation
- Would require major refactor (add `org_id` to all tables, update all queries)

**When You Would Need It:**
1. **Multi-company SaaS** - Serving multiple companies (Company-A shouldn't see Company-B's data)
2. **Franchise Model** - Each franchise is an org with multiple managers
3. **White-label** - Selling to different organizations that need complete separation
4. **Multiple CKS Divisions** - If CKS expands to multiple independent business units

**Proposed Architecture:**
```
Organization (ORG-001: "CKS Northeast")
├── Manager MGR-001
│   ├── Contractor CON-001 (isolated ecosystem)
│   └── Contractor CON-002 (isolated ecosystem)
└── Manager MGR-002
    ├── Contractor CON-003 (isolated ecosystem)
    └── Contractor CON-004 (isolated ecosystem)

Organization (ORG-002: "CKS Southwest")
└── Manager MGR-003
    └── Contractor CON-005
```

**Implementation Requirements:**
- Add `org_id` column to: users, managers, contractors, customers, centers, crew, warehouses, orders, inventory
- Update all SQL queries to include `org_id` filter
- Simplify visibility filters (single `org_id` check vs. complex joins)
- Add org selection/switching in admin panel
- Implement org-level configuration and settings
- Add org-aware auth guards

**Benefits:**
- Cleaner data isolation (simple `WHERE org_id = $1` vs. nested joins)
- True multi-tenancy support
- Organization-level analytics and reporting
- Easier white-labeling and customization per org
- Support for multi-manager organizations

**Migration Path:**
1. Add `org_id` column to all tables (default to 'CKS-001' for existing data)
2. Update auth system to track active org
3. Refactor all SQL queries to include org filter
4. Add org management UI to admin panel
5. Implement org-level settings and configuration
6. Test data isolation thoroughly

**Success Metrics:**
- Complete data isolation between orgs (verified through testing)
- Query performance maintained or improved
- Simplified codebase (reduced complexity in filters)
- Support for unlimited organizations without code changes

## 21. Admin Hub: Ecosystem Visualization

**Current State:**
- Admin hub shows all entities in flat lists (managers, contractors, customers, centers, crew, warehouses)
- No visual representation of ecosystem hierarchies
- Difficult to understand relationships between entities at a glance
- No way to see which contractor's ecosystem a customer/center belongs to

**Problem:**
- Admins can't quickly identify which entities belong to which ecosystem
- Troubleshooting relationship issues requires checking multiple tables
- No overview of ecosystem health or completeness
- Cannot easily see orphaned entities or missing relationships

**Proposed Feature: Ecosystem View**

### Visual Hierarchy Display:
```
📊 Ecosystems Dashboard

Manager: John Smith (MGR-001)
├─ 🏢 Contractor: ABC Services (CON-001)
│  ├─ 👤 Customer: ACME Corp (CUS-001)
│  │  ├─ 🏪 Center: ACME Downtown (CEN-001) [5 crew]
│  │  └─ 🏪 Center: ACME Uptown (CEN-002) [3 crew]
│  └─ 👤 Customer: Tech Industries (CUS-002)
│     └─ 🏪 Center: Tech HQ (CEN-003) [8 crew]
│
└─ 🏢 Contractor: XYZ Solutions (CON-002)
   ├─ 👤 Customer: BuildCo (CUS-003)
   │  └─ 🏪 Center: BuildCo Warehouse (CEN-004) [2 crew]
   └─ 👤 Customer: RetailMart (CUS-004)
      ├─ 🏪 Center: RetailMart Store 1 (CEN-005) [4 crew]
      └─ 🏪 Center: RetailMart Store 2 (CEN-006) [4 crew]

Manager: Sarah Johnson (MGR-002)
└─ 🏢 Contractor: DEF Logistics (CON-003)
   └─ 👤 Customer: ShipFast (CUS-005)
      └─ 🏪 Center: Distribution Hub (CEN-007) [12 crew]

⚠️ Orphaned Entities:
- 👤 Customer: Unassigned LLC (CUS-999) - No contractor
- 🏪 Center: Test Location (CEN-998) - No customer
- 👷 Crew: John Doe (CRW-999) - No assigned center
```

### Features:
1. **Tree View** - Collapsible hierarchy showing manager → contractor → customer → center → crew
2. **Entity Counts** - Show counts at each level (e.g., "5 crew members")
3. **Health Indicators** - Icons showing incomplete setups (missing manager, no crew assigned, etc.)
4. **Quick Actions** - Click any entity to view details or edit
5. **Filtering** - Filter by manager, contractor, status (active/inactive)
6. **Search** - Search across all entities in the tree
7. **Orphaned Entity Detection** - Highlight entities with missing relationships

### Implementation:
```typescript
// New endpoint: GET /api/admin/ecosystems
{
  "ecosystems": [
    {
      "manager": { "id": "MGR-001", "name": "John Smith", ... },
      "contractors": [
        {
          "contractor": { "id": "CON-001", "name": "ABC Services", ... },
          "customers": [
            {
              "customer": { "id": "CUS-001", "name": "ACME Corp", ... },
              "centers": [
                {
                  "center": { "id": "CEN-001", "name": "ACME Downtown", ... },
                  "crewCount": 5,
                  "activeOrders": 3
                }
              ]
            }
          ]
        }
      ],
      "stats": {
        "contractorCount": 2,
        "customerCount": 4,
        "centerCount": 6,
        "crewCount": 38
      }
    }
  ],
  "orphaned": {
    "customers": [...],
    "centers": [...],
    "crew": [...]
  }
}
```

### UI Components:
- `EcosystemTree` - Recursive tree component
- `EcosystemCard` - Collapsible card for each manager's ecosystem
- `EntityNode` - Individual entity display with icon and quick actions
- `OrphanedEntitiesPanel` - Warning panel for entities with missing relationships

### Benefits:
- **Visual Clarity** - See entire ecosystem structure at a glance
- **Quick Troubleshooting** - Identify relationship issues immediately
- **Better Data Quality** - Orphaned entity detection helps clean up data
- **Ecosystem Health Monitoring** - See which ecosystems are complete vs. incomplete
- **Faster Navigation** - Jump to any entity in context

**Priority:** Medium (Post-MVP Month 2-3)

**Effort:** 1-2 weeks
- Backend: 2-3 days (new endpoint, recursive query)
- Frontend: 5-7 days (tree component, UI design, interactions)
- Testing: 2-3 days

## 22. Inventory Management & Tracking System

**Current State:**
- Warehouse Hub only shows Product Inventory and Archive sections
- No visibility into which users have which inventory
- No "My Products" section for users to see their assigned/received products
- Limited inventory tracking beyond warehouse stock levels

**Problem:**
- Cannot track product distribution across users/roles/locations
- No audit trail for who has what inventory at any given time
- Users cannot easily see what products they have received or are assigned to them
- Warehouse and admin lack comprehensive inventory allocation views

**Proposed Solution:**

### Phase 1: User Inventory Tracking
- Create `user_inventory` or `inventory_allocations` table to track product assignments
  - Links orders to final recipients (center, customer, crew, contractor)
  - Tracks: product_id, user_id, role, quantity, allocated_at, source_order_id, status (allocated/in_use/returned/consumed)
  - Supports inventory lifecycle: allocated → in_use → consumed/returned

### Phase 2: "My Products" Section (All User Hubs)
- Add "My Products" widget next to "My Services" in all relevant hubs
- Shows products currently assigned/allocated to the user based on:
  - Delivered orders where they were the recipient
  - Direct allocations from inventory management
  - Products in-use vs. available vs. consumed
- Filterable by product type, status, date range
- Action buttons: Mark as Consumed, Request Return, Report Issue

### Phase 3: Warehouse Inventory Management Section
- Add "Inventory Management" tab to Warehouse Hub
- Features:
  - View all products across all users/locations
  - Filter by: user role, location, product type, allocation status
  - Bulk allocation/deallocation actions
  - Allocation history and audit trail
  - Low stock alerts per user/location
  - Reallocation workflows (move inventory between users)

### Phase 4: Admin Inventory Dashboard
- Add comprehensive inventory tracking to Admin Hub
- Views:
  - System-wide inventory distribution map
  - Per-user inventory levels and history
  - Per-location stock levels
  - Allocation patterns and analytics
  - Inventory reconciliation tools
- Export capabilities for audit/compliance

### Technical Implementation

**Database Schema:**
```sql
CREATE TABLE inventory_allocations (
  allocation_id UUID PRIMARY KEY,
  product_id VARCHAR(50) REFERENCES products(product_id),
  allocated_to_id VARCHAR(50), -- CKS code (CEN-xxx, CUS-xxx, etc.)
  allocated_to_role hub_role,
  quantity INTEGER,
  unit VARCHAR(50),
  allocated_at TIMESTAMPTZ,
  allocated_by VARCHAR(50), -- Who allocated it
  source_order_id VARCHAR(50) REFERENCES orders(order_id),
  source_type VARCHAR(20), -- 'order', 'manual', 'transfer'
  status VARCHAR(20), -- 'allocated', 'in_use', 'consumed', 'returned'
  status_changed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB
);

CREATE TABLE inventory_transactions (
  transaction_id UUID PRIMARY KEY,
  allocation_id UUID REFERENCES inventory_allocations(allocation_id),
  transaction_type VARCHAR(20), -- 'allocate', 'consume', 'return', 'transfer'
  from_user_id VARCHAR(50),
  to_user_id VARCHAR(50),
  quantity INTEGER,
  timestamp TIMESTAMPTZ,
  actor_id VARCHAR(50), -- Who performed the transaction
  notes TEXT
);
```

**Backend APIs:**
- `GET /inventory/allocations/:userId` - Get user's allocated inventory
- `GET /inventory/allocations` - Admin/warehouse view of all allocations
- `POST /inventory/allocate` - Allocate inventory to user (warehouse/admin)
- `POST /inventory/deallocate` - Remove allocation
- `PATCH /inventory/allocations/:id/status` - Update status (consume, return)
- `POST /inventory/transfer` - Transfer inventory between users
- `GET /inventory/history/:userId` - Get allocation/transaction history

**Frontend Components:**
- `MyProductsWidget` - User-facing inventory view
- `InventoryManagementSection` - Warehouse hub inventory management
- `InventoryAllocationModal` - Admin/warehouse allocation interface
- `InventoryHistoryModal` - View allocation/transaction history
- `ProductTransferModal` - Transfer inventory between users

### Use Cases

1. **Order Fulfillment Integration**
   - When order is delivered, automatically create inventory allocation
   - Link allocation to source order for audit trail
   - Recipient sees product in "My Products" immediately

2. **Inventory Redistribution**
   - Warehouse can view all allocated inventory across users
   - Transfer products from one crew to another
   - Reallocate unused inventory back to warehouse stock

3. **Consumption Tracking**
   - Users mark products as "consumed" when used
   - Consumption data feeds into analytics/reorder predictions
   - Track which products are most consumed by role/location

4. **Returns & Reconciliation**
   - Users can request product returns
   - Warehouse approves returns and updates allocations
   - Admin runs reconciliation reports comparing allocations vs. physical stock

5. **Audit & Compliance**
   - Full transaction history for every product
   - Export allocation reports for accounting/compliance
   - Track product movement across entire ecosystem

### Integration Points

- **Orders Domain**: Auto-allocate on delivery
- **Activity Log**: Track all allocation/consumption events
- **Analytics**: Consumption patterns, reorder predictions
- **Notifications**: Low stock alerts, allocation confirmations

**Priority:** Medium-High (Post-MVP Month 1-2)

**Effort:** 3-4 weeks
- Backend: 1 week (schema, APIs, order integration)
- Frontend: 2 weeks (My Products widget, Warehouse management, Admin dashboard)
- Testing: 1 week (E2E flows, data integrity, performance)

**Benefits:**
- Complete inventory lifecycle tracking
- Improved accountability (who has what)
- Better stock management and reordering decisions
- Audit trail for compliance/invoicing
- Enhanced user experience (users see their products)

---

## Success Metrics

- Reduced time to implement new features
- Decreased bug rate in production
- Improved system observability (MTTR reduction)
- Better developer experience (measured via surveys)
- Reduced technical debt (tracked via code quality metrics)
