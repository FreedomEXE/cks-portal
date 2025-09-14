FINAL REFACTOR PLAN — NEW REPO TREE AND LEGACY ISOLATION

Purpose: Lock the final structure before we move folders. This doc shows the target repo layout, what gets moved into legacy-codebase, and the tooling decisions (what we keep vs drop) for a clean, stable baseline.

Scope: Frontend, Backend, Database, Scripts/CI, Docs, and Legacy isolation.

-------------------------------------------------------------------------------
TOP-LEVEL LAYOUT (TARGET)

CKS-Portal/
  .editorconfig
  .gitignore
  .vscode/
  .github/
    workflows/
      ci.yml                            # single CI runs lint/test/build for FE/BE
  .husky/
    pre-commit                         # lint-staged for both frontend and backend
  package.json                         # orchestration scripts only (no app deps)
  package-lock.json                    # root lock for scripts only (optional)
  scripts/
    devctl.js                          # start/stop/status for FE/BE (updated paths)
    run-dev.js                         # spawned dev with prefixed logs (updated paths)
  docs/                                 # keep existing docs + screenshots
    README.md
    SCREENSHOTS/
    session-archive/
  Backend/                              # moved from REFACTOR/Backend
    package.json
    tsconfig.json
    server/
      index.ts
      app.ts
      db/
        connection.ts
      core/
        auth/
          authenticate.ts
          requireCaps.ts
          roleContext.ts
        http/
          errors.ts
          responses.ts
        validation/
          zod.ts
        logging/
          audit.ts
      domains/                          # shared business logic by domain
        catalog/
          index.ts
          service.ts
          repository.ts
          routes.factory.ts
          validators.ts
          types.ts
        dashboard/
          service.ts
          repository.ts
          routes.factory.ts
          validators.ts
        (profile|directory|services|orders|reports|support|assignments|archive)/
          ...                           # follow same pattern (service/repo/routes/validators)
        (inventory|deliveries)/         # warehouse-specific domain modules
          ...
      roles/                            # role composition only; no business logic
        admin/
          config.ts
          router.ts
          routes/
          services/
          repositories/
          validators/
          docs/
        manager/
          config.ts
          router.ts
          routes/ services/ repositories/ validators/ docs/
        customer/
          config.ts | router.ts | routes/ services/ repositories/ validators/ docs/
        contractor/
          config.ts | router.ts | routes/ services/ repositories/ validators/ docs/
        center/
          config.ts | router.ts | routes/ services/ repositories/ validators/ docs/
        crew/
          config.ts | router.ts | routes/ services/ repositories/ validators/ docs/
        warehouse/
          config.ts | router.ts | routes/ services/ repositories/ validators/ docs/
      routes/
        index.ts                        # app.get("/api/docs"...), health, misc
        mount.ts                        # mount /api/:role using roleContext + auth
      docs/
        API_Surface.md
        ServicesDesign.md
        Repositories.md
        Validation.md
        Permissions.md
        Testing.md
        Changelog.md
  Frontend/                             # moved from REFACTOR/Frontend
    package.json
    tsconfig.json
    vite.config.ts
    index.html
    src/
      main.tsx
      hub/
        RoleHub.tsx
        roleConfigLoader.ts
        roles/
          admin/
            index.ts
            config.v1.json
            tabs/ (Dashboard|Directory|Profile|Assign|Create|Support|Archive).tsx
            utils/ (adminApi.ts, adminAuth.ts)
            hooks/ (useAdminData.ts)
            components/ (AdminRecentActions.tsx)
            types/ (admin.d.ts)
            docs/ (README.md, API.md, Permissions.md, Testing.md, etc.)
          manager/
            index.ts
            config.v1.json
            tabs/ (Dashboard|MyServices|MyProfile|Orders|Reports|Support).tsx
            utils/ (managerApi.ts, managerAuth.ts)
            hooks/ (useManagerData.ts)
            types/ (manager.d.ts)
            docs/
          customer/ contractor/ center/ crew/ warehouse/
            ... same pattern per role (tabs/utils/hooks/types/docs)
      shared/
        api/
          base.ts
        catalog/
          CatalogContext.tsx
          CatalogViewer.tsx
        schemas/
          roleConfig.ts
        types/
          api.d.ts
      types/
        assets.d.ts
      test-hub-roles.tsx                # role integration test entry points (manual)
      test-manager-hub.tsx\n  Database/                                   # moved from REFACTOR/Database
    README.md
    migrations/                         # shared schema by domain
      000_extensions.sql
      001_users.sql
      002_rbac.sql
      010_activity_logs.sql
      020_directory.sql
      030_catalog.sql
      030_services.sql
      (040_orders.sql ... add as needed)
    rls/
      users.rls.sql
      directory.rls.sql
      catalog.rls.sql
    roles/                              # overlays per role (policies, views, seeds)
      admin/
        policies.sql
        seeds/
          capabilities.sql
          catalog_capabilities.sql
        docs/ (README, DataModel, Migrations, RLS_Policies, Seeds, Changelog)
      manager/ customer/ contractor/ center/ crew/ warehouse/
        ... same structure as admin
    seeds/
      catalog_demo_data.sql

  LEGACY CODE/                      # entire OG code, frozen read-only during cutover
    Backend/                            # from ./backend (legacy)
    Frontend/                           # from ./frontend (legacy)
    Database/                           # from ./Database (legacy)
    Auth/                               # from ./Auth (legacy)
    scripts-legacy/                     # any scripts only used by OG
    README.md                           # explains freeze policy and removal plan

Notes
- Existing docs under ./docs remain; screenshots and session archives stay put.
- Root scripts (devctl/run-dev) update paths to ./backend and ./frontend.
- CI moves from Backend/.github/workflows/ci.yml to root .github/workflows/ci.yml.

-------------------------------------------------------------------------------
DEV ENVIRONMENTS (PORTS & ENTRY POINTS)

- CKS Hub Testing Interface (kept):
  - Path: `REFACTOR/Frontend` (moves to `Frontend/` on cutover)
  - Dev server: Vite on port 3004
  - Proxy: `/api -> http://localhost:5000`
  - Purpose: Rapid role hub UI/function testing without auth flows

- MVP App (login-first experience):
  - Path: `Frontend/`
  - Dev server: Vite on port 5183 (use 5184 if needed)
  - Proxy: `/api -> http://localhost:5000`
  - Auth UI: from `Auth/frontend` (aliased as `cks-auth`)

- Backend API (Express):
  - Path: `REFACTOR/Backend/server/fastify.ts` (moves to `Backend/server/fastify.ts`)
  - Port: 5000 (default; override via `PORT`)
  - Mounts: `/api/:role/...` and `/api/catalog`

-------------------------------------------------------------------------------
TOOLING DECISIONS (KEEP vs DROP)

Server Framework
- Keep: Fastify as the single server framework (with pino logger).
- Add: @fastify/cors, @fastify/helmet, @fastify/rate-limit, @fastify/swagger, @fastify/swagger-ui, fastify-type-provider-zod.
- Drop later: Express + express-rate-limit + cors + helmet after Fastify parity.

Git Hooks & Formatting
- Keep: Husky + lint-staged. Move hooks to root .husky/pre-commit to run both FE/BE.
- Keep: ESLint + Prettier. Unify minimal root configs, with per-app overrides if needed.

Testing
- Keep: Jest for backend (unit/integration) — already configured in legacy server.
- Keep: Vitest/Playwright for frontend — present in FE refactor; Playwright stays as e2e.


-------------------------------------------------------------------------------
Express Readiness Checklist\n\n- Transport: Express (current)\n- Domains wired: catalog, profile, directory, services, orders, reports, support\n- Next phase: Fastify migration (post-MVP)\n\nLEGACY ISOLATION — WHAT MOVES UNDER LEGACY CODE/

Move as-is (no edits):
- ./Backend/                      → ./LEGACY CODE/Backend/
- ./Frontend/                     → ./LEGACY CODE/Frontend/
- ./Database/                     → ./LEGACY CODE/Database/
- ./Auth/                         → ./LEGACY CODE/Auth/
- Any OG-only tooling or scripts  → ./LEGACY CODE/scripts-legacy/

Keep at root (current):
- ./docs/** (README, SCREENSHOTS, session-archive)
- ./scripts/devctl.js and run-dev.js (updated to new app paths)
- ./REFACTOR/** sources become canonical and move to ./backend, ./frontend, ./db

Remove after parity (post-cutover):
- Fastify deps and scripts from legacy server package.json.
- Redundant per-role DB migrations once consolidated under db/migrations + db/roles.
- Duplicate per-role business logic in Backend/server/roles/* once domains are unified.

-------------------------------------------------------------------------------
CUTOVER CHECKLIST (SAFE MOVE PLAN)

1) Freeze OG code
   - Create ./LEGACY CODE/ with README and do the moves listed above.
   - Do not edit files under LEGACY CODE/ during parity validation.

2) Promote refactor to canonical paths
   - Move REFACTOR/Backend  → ./backend
   - Move REFACTOR/Frontend → ./frontend
   - Move REFACTOR/Database → ./db

3) Wire tooling at root
   - Add .husky/pre-commit → run lint-staged across backend and frontend.
   - Add root ESLint/Prettier configs. Keep per-app configs minimal.
   - Move Backend/.github/workflows/ci.yml → .github/workflows/ci.yml (update paths).

4) Update scripts
   - scripts/devctl.js and scripts/run-dev.js: point to ./backend and ./frontend.
   - Root package.json scripts: dev:backend, dev:frontend, dev:all remain; paths updated.

5) Sanity pass
   - Backend: npm run dev from ./backend; hit /health, /api/docs, /api/:role/* routes.
   - Frontend: npm run dev from ./frontend; verify role hubs mount and call new API.
   - DB: apply db/migrations against a test DB; seed capabilities per role overlay.

6) Retire legacy pieces
   - Remove Fastify and unused deps from legacy server before archiving the branch.
   - Delete LEGACY CODE/ in a later cleanup PR after a full release cycle.

-------------------------------------------------------------------------------
OPEN ITEMS (CALL-OUTS BEFORE MOVE)

- Root package manager: continue with npm (simple) or define workspaces? Recommendation: stay with npm (no workspaces) for this cutover; adopt PNPM/Turbo later if needed.
- E2E location: keep Playwright in frontend (devDependencies) and run via CI matrix.
- Shared types: consider extracting shared TypeScript types to a small package later (not required for cutover) — current FE uses src/shared/types; BE can import via OpenAPI or duplicate as needed for now.

-------------------------------------------------------------------------------
REFERENCES (CURRENT FILES INFORMING THIS PLAN)

- REFACTOR/Docs/REFACTOR PLAN - CHECK - BACKEND+DB (Domain-First).md
- REFACTOR/Backend/server/** (Fastify scaffold + domains/roles/routes)
- REFACTOR/Frontend/src/** (role-based hubs, shared api/schemas/types)
- REFACTOR/Database/** (shared migrations + role overlays + RLS)
- Backend/server/** (legacy Express with OG routes and Fastify deps lingering)
- Database/** (legacy per-role SQL)
- scripts/devctl.js and scripts/run-dev.js (orchestration)














