REFACTOR PLAN SKELETON FOR CODEBASE (MANAGER USERS)
EACH FILE THAT YOU CREATE NEEDS TO HAVE MY CODER TAG AND THE BEST PRACTICES. SEE BELOW AN EXAMPLE 

EDIT* 2025-09-09 I HAVE CHANGED THE STRUCTURE A BIT PLEASE READ FROM HERE LINE 4 TO LINE 155. 

ok so i had to go in add "for Manager Users" to some of the file descriptions just so we dont get confused. also i have some     
▌things i want to mention. In the backend we have a docs folder in the hub/manager section. thats fine. i think we should also    
▌have at least a readme at the root of the backend if nothing else. 2. for database I notice that both the docs and the migration 
▌folder in the database are manager specific, if so, shouldnt they be in Database/hub/manager/docs and database/hub/manager/      
▌migrations respectfully? if so lets also add a simple read me at the database root as well. and finally for the front end similar▌to the nbackend we have all the docs and read me in the hub specific folder which is good I want to have that but lets also add a▌simple read me at the root of the frontend folder.

Improved Directory Structure
REFACTOR/
├── DATABASE/
│   ├── README.md                    # "Database module for CKS Portal refactor"
│   └── roles/
│       └── manager/
│           ├── migrations/
│           │   ├── 001_manager_users.sql
│           │   ├── 002_manager_rbac.sql
│           │   ├── 003_manager_domain.sql
│           │   ├── 004_manager_activity_logs.sql
│           │   └── 010_seed_manager_caps.sql
│           └── docs/
│               ├── README.md
│               ├── DataModel.md
│               ├── Migrations.md
│               ├── RLS_Policies.md
│               ├── Seeds.md
│               └── Changelog.md
│
├── BACKEND/
│   ├── README.md                    # "Backend module for CKS Portal refactor"
│   ├── package.json
│   ├── tsconfig.json
│   └── server/
│       ├── app.ts
│       ├── middleware/
│       │   ├── auth.ts
│       │   └── requireCaps.ts
│       └── roles/
│           └── manager/
│               ├── routes/
│               ├── services/
│               ├── repositories/
│               ├── validators/
│               └── docs/
│
└── FRONTEND/
    ├── README.md                    # "Frontend module for CKS Portal refactor"
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── shared/
        │   ├── api/
        │   │   └── base.ts      # Shared API utilities
        │   ├── types/
        │   │   └── api.d.ts     # Shared types
        │   └── schemas/
        │       └── roleConfig.ts
        ├── hub/
        │   ├── RoleHub.tsx
        │   ├── roleConfigLoader.ts
        │   └── roles/
        │       └── manager/
        │           ├── config.v1.json
        │           ├── index.ts
        │           ├── api/
        │           │   └── manager.ts
        │           ├── types/
        │           │   └── manager.d.ts
        │           ├── tabs/
        │           └── docs/
Root README Files
DATABASE/README.md
markdown# CKS Portal Database Module

This module contains database migrations, seeds, and documentation for the CKS Portal refactor.

## Structure
- `roles/` - Role-specific database schemas and migrations
  - `manager/` - Manager role database components
  - `contractor/` - (future) Contractor role database components
  - `customer/` - (future) Customer role database components

## Setup
1. Create database: `createdb cks_portal_v2`
2. Run migrations: See role-specific migration guides

## Conventions
- Migrations numbered: `XXX_description.sql`
- Tables use snake_case
- Role-specific tables prefixed with role code
BACKEND/README.md
markdown# CKS Portal Backend Module

Express/TypeScript backend for the CKS Portal refactor.

## Structure
- `server/` - Core server code
  - `middleware/` - Shared middleware (auth, RBAC)
  - `roles/` - Role-specific modules
    - `manager/` - Manager API endpoints and services

## Setup
1. Install dependencies: `npm install`
2. Configure environment: `cp .env.example .env`
3. Run development: `npm run dev`

## Architecture
- Routes → Services → Repositories → Database
- Zod validation on all inputs
- Capability-based authorization
FRONTEND/README.md
markdown# CKS Portal Frontend Module

React/TypeScript frontend for the CKS Portal refactor.

## Structure
- `shared/` - Cross-role utilities and types
- `hub/` - Role-based hub system
  - `roles/` - Role-specific implementations
    - `manager/` - Manager hub components

## Setup
1. Install dependencies: `npm install`
2. Configure environment: `cp .env.example .env`
3. Run development: `npm run dev`

## Architecture
- Config-driven role rendering
- TypeScript throughout
- Zod validation for configs
- API types match backend exactly
Prompt for Codex to Reorganize
Reorganize the REFACTOR directory structure as follows:

1. Move Database/migrations/* to Database/roles/manager/migrations/
2. Move Database/docs/* to Database/roles/manager/docs/
3. Rename migration files to prefix with "manager_" (e.g., 001_manager_users.sql)
4. Update all file descriptions to specify "for Manager role" where appropriate

5. Move Backend/server/hub/manager/* to Backend/server/roles/manager/
6. Update imports and paths accordingly

7. Move Frontend/src/api/manager.ts to Frontend/src/hub/roles/manager/api/
8. Move Frontend/src/types/manager.d.ts to Frontend/src/hub/roles/manager/types/
9. Keep Frontend/src/types/api.d.ts in Frontend/src/shared/types/

10. Create README.md at the root of each main folder (DATABASE, BACKEND, FRONTEND) with the content provided above

11. Update all "Connects to:" references in file headers to reflect new paths

This structure will support multiple roles without confusion and maintain clear separation.
===================================================================================================================
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: file.tsx 
 * 
 * Description: Brief description of component purpose
 * Function: What this component does
 * Importance: Why this is important to the system
 * Connects to: What APIs, services, or components it uses
 * 
 * Notes: Any special considerations or requirements or DOCS that reference this code
 */
```
Database (manager-only)
Database/
└─ migrations/
   ├─ 001_orgs_users.sql
   ├─ 002_rbac.sql
   ├─ 003_domain_min.sql
   ├─ 004_activity_logs.sql
   └─ 010_seed_manager_caps.sql
└─ docs/
   ├─ README.md
   ├─ DataModel.md
   ├─ Migrations.md
   ├─ RLS_Policies.md
   ├─ Seeds.md
   └─ Changelog.md

Backend (manager-only, reorganized)
backend/
└─ server/
   ├─ app.ts
   ├─ middleware/
   │  ├─ auth.ts
   │  └─ requireCaps.ts
   └─ hub/
      └─ manager/
         ├─ routes/
         │  ├─ index.ts          # mounts below /api/manager
         │  ├─ dashboard.ts
         │  ├─ profile.ts
         │  ├─ services.ts
         │  ├─ ecosystem.ts
         │  ├─ orders.ts
         │  ├─ reports.ts
         │  └─ support.ts
         ├─ services/
         │  ├─ dashboard.service.ts
         │  ├─ profile.service.ts
         │  ├─ services.service.ts
         │  ├─ ecosystem.service.ts
         │  ├─ orders.service.ts
         │  ├─ reports.service.ts
         │  └─ support.service.ts
         ├─ repositories/
         │  ├─ profile.repo.ts
         │  ├─ services.repo.ts
         │  ├─ orders.repo.ts
         │  └─ activity.repo.ts
         ├─ validators/
         │  ├─ profile.schema.ts
         │  ├─ services.schema.ts
         │  ├─ orders.schema.ts
         │  └─ reports.schema.ts
         └─ docs/
            ├─ README.md
            ├─ API_Surface.md         # endpoints, params, envelopes
            ├─ ServicesDesign.md      # business logic flows
            ├─ Repositories.md        # DB access patterns
            ├─ Validation.md          # request DTO schemas
            ├─ Permissions.md         # caps required per route
            ├─ Testing.md             # unit/integration test notes
            └─ Changelog.md

Frontend (manager-only, as approved)
frontend/
└─ src/
   ├─ api/
   │  └─ manager.ts
   ├─ types/
   │  ├─ manager.d.ts
   │  └─ api.d.ts
   ├─ schemas/
   │  └─ roleConfig.ts
   └─ hub/
      ├─ RoleHub.tsx
      ├─ roleConfigLoader.ts
      └─ roles/
         └─ manager/
            ├─ config.v1.json
            ├─ index.ts
            ├─ tabs/
            │  ├─ Dashboard.tsx
            │  ├─ MyProfile.tsx
            │  ├─ MyServices.tsx
            │  ├─ Ecosystem.tsx
            │  ├─ Orders.tsx
            │  ├─ Reports.tsx
            │  └─ Support.tsx
            └─ docs/
               ├─ README.md
               ├─ UI.md
               ├─ UEX.md
               ├─ Skeleton.md
               ├─ API.md
               ├─ DataModel.md
               ├─ Permissions.md
               ├─ Testing.md
               └─ Changelog.md

DESCRIPTIONS 

Database
Database/migrations/

001_orgs_users.sql
What: Creates orgs and users (incl. role_code, template_version).
Connects to: Backend auth middleware (loads user+role), Manager routes (org-scoped queries).

002_rbac.sql
What: Creates permissions, role_permissions, user_permission_overrides.
Connects to: Backend requireCaps checks; seeds define Manager capabilities.

003_domain_min.sql
What: Minimal domain tables Manager needs (e.g., centers, orders).
Connects to: Manager orders.service.ts, orders.repo.ts, dashboard KPIs.

004_activity_logs.sql
What: Append-only activity_logs table + indexes.
Connects to: Services that log actions (e.g., creating orders), Activity tab, audits.

010_seed_manager_caps.sql
What: Inserts capability codes and assigns to manager role.
Connects to: Auth (computes caps[]), requireCaps middleware, tab requires[].

Database/docs/

README.md — Entry point explaining DB layout and conventions.

DataModel.md — ERD/relationships for Manager (users/orgs/orders/etc.).

Migrations.md — How to run/rollback migrations; naming/versioning policy.

RLS_Policies.md — Row Level Security strategy (org-scoping, example policies).

Seeds.md — What seeds exist (manager caps), how to load them safely.

Changelog.md — Human log of schema changes (why + impact).

Backend
backend/server/app.ts

What: Express app setup (JSON parser, auth attach, mounts /api/manager).
Connects to: middleware/auth.ts, hub/manager/routes/index.ts.

backend/server/middleware/

auth.ts
What: Verifies IdP/JWT, loads user from DB, computes caps[], attaches req.user.
Connects to: Every route; DB users, role_permissions, overrides.

requireCaps.ts
What: Guard middleware; 403 if user lacks required capabilities.
Connects to: All Manager routes (e.g., orders:view on /orders).

backend/server/hub/manager/routes/

index.ts
What: Registers manager subroutes under /api/manager.
Connects to: dashboard.ts, profile.ts, services.ts, ecosystem.ts, orders.ts, reports.ts, support.ts.

dashboard.ts
What: Endpoints for Manager dashboard KPIs (GET /dashboard/kpis).
Connects to: dashboard.service.ts, activity.repo.ts, domain repos.

profile.ts
What: Manager profile read/update (GET/PATCH /profile).
Connects to: profile.service.ts, profile.repo.ts, validators.

services.ts
What: Manage “My Services” catalog (GET/POST/PATCH /services).
Connects to: services.service.ts, services.repo.ts, validators.

ecosystem.ts
What: Aggregated view of centers/crews/customers (GET /ecosystem).
Connects to: ecosystem.service.ts, multiple repos.

orders.ts
What: Orders list/create/update (GET/POST/PATCH /orders).
Connects to: orders.service.ts, orders.repo.ts, validators, activity logs.

reports.ts
What: Report catalog/access (GET /reports).
Connects to: reports.service.ts, report query layer.

support.ts
What: Support/KB or ticket bootstrap (GET /support).
Connects to: support.service.ts, external helpdesk API (if any).

backend/server/hub/manager/services/

dashboard.service.ts
What: Business logic to compute KPIs; may query orders/activity.
Connects to: orders.repo.ts, activity.repo.ts.

profile.service.ts
What: Reads/updates manager profile; enforces validation and audit.
Connects to: profile.repo.ts, validators, activity.repo.ts.

services.service.ts
What: CRUD for “My Services”; quotas/ownership rules.
Connects to: services.repo.ts, validators, activity logs.

ecosystem.service.ts
What: Composes related data (centers, crews, customers) for Ecosystem tab.
Connects to: Multiple repos; caches if needed.

orders.service.ts
What: Order listing/creation; status transitions and side-effects.
Connects to: orders.repo.ts, validators, activity.repo.ts.

reports.service.ts
What: Selects allowed reports; prepares filters/params.
Connects to: Report data sources/repos.

support.service.ts
What: Retrieves support content or opens a ticket stub.
Connects to: Support repo or external API.

backend/server/hub/manager/repositories/

profile.repo.ts
What: DB access for user/org profile fields.
Connects to: profile.service.ts.

services.repo.ts
What: DB access for service catalog entities.
Connects to: services.service.ts.

orders.repo.ts
What: DB access for orders (org/center scoped).
Connects to: orders.service.ts, dashboard KPIs.

activity.repo.ts
What: Read/write activity logs.
Connects to: Services that log actions; Activity UI.

backend/server/hub/manager/validators/

profile.schema.ts
What: Validates profile update DTOs.
Connects to: profile.ts routes, profile.service.ts.

services.schema.ts
What: Validates service create/update DTOs.
Connects to: services.ts routes, services.service.ts.

orders.schema.ts
What: Validates order create/update DTOs.
Connects to: orders.ts routes, orders.service.ts.

reports.schema.ts
What: Validates report request params.
Connects to: reports.ts routes, reports.service.ts.

backend/server/hub/manager/docs/

README.md — Orientation for Manager backend module.

API_Surface.md — List of endpoints, params, response envelopes.

ServicesDesign.md — Business rules/flows (e.g., order lifecycle).

Repositories.md — Query patterns, indices, and performance notes.

Validation.md — DTO schemas, error codes, examples.

Permissions.md — Required caps per endpoint; mapping to UI tabs.

Testing.md — Unit/integration strategy, fixtures, mocks.

Changelog.md — Changes to endpoints/logic.

Frontend
frontend/src/api/manager.ts

What: Typed fetch wrappers for /api/manager/* (one function per endpoint).
Connects to: Manager tab components; uses types/manager.d.ts and types/api.d.ts.

frontend/src/types/

manager.d.ts
What: DTOs for Manager (e.g., ManagerProfile, ManagerOrder, ManagerKPI).
Connects to: api/manager.ts, Manager tabs.

api.d.ts
What: Shared API envelope/types ({ ok, data, error }, pagination cursors).
Connects to: All api/* modules and components consuming them.

frontend/src/schemas/roleConfig.ts

What: Zod schema + TS types for role config JSON; validates tabs/widgets/version.
Connects to: hub/roleConfigLoader.ts, hub/RoleHub.tsx, role configs.

frontend/src/hub/RoleHub.tsx

What: Shared renderer — loads the role bundle (config + registry), applies capability gating, renders the active tab.
Connects to: roleConfigLoader.ts, schemas/roleConfig.ts, Manager registry.

frontend/src/hub/roleConfigLoader.ts

What: import.meta.glob loader that discovers config.v*.json and index.ts, validates config, returns the bundle.
Connects to: RoleHub.tsx, Manager role folder.

frontend/src/hub/roles/manager/

config.v1.json
What: Manager tab layout: Dashboard, My Profile, My Services, Ecosystem, Orders, Reports, Support (+ optional widgets).
Connects to: RoleHub.tsx (to render), backend caps (via requires[]).

index.ts
What: Manager component registry — exports components referenced by config.v1.json.
Connects to: roleConfigLoader.ts (resolves components by name).

tabs/Dashboard.tsx
What: KPI/overview view for Manager.
Connects to: api/manager.ts (GET /dashboard/kpis), caps dashboard:view.

tabs/MyProfile.tsx
What: View/edit profile data.
Connects to: api/manager.ts (GET/PATCH /profile), profile.schema on backend.

tabs/MyServices.tsx
What: Manage services offered by the manager/org.
Connects to: api/manager.ts (GET/POST/PATCH /services), backend services module.

tabs/Ecosystem.tsx
What: Relations map (centers, crews, customers/partners).
Connects to: api/manager.ts (GET /ecosystem), multiple repos.

tabs/Orders.tsx
What: Orders list/work queue.
Connects to: api/manager.ts (GET /orders, later POST/PATCH), caps orders:view.

tabs/Reports.tsx
What: Report catalog and parameters.
Connects to: api/manager.ts (GET /reports), caps reports:view.

tabs/Support.tsx
What: Support center / contact actions.
Connects to: api/manager.ts (GET /support) or external helpdesk.

frontend/src/hub/roles/manager/docs/

README.md — Overview of Manager Hub front-end.

UI.md — Visual UI guidelines (layout, spacing, components).

UEX.md — User flows/feel (first-run tour, empty states, loading).

Skeleton.md — How this hub’s front-end structure connects to backend+DB.

API.md — Manager frontend ↔ backend endpoint map (with payload shapes).

DataModel.md — Front-end view of entities (Profile, Service, Order, Report).

Permissions.md — Tab visibility vs. server caps, with scenarios.

Testing.md — Component/API test strategy.

Changelog.md — Visible changes to UI/UX.