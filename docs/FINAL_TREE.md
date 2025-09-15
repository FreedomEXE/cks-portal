CKS-Portal/                                 # Monorepo root (pnpm workspaces, prod-ready)
  .editorconfig                              # Consistent editor settings
  .gitignore                                 # Ignore build/artifact/temp (incl. node_modules)
  .gitattributes                             # Normalize line endings (LF) / text=auto
  .nvmrc                                     # Pin Node version
  pnpm-workspace.yaml                        # Single lockfile + workspace packages
  .prettierrc.json                           # Prettier formatting rules
  .prettierignore                            # Files/dirs excluded from Prettier
  .eslintrc.cjs                              # ESLint config (TS + import boundaries)
  .eslintignore                              # Ignore patterns for ESLint
  .dockerignore                              # Exclude junk from Docker build context
  .vscode/                                   # Editor workspace settings (checked in)
    settings.json                            # Formatting, ESLint, files.associations, etc.
    extensions.json                          # Recommended VS Code extensions
    launch.json                              # Debug configs (Gateway/Backend/Frontend)
    tasks.json                               # Common tasks (typecheck, test, build)
  .claude/                                   # (Optional) AI assistant prefs/snippets
    config.json                              # Prompts/settings for your local workflow
  docker-compose.yml                         # Local/CI stack (gateway, api, worker, postgres, redis)
  Dockerfile.backend                         # Backend container (Fastify API)
  Dockerfile.frontend                        # Frontend container (Vite app)
  Dockerfile.worker                          # Worker container

  infra/                                     # IaC (Terraform/Pulumi)
    main.tf                                  # Core infra resources
    variables.tf                             # Terraform variables
    outputs.tf                               # Outputs
    policies/                                # Policy-as-code checks
      terraform.rego                         # OPA checks for TF
      security.rego                          # Security rules (no public buckets, encryption)
    alerts/                                  # Dashboards + alerts (as code)
      grafana-dashboards.json                # Grafana dashboards
      alert-rules.yaml                       # Alert definitions

  .github/                                   # CI/CD pipelines and gates
    workflows/
      ci.yml                                 # Backend/Frontend/DB/E2E/Preview + codegen drift gate
      codeql.yml                             # CodeQL scanning
      renovate.json                          # Dependency updates
      sbom.yml                               # CycloneDX SBOM generation
      provenance.yml                         # SLSA build provenance
      dast.yml                               # OWASP ZAP baseline

  .husky/
    pre-commit                               # Pre-commit hooks (lint/typecheck/tests)
    pre-push                                 # Run codegen + typecheck + tests before push

  package.json                               # Root scripts (dev/build/test/e2e) + workspaces
  scripts/
    devctl.js                                # Dev orchestration helper
    run-dev.js                               # One-command local dev runner
    prebuild-codegen.mjs                     # Runs contracts/roles codegen pre-build
    create-cks-skeleton.sh                   # Bootstrap skeleton (bash)
    create-cks-skeleton.ps1                  # Bootstrap skeleton (PowerShell)

  docs/                                      # Living documentation (ops + dev)
    README.md                                # Overview and quickstart
    Architecture.md                          # High-level system architecture
    API_Surface.md                           # Current public/internal API surface
    APIVersioning.md                         # Versioning + deprecation timelines
    DomainDesign.md                          # Domains and boundaries
    Permissions.md                           # RBAC/ABAC model and caps
    Testing.md                               # Testing strategy (unit→e2e→perf→chaos)
    Runbooks.md                              # On-call runbooks (incidents/playbooks)
    Observability.md                         # Tracing/logging/metrics guidance
    Environments.md                          # Env matrix (local/stage/prod vars)
    Oncall.md                                # Pager rotation and escalation paths
    Backups.md                               # RPO/RTO, backup/restore procedures
    Security.md                              # Secrets mgmt + rotation cadence
    Alerts.md                                # What alerts mean + where to see them
    Compliance.md                            # SBOM/provenance/audit notes
    PerformanceBudgets.md                    # Perf budgets (API P95/FE LCP/TTI/bundle)
    Changelog.md                             # Change history
    Authentication.md                        # Auth flows and roles
    CustomIdSystem.md                        # External ID prefixes and rules
    ClerkIntegration.md                      # Clerk setup/keys/callbacks
    Codegen.md                               # Contracts/roles generation and drift checks
    FASTIFY-CUTOVER-CHECKLIST.md             # Stepwise Express→Fastify cutover plan
    GatewayCutoverPlan.md                    # Staged gateway rollout and toggles

  Auth/                                      # Auth package (Clerk provider + hooks/UI)
    package.json                             # Auth package scripts/deps
    tsconfig.json                            # TS config for Auth
    Dockerfile                               # Auth container (if served separately)
    src/
      providers/
        ClerkProvider.tsx                    # App-level Clerk context provider
        AuthContext.tsx                      # Local auth context (derived state)
      hooks/
        useAuth.ts                           # Auth state (signed in/out)
        useUser.ts                           # Current user info
        useRole.ts                           # Current role/caps
        useCustomId.ts                       # Custom ID access (CUS-/WHS-/CRW-)
      pages/
        Login.tsx                            # Hosted login page
        Callback.tsx                         # OAuth/JWT callback handler
        Logout.tsx                           # Sign-out flow
        Invite.tsx                           # Accept invite + set password
      components/
        ProtectedRoute.tsx                   # Route guard wrapper
        RoleGuard.tsx                        # Role-based UI guard
      utils/
        tokenValidator.ts                    # Verify Clerk JWT (shape/claims)
        roleExtractor.ts                     # Derive role from claims/customId
        customIdParser.ts                    # Parse/validate external ID prefix
        clerkClient.ts                       # Clerk SDK client helpers
      types/
        auth.d.ts                            # Auth-related type decls
    tests/
      providers.spec.tsx                     # Provider render/redirect tests
      hooks.spec.ts                          # Hooks behavior tests
      roleExtractor.spec.ts                  # Role extraction tests
      customIdParser.spec.ts                 # ID parser tests

  Gateway/                                   # Thin API gateway
    package.json                             # Gateway deps/scripts
    tsconfig.json                            # TS config
    src/
      index.ts                               # Entry point
      router.ts                              # Tenant routing
      auth.ts                                # Edge auth (JWT/header sanitize)
      rateLimit.ts                           # Rate limiting middleware
      telemetry.ts                           # Logging + trace context
      config.ts                              # Upstreams/timeouts
      featureFlags.ts                        # Gateway feature toggles (versioning/ratelimit/proxy)
      proxy.ts                               # Proxy with circuit breaker/retries
      versions.ts                            # API version negotiation (v1 default)
      health.ts                              # /healthz + /readyz endpoints
      auth/
        clerkMiddleware.ts                   # Clerk JWT verification at edge
        customIdInjector.ts                  # Add parsed external ID to headers
    tests/
      router.spec.ts                         # Tenant routing tests
      versions.spec.ts                       # Version negotiation tests
      proxy.spec.ts                          # Proxy/circuit breaker tests

  Backend/                                   # Core backend app (modular monolith)
    package.json                             # Backend scripts/deps
    tsconfig.json                            # TS config (dev)
    tsconfig.build.json                      # Build-only config (excludes tests/_legacy)
    .env.example                             # DATABASE_URL/PGSSLMODE/PORT/CLERK_* keys
    server/
      index.ts                               # API bootstrap (behind Gateway)
      fastify.ts                             # Fastify init + plugins
      compat/                                # Optional Express→Fastify bridge for cutover
        expressAdapter.ts                    # Wrap legacy handlers to Fastify
        expressRoutesMap.ts                  # Map legacy routes to new modules
        README.md                            # Removal plan and usage
      db/
        connection.ts                        # Postgres client + RLS session params
      core/
        auth/
          authenticate.ts                    # AuthN (sessions/tokens)
          clerkVerifier.ts                   # Verify Clerk tokens server-side
          customIdExtractor.ts               # Parse external ID → context
        fastify/
          auth.ts                            # Fastify auth hook (sets req.user/context)
          requireCaps.ts                     # Capability guard preHandler
          roleGuard.ts                       # Role/context guard helpers
        http/
          errors.ts                          # Standard error shapes
          responses.ts                       # Standard response helpers
        validation/
          zod.ts                             # Zod setup + helpers
        logging/
          audit.ts                           # Append-only audit logging
          logger.ts                          # Pino logger (reqId + redaction)
        telemetry/
          tracing.ts                         # OpenTelemetry (HTTP/DB spans)
          metrics.ts                         # Metrics exporter (Prom/OTel)
        cache/
          redis.ts                           # Redis client + helpers (TTL/idempotency)
          warmers.ts                         # Cache warming strategies (catalog/orders)
        config/
          roleResolver.ts                    # Role/capability resolution
          featureFlags.ts                    # Feature flag client
          versions.ts                        # API version registry (/api/v1)
        events/
          bus.ts                             # In-process event bus interface
          outbox.ts                          # Outbox pattern (at-least-once)
          README.md                          # Delivery semantics/backoff/idempotency
        workers/
          index.ts                           # Worker runtime bootstrap
          jobs/
            processOutbox.ts                 # Outbox dispatcher → broker
            notifyUsers.ts                   # Example async job (notifications)
      domains/                               # Domain modules (v1 routes)
        identity/
          index.ts                           # Module exports
          types.ts                           # Identity types (user/org/external_id)
          repository.ts                      # DB access for identity
          service.ts                         # Create/assign users + custom IDs
          routes.fastify.ts                  # /api/v1/identity routes
          validators.ts                      # Zod schemas (create/update)
          events.ts                          # Identity domain events
          customIdGenerator.ts               # Generate prefixed IDs (CUS-/WHS-/CRW-…)
          customIdValidator.ts               # Validate/check prefix → role mapping
        catalog/{index.ts,types.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts,events.ts}   # Catalog domain
        directory/{index.ts,types.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts,events.ts} # Directory domain
        orders/{index.ts,types.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts,events.ts}    # Orders domain
        assignments/{index.ts,types.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts,events.ts}# Assignments domain
        inventory/{index.ts,types.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts,events.ts} # Inventory domain
        deliveries/{index.ts,types.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts,events.ts}# Deliveries domain
        reports/{index.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts}                      # Reports domain
        profile/{index.ts,service.ts,routes.fastify.ts,validators.ts}                                    # Profile domain
        dashboard/{index.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts}                    # Dashboard domain
        support/{index.ts,types.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts}             # Support domain
        archive/{index.ts,types.ts,repository.ts,service.ts,routes.fastify.ts,validators.ts}             # Archive domain
      roles/                                 # GENERATED from Shared/roles (do not edit)
        admin/config.ts                        # Admin role config (backend)
        manager/config.ts                      # Manager role config (backend)
        customer/config.ts                     # Customer role config (backend)
        contractor/config.ts                   # Contractor role config (backend)
        center/config.ts                       # Center role config (backend)
        crew/config.ts                         # Crew role config (backend)
        warehouse/config.ts                    # Warehouse role config (backend)
    tests/                                     # Backend tests (deep coverage)
      auth.spec.ts                             # Auth/authz unit tests
      rls/
        users.rls.spec.ts                      # Users RLS tests
        directory.rls.spec.ts                  # Directory RLS tests
        catalog.rls.spec.ts                    # Catalog RLS tests
        orders.rls.spec.ts                     # Orders RLS tests
        assignments.rls.spec.ts                # Assignments RLS tests
        inventory.rls.spec.ts                  # Inventory RLS tests
        deliveries.rls.spec.ts                 # Deliveries RLS tests
        reports.rls.spec.ts                    # Reports RLS tests
        identity.rls.spec.ts                   # Identity RLS tests
      contracts.spec.ts                        # OpenAPI/Zod contract tests
      services/
        catalog.service.spec.ts                # Service logic tests (catalog)
        orders.service.spec.ts                 # Service logic tests (orders)
        identity.service.spec.ts               # Service logic tests (identity/custom IDs)
      http/
        catalog.http.spec.ts                   # Route happy/sad-path tests
        orders.http.spec.ts                    # Route happy/sad-path tests
        identity.http.spec.ts                  # Identity/custom ID route tests
      e2e/
        login.spec.ts                          # Playwright login flow
        jobs.spec.ts                           # Jobs end-to-end flow
        orders.spec.ts                         # Orders end-to-end flow
      fuzz/
        validators.fuzz.ts                     # zod-fuzz property tests
      perf/
        login.js                               # k6/Artillery scenario for login
        orders.js                              # k6/Artillery scenario for orders
      chaos/
        api-kill.test.ts                       # Kill API process and verify recovery
        worker-kill.test.ts                    # Kill worker and verify reprocessing

  Frontend/                                   # Frontend app (prod renderer + test interface)
    package.json                              # FE scripts/deps
    tsconfig.json                              # TS config
    vite.config.ts                             # Prod Vite config
    vite.config.test.ts                        # Test interface config
    index.html                                 # Base HTML template
    Dockerfile                                 # Frontend container
    src/
      main.tsx                                 # Production entrypoint
      auth/
        AuthWrapper.tsx                        # Wrap app with Auth provider
        useCustomId.ts                         # Read external ID from context
      hub/
        RoleHub.tsx                            # Role-based hub renderer
        roleConfigLoader.ts                    # Loader for role configs
      shared/
        api/base.ts                            # API client base (fetch/axios)
        components/{Dashboard.tsx,Directory.tsx,Profile.tsx,Orders.tsx,Reports.tsx,Support.tsx,Assign.tsx,Archive.tsx} # Shared UI
        catalog/{CatalogContext.tsx,CatalogViewer.tsx} # Catalog overlay
        schemas/roleConfig.ts                  # Zod schema for role configs
        types/api.d.ts                         # Frontend API types
        utils/customIdParser.ts                # Parse external ID on FE
      roles/                                   # GENERATED from Shared/roles (do not edit)
        admin/{index.ts,config.v1.json}
        manager/{index.ts,config.v1.json}
        customer/{index.ts,config.v1.json}
        contractor/{index.ts,config.v1.json}
        center/{index.ts,config.v1.json}
        crew/{index.ts,config.v1.json}
        warehouse/{index.ts,config.v1.json}
      test-interface/                          # CKS test interface (sandbox)
        index.tsx                              # Test entry (was test-hub-roles.tsx)
        HubTester.tsx                          # Wrapper shell for role testing
        catalog/{CatalogContext.tsx,CatalogViewer.tsx} # Test catalog components
        hub/{RoleHub.tsx,roleConfigLoader.ts}  # Test hub wiring (can import prod)
        roles/                                 # Test role bundles (sandbox)
          admin/{index.ts,config.v1.json}
          manager/{index.ts,config.v1.json}
          customer/{index.ts,config.v1.json}
          contractor/{index.ts,config.v1.json}
          center/{index.ts,config.v1.json}
          crew/{index.ts,config.v1.json}
          warehouse/{index.ts,config.v1.json}
    tests/
      hub.spec.tsx                             # RoleHub unit tests
      roleConfig.spec.tsx                      # Config schema tests
      e2e/{login.spec.ts,jobs.spec.ts,orders.spec.ts} # FE e2e flows
      fuzz/roleConfig.fuzz.ts                  # Fuzz role configs

  Database/                                   # Database DDL/RLS/migrations (2-step policy)
    migrations/
      000_extensions.sql                       # Extensions enablement
      001_users.sql                            # Users table DDL
      002_rbac.sql                             # Roles/permissions schema
      003_custom_ids.sql                       # users.external_id + CHECK/prefix
      004_identity_sequences.sql               # Sequences for external ID counters
      010_activity_logs.sql                    # Audit/activity logs DDL
      020_directory.sql                        # Directory DDL
      030_catalog.sql                          # Catalog DDL
      031_services.sql                         # Services DDL (renumbered)
      040_orders.sql                           # Orders DDL
      050_assignments.sql                      # Assignments DDL
      060_inventory.sql                        # Inventory DDL
      070_deliveries.sql                       # Deliveries DDL
      080_reports.sql                          # Reports DDL
    rls/
      users.rls.sql                            # Users RLS policies
      directory.rls.sql                        # Directory RLS policies
      catalog.rls.sql                          # Catalog RLS policies
      orders.rls.sql                           # Orders RLS policies
      assignments.rls.sql                      # Assignments RLS policies
      inventory.rls.sql                        # Inventory RLS policies
      deliveries.rls.sql                       # Deliveries RLS policies
      reports.rls.sql                          # Reports RLS policies
      identity.rls.sql                         # Identity RLS policies
    roles/                                     # Role seeds/policies by role
      admin/{policies.sql,seeds/capabilities.sql}
      manager/{policies.sql,seeds/capabilities.sql}
      customer/policies.sql
      contractor/policies.sql
      center/policies.sql
      crew/policies.sql
      warehouse/policies.sql
    seeds/
      catalog_demo_data.sql                    # Demo data seed
    README.md                                  # Migration policy (2-step/backfill/EXPLAIN lint)

  Shared/                                     # Shared libs and codegen outputs
    contracts/index.ts                         # Generated FE/BE types from Zod/OpenAPI
    contracts/openapi.json                     # Generated OpenAPI spec (do not edit)
    contracts/README.md                        # Contract/codegen guide
    roles/                                     # Single source of truth for role configs
      schema.ts                                # Zod schema for role config
      configs/
        admin.v1.json
        manager.v1.json
        customer.v1.json
        contractor.v1.json
        center.v1.json
        crew.v1.json
        warehouse.v1.json
      generate.ts                               # Emits FE/BE typed modules
      README.md                                 # How to edit and generate
    utils/
      eslint-boundaries.json                   # Import boundary rules (domains via index.ts)
      codegen/
        generate-contracts.ts                  # Zod→OpenAPI→TS types codegen
        generate-cap-enum.ts                   # DB seeds → TS capability enum
      lint-migrations.ts                       # Lints SQL for unsafe operations
    types/
      customId.d.ts                            # Shared Custom ID types
    constants/
      rolePrefix.ts                            # Canonical role→prefix mapping (CUS/WHS/CRW…)
