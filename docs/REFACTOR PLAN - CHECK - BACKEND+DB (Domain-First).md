REFACTOR PLAN - CHECK - BACKEND + DATABASE (Hybrid: Role-Scoped Composition)

Purpose: Keep a modular, per‑role repo experience while eliminating drift. Roles compose shared domain logic (backend) and apply shared RLS policies (database). API remains `/api/:role/...` so the Frontend stays unchanged.

Legend: [EXISTS] present now, [TO CREATE] new, [TO REFACTOR] move/rename, [TO RETIRE] remove after parity

--------------------------------------------------------------------------------
BACKEND (Hybrid: Roles compose Domains)

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
    domains/                                    (Shared business logic only)
      dashboard/
        routes.factory.ts                        [TO CREATE]
        service.ts                               [TO CREATE]
        repository.ts                            [TO CREATE]
        validators.ts                            [TO CREATE]
        docs/README.md                           [TO CREATE]
      profile/                                  [TO CREATE all]
      directory/                                [TO CREATE all]
      services/                                 [TO CREATE all]
      orders/                                   [TO CREATE all]
      reports/                                  [TO CREATE all]
      support/                                  [TO CREATE all]
      assignments/                              [TO CREATE all]
      archive/                                  [TO CREATE all]
      inventory/ (warehouse)                    [TO CREATE all]
      deliveries/ (warehouse)                   [TO CREATE all]
    roles/                                      (Per‑role composition only; no business logic)
      admin/
        config.ts                               [TO CREATE] feature toggles, required caps
        router.ts                               [TO CREATE] compose domain routers for admin
        docs/README.md                          [TO CREATE]
      manager/
        config.ts | router.ts | docs/README.md  [TO CREATE]
      contractor/
        config.ts | router.ts | docs/README.md  [TO CREATE]
      customer/
        config.ts | router.ts | docs/README.md  [TO CREATE]
      center/
        config.ts | router.ts | docs/README.md  [TO CREATE]
      crew/
        config.ts | router.ts | docs/README.md  [TO CREATE]
      warehouse/
        config.ts | router.ts | docs/README.md  [TO CREATE]
    routes/
      roleRegistry.ts                           [TO CREATE] map role→router
      mount.ts                                   [TO CREATE] app.use('/api/:role', roleContext, authenticate, select router)
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

TO RETIRE AFTER PARITY: server/roles/* where they duplicate domain logic (current per‑role routes/services/repos/validators)

--------------------------------------------------------------------------------
DATABASE (Hybrid: Shared Schema + Role Overlays)

REFACTOR/Database/
  README.md                                     [EXISTS]
  migrations/                                   (Shared tables by domain)
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
  rls/                                          (Shared policy templates per domain)
    users.rls.sql                                 [TO CREATE]
    directory.rls.sql                             [TO CREATE]
    services.rls.sql                              [TO CREATE]
    orders.rls.sql                                [TO CREATE]
    reports.rls.sql                               [TO CREATE]
    support.rls.sql                               [TO CREATE]
    inventory.rls.sql                             [TO CREATE]
  roles/                                        (Per‑role overlays; no tables)
    admin/
      policies.sql                               [TO CREATE] apply templates/grants for admin
      views/                                     [TO CREATE] optional role views (e.g., v_directory_admin.sql)
      seeds/capabilities.sql                      [TO CREATE] role→perm mappings (overrides)
      docs/README.md                              [TO CREATE]
    manager/                                     [TO CREATE same structure]
    contractor/                                  [TO CREATE]
    customer/                                    [TO CREATE]
    center/                                      [TO CREATE]
    crew/                                        [TO CREATE]
    warehouse/                                   [TO CREATE]
  seeds/
    001_roles.sql                                 [TO CREATE]
    002_permissions.sql                           [TO CREATE]
    003_role_permissions.sql                      [TO CREATE]
    010_demo_data.sql                             [TO CREATE]
  docs/
    DataModel.md                                  [EXISTS]
    Migrations.md                                 [EXISTS]
    RLS_Policies.md                               [EXISTS]
    Seeds.md                                      [EXISTS]
    Changelog.md                                  [EXISTS]

TO RETIRE AFTER PARITY: Database/roles/*/migrations/* (per‑role schemas)

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
MIGRATION MAP (Old → Hybrid)

Backend
- server/roles/*/routes/dashboard.ts      → server/domains/dashboard/routes.factory.ts + roles/<role>/router.ts
- server/roles/*/routes/profile.ts        → server/domains/profile/routes.factory.ts + roles/<role>/router.ts
- server/roles/*/routes/directory.ts      → server/domains/directory/routes.factory.ts + roles/<role>/router.ts
- server/roles/*/services/*.ts            → server/domains/<domain>/*.ts (shared)
- server/roles/warehouse/*                → server/domains/inventory|deliveries/* (shared)

Database
- roles/*/migrations/*.sql                → consolidated migrations/<by-domain>.sql + rls/*.sql (shared)
- role-specific views/policies            → roles/<role>/{policies.sql,views/*,seeds/capabilities.sql}

--------------------------------------------------------------------------------
EXECUTION CHECKLIST

Phase 1 – Scaffolding
- Create server/core/{auth,http,validation,logging}                          [TO CREATE]
- Create server/domains for {dashboard,profile,directory,services,orders}    [TO CREATE]
- Add server/roles/* with {config.ts,router.ts} for admin/manager            [TO CREATE]
- Add server/routes/{roleRegistry.ts,mount.ts}                               [TO CREATE]

Phase 2 – Minimum Parity (Manager/Admin first)
- Port dashboard/profile/directory into domain factories                     [TO CREATE]
- In roles/admin|manager/router.ts compose domain routers with caps          [TO CREATE]
- Wire authenticate + roleContext + requireCaps                              [TO REFACTOR/CREATE]
- Keep existing /api/:role paths working                                     [COMPAT]

Phase 3 – Database Consolidation
- Add shared migrations (users, rbac, activity, directory, services…)        [TO CREATE]
- Implement shared RLS templates per domain                                  [TO CREATE]
- Add roles/<role> overlays (policies.sql, views/, seeds/capabilities.sql)   [TO CREATE]

Phase 4 – Expand + Retire Old
- Port remaining domains (orders, reports, support, assignments, archive)    [TO CREATE]
- Add warehouse domains (inventory, deliveries)                              [TO CREATE]
- Retire duplicated server/roles/* logic and per-role migrations             [TO RETIRE]

Notes
- Frontend remains modular and unchanged; API paths remain `/api/:role/...`.
- Variation lives in role config/overlays; business logic lives once in domains.
