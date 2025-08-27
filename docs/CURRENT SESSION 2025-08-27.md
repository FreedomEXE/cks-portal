# CKS Portal - Development Session 2025-08-27

## Summary
- Implemented global Catalog (backend + frontend) and wired Center/Customer CTAs to it.
- Added request creation flow (no pricing) and end-to-end order listing across hubs with Pending/Approved/Archive buckets.
- Implemented Contractor approvals and Manager scheduling minimal flows.
- **COMPLETED: Backend refactor to mirror frontend hub isolation pattern**
- **COMPLETED: Database centralization - moved to repo root Database/ folder**

## Backend Changes
- Catalog routes: `GET /api/catalog/items`, `GET /api/catalog/categories` (unified services/products).
- Orders detail: `GET /api/orders/:id` (order, items, approvals).
- Customer orders list: `GET /api/customer/orders?code=CUS-XXX&bucket=...`.
- Center orders list: `GET /api/center/orders?code=CEN-XXX&bucket=...`.
- Contractor requests: `GET /api/contractor/requests?bucket=...`, `POST /api/contractor/requests/:id/(approve|deny)`.
- Manager requests: `GET /api/manager/requests?bucket=(needs_scheduling|in_progress|archive)`, `POST /api/manager/requests/:id/schedule`, `POST /api/manager/jobs/:id/assign`.
- Request creation: `POST /api/customer/requests`, `POST /api/center/requests` (items array; returns `{ order_id, status: contractor_pending }`).
- DB schema: added `order_items`, `approvals`, `service_jobs`, `job_assignments`; expanded `orders.status` set to support buckets.
- **Backend Refactor**: Moved all route files from `backend/server/routes/` to modular structure mirroring frontend:
  - Hub routes: `backend/server/hubs/{admin|crew|manager|customer|contractor|center}/routes.ts`
  - Shared resources: `backend/server/resources/{catalog|orders}.ts`  
  - Created dedicated admin hub with 4 directory endpoints extracted from index.ts
- **Database Centralization**: Moved schema and pool to `Database/` folder at repo root:
  - Schema: `Database/schema.sql` (single canonical source)
  - Pool: `Database/db/pool.ts` with pg dependency
  - Updated all import paths and backend tsconfig.json
- **Database Package Finalization**: Completed Database package setup:
  - Added CommonJS compatibility and TypeScript build support
  - Scaffolded migrations and seeds system with npm scripts
  - Created migration runner with transaction support and tracking table
  - Added seed runner for initial catalog data population
  - Database package is self-contained with own dependencies

## Frontend Changes
- New page: `/catalog` (global, read-only; deep links via `type`/`q`/`category`).
- Catalog “Add to Request” cart with Submit; posts to the appropriate role endpoint using session context.
- Center hub: added Orders tab with Pending/Approved/Archive lists fed by `/api/center/orders`.
- Customer hub: Orders section now shows the same 3-bucket lists fed by `/api/customer/orders`.
- Contractor hub: Orders section lists requests per bucket; pending has Approve/Deny buttons calling Contractor API.
- Manager hub: Orders section shows Needs Scheduling/In Progress/Archive; “Schedule” button calls Manager API.

## Notes
- No pricing anywhere (quotes handled off-portal per MVP).
- If DB is not ready, creation endpoints still return a stub so the flow can be demoed.
- Next: seed `services`/`products` once partner provides list (Catalog will reflect instantly).

## Proposed Next Task (Backend Structure)
- Reorganize backend into hub-specific modules mirroring frontend isolation:
  - `backend/server/hubs/{admin,manager,contractor,customer,center,crew}/routes.ts`
  - Shared core under `backend/server/core` (env, logger, errors, db)
  - Shared resources under `backend/server/resources` (catalog, orders)
- Create top-level `Database/` folder for schema, migrations, seeds.
- Final structure: `Frontend/`, `Backend/`, `Database/` at repo root.

*Property of CKS © 2025 - Manifested by Freedom*

---

## Next Tasks (Handoff)

1) Database package polish (Claude)
- Ensure Database uses commonjs or compiled output; include Database TS in backend tsconfig includes.
- Remove any duplicate schema under backend; keep `Database/schema.sql` canonical.
- Verify `/test-db` and DB-backed endpoints under tsx.

2) Migrations and seeds (Claude)
- Scaffold `Database/migrations/` and `Database/seeds/` with npm scripts.
- Seed initial `services` and `products` when the list is provided.

3) Counts in order list endpoints (Claude)
- Add totals to responses so UI badges aren’t page-limited.
- Shape: `{ data, totals: { pending, approved, archive } }`.

4) Admin Catalog CRUD (Claude)
- `POST/PUT/PATCH/DELETE /api/admin/catalog/items` with basic validation and soft-delete.
- Keep read-only catalog for other roles.

5) Warehouse hub scaffolding (Claude)
- Add `backend/server/hubs/warehouse/routes.ts`.
- Buckets: `backlog|picking|shipped|archive`. Read-only to start.

6) Tests & CI (Claude)
- Playwright smokes: catalog → request → contractor approve → manager schedule.
- GitHub Action: backend type-check + lint + frontend build.

7) Frontend polish (This agent)
- Manager: order detail overlay (read-only) for consistency.
- Dashboard badges, improved skeleton/empty states, and toasts for key flows.
- Optional deep link `/orders/:id` for detail overlays.
- Filters/search on Contractor/Manager order tables.

### Claude Prompt Starter
“Finalize Database package and imports: switch Database to commonjs or compile to dist; add Database to backend tsconfig include; delete backend duplicate schema; confirm `/test-db` works. Then scaffold migrations/seeds. Update docs/session.”
