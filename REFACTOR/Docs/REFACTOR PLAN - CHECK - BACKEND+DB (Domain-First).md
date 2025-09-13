REFACTOR PLAN - CHECK - BACKEND + DATABASE (Domain-First)

Purpose: Consolidate per-role Backend/DB into domain-first modules guarded by capabilities and RLS. Preserve existing API surface (`/api/:role/...`) while routing through shared domain handlers.

Legend: [EXISTS] present now, [TO CREATE] new, [TO REFACTOR] move/rename, [TO RETIRE] remove after parity

--------------------------------------------------------------------------------
BACKEND (Domain-First)

REFACTOR/Backend/
  README.md                                     [EXISTS]
  package.json                                  [EXISTS]
  tsconfig.json                                 [EXISTS]
  server/
    index.ts                                    [EXISTS]
    app.ts                                      [EXISTS]
    db/
      connection.ts                             [EXISTS]
    core/
      auth/
        authenticate.ts                         [TO REFACTOR] from middleware/auth.ts
        requireCaps.ts                          [TO REFACTOR] from middleware/requireCaps.ts
        roleContext.ts                          [TO CREATE]
      http/
        errors.ts                               [TO CREATE]
        responses.ts                            [TO CREATE]
      validation/
        zod.ts                                  [TO CREATE]
      logging/
        audit.ts                                [TO CREATE]
    domains/
      dashboard/
        routes.ts                               [TO CREATE]
        service.ts                              [TO CREATE]
        repository.ts                           [TO CREATE]
        validators.ts                           [TO CREATE]
        docs/README.md                          [TO CREATE]
      profile/
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
      directory/
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
      services/
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
      orders/
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
      reports/
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
      support/
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
      assignments/
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
      archive/
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
      inventory/        (warehouse)
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
      deliveries/       (warehouse)
        routes.ts | service.ts | repository.ts | validators.ts   [TO CREATE]
    routes/
      index.ts                                   [TO CREATE] compose domain routers
      mount.ts                                   [TO CREATE] use roleContext, authenticate, requireCaps
    docs/
      API_Surface.md                             [TO CREATE]
      ServicesDesign.md                          [TO CREATE]
      Repositories.md                            [TO CREATE]
      Validation.md                              [TO CREATE]
      Permissions.md                             [TO CREATE]
      Testing.md                                 [TO CREATE]
      Changelog.md                               [TO CREATE]
    tests/
      domains/*.spec.ts                          [TO CREATE]
      e2e/*.spec.ts                              [TO CREATE]

TO RETIRE AFTER PARITY: server/roles/* (admin, manager, contractor, customer, center, crew, warehouse)

--------------------------------------------------------------------------------
DATABASE (Domain-First)

REFACTOR/Database/
  README.md                                     [EXISTS]
  migrations/
    000_extensions.sql                           [TO CREATE]
    001_users.sql                                [TO CREATE] users, profiles, sessions
    002_rbac.sql                                 [TO CREATE] roles, permissions, role_permissions, user_overrides
    010_activity_logs.sql                        [TO CREATE] system_activity, log_activity()
    020_directory.sql                            [TO CREATE] contractors, managers, customers, centers, crew, warehouses
    030_services.sql                             [TO CREATE] service_catalog, org_services
    040_orders.sql                               [TO CREATE] orders, order_items, statuses
    050_reports.sql                              [TO CREATE] reports, feedback, attachments
    060_support.sql                              [TO CREATE] tickets, ticket_events
    070_inventory.sql                            [TO CREATE]
    071_deliveries.sql                           [TO CREATE]
  functions/
    log_activity.sql                             [TO CREATE]
    compute_caps.sql                             [TO CREATE]
  rls/
    users.rls.sql                                 [TO CREATE]
    directory.rls.sql                             [TO CREATE]
    services.rls.sql                              [TO CREATE]
    orders.rls.sql                                [TO CREATE]
    reports.rls.sql                               [TO CREATE]
    support.rls.sql                               [TO CREATE]
    inventory.rls.sql                             [TO CREATE]
  seeds/
    001_roles.sql                                 [TO CREATE]
    002_permissions.sql                           [TO CREATE]
    003_role_permissions.sql                      [TO CREATE]
    010_demo_data.sql                             [TO CREATE]
  docs/
    README.md                                     [EXISTS]
    DataModel.md                                  [EXISTS]
    Migrations.md                                 [EXISTS]
    RLS_Policies.md                               [EXISTS]
    Seeds.md                                      [EXISTS]
    Changelog.md                                  [EXISTS]

TO RETIRE AFTER PARITY: roles/*/migrations/* (admin, manager, contractor, customer, center, crew, warehouse)

--------------------------------------------------------------------------------
ROUTING SURFACE (Compatible)

Mount: /api/:role

Domains:
- /api/:role/dashboard
- /api/:role/profile
- /api/:role/directory?type=contractors|managers|customers|centers|crew|warehouses
- /api/:role/services
- /api/:role/orders
- /api/:role/reports
- /api/:role/support
- /api/:role/assignments
- /api/:role/archive
- /api/:role/inventory          (warehouse)
- /api/:role/deliveries         (warehouse)

Guards:
- authenticate → attaches req.user { userId, roleCode, capabilities }
- roleContext → sets req.context.role from path param for auditing/policy
- requireCaps('perm') → per-endpoint capability checks
- RLS → DB-level data isolation by role/capability

--------------------------------------------------------------------------------
MIGRATION MAP (Old → New)

Backend
- server/roles/*/routes/dashboard.ts      → server/domains/dashboard/routes.ts
- server/roles/*/routes/profile.ts        → server/domains/profile/routes.ts
- server/roles/*/routes/directory.ts      → server/domains/directory/routes.ts (filter by type)
- server/roles/*/services/*.ts            → server/domains/<domain>/*.ts
- server/roles/warehouse/*                → server/domains/inventory|deliveries/*

Database
- roles/*/migrations/*.sql                → consolidated migrations/<by-domain>.sql + rls/*.sql

--------------------------------------------------------------------------------
EXECUTION CHECKLIST

Phase 1 – Scaffolding
- Create server/core/{auth,http,validation,logging}                          [TO CREATE]
- Create server/domains for {dashboard,profile,directory,services,orders}    [TO CREATE]
- Add server/routes/{index.ts,mount.ts}                                      [TO CREATE]

Phase 2 – Minimum Parity (Manager/Admin first)
- Port dashboard/profile/directory endpoints to domain routes                [TO CREATE]
- Wire authenticate + roleContext + requireCaps                              [TO REFACTOR/CREATE]
- Keep existing /api/:role paths working                                     [COMPAT]

Phase 3 – Database Consolidation
- Add consolidated migrations (users, rbac, activity, directory, services…)  [TO CREATE]
- Implement RLS policies per domain                                          [TO CREATE]
- Seed roles, permissions, mappings                                          [TO CREATE]

Phase 4 – Expand Domains & Retire Old
- Port remaining domains (orders, reports, support, assignments, archive)    [TO CREATE]
- Add warehouse domains (inventory, deliveries)                              [TO CREATE]
- Retire server/roles/* and roles/*/migrations after parity                  [TO RETIRE]

Notes
- FE remains compatible (same base paths), can begin consuming consolidated endpoints incrementally.
- Capability names remain unchanged; enforcement shifts to shared middlewares and RLS.

