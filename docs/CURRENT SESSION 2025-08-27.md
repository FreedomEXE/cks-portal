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

---

## Work Completed (Ordering + Reports/Feedback)

This block summarizes the work done during this session to advance MVP flows for Ordering and add cross‑hub Reports/Feedback with role‑appropriate permissions.

### Backend
- Totals added to list endpoints so UI badges are accurate (not page‑limited):
  - Customer: `GET /api/customer/orders` → `{ success, data, totals: { pending, approved, archive } }`
  - Center: `GET /api/center/orders` → same totals shape
  - Contractor: `GET /api/contractor/requests` → `{ totals: { pending, approved, archive } }`
  - Manager: `GET /api/manager/requests` → `{ totals: { needs_scheduling, in_progress, archive } }`
- Reports/Feedback resources (scoped read for all roles; create/comment/status by role):
  - Reports
    - `GET /api/reports?center_id|customer_id&status&type&from&to&limit&offset` → `{ success, data, totalsByStatus }`
    - `POST /api/reports` (Center/Customer only)
    - `GET /api/reports/:id` → `{ report, comments }`
    - `POST /api/reports/:id/comments` (Manager/Center/Customer/Contractor)
    - `PATCH /api/reports/:id/status` (Manager only)
  - Feedback
    - `GET /api/feedback?center_id|customer_id&kind&from&to&limit&offset` → `{ success, data, totalsByKind }`
    - `POST /api/feedback` (Center/Customer only)
    - `GET /api/feedback/:id`
- RBAC updated (`backend/server/src/auth/rbac.ts`): `REPORT_CREATE`, `FEEDBACK_CREATE`, `REPORT_COMMENT`, `REPORT_STATUS`.
- Manager/Contractor scoping helpers:
  - `GET /api/manager/centers?code=...`, `GET /api/manager/customers?code=...`
  - `GET /api/contractor/centers?code=...`
- Database schema/migration:
  - Tables: `reports`, `report_comments`, `feedback` + indexes
  - Migration: `Database/migrations/002_reports_feedback.sql`
  - Seeds: `Database/seeds/010_reports_feedback_sample.sql` (sample data for `CEN-001`/`CUS-001`)

### Frontend (in progress)
- Customer/Center/Manager/Contractor/Crew: wiring for Reports/Feedback tabs:
  - Lists per scope (Center or Customer), totals badges, “By role:id” column, clickable rows to open detail overlay
  - Archive box to open report/feedback by ID
  - Comments: Manager/Center/Customer/Contractor can post based on role; Crew is read‑only
- Manager:
  - Dropdowns populate from backend for Centers/Customers (no ID typing in normal flow)
  - Report detail overlay with status change + comments
- Contractor:
  - Centers dropdown from backend; viewer is read‑only except comments
- Crew:
  - My Center shows Reports/Feedback read‑only with Archive open

### Known Issues (to address next)
- Frontend compile errors (Vite/Babel TSX):
  - Multiple instances of “Adjacent JSX elements must be wrapped…” and “Unexpected token, expected ","” in Reports sections.
  - Root cause: some Reports returns render multiple siblings (main content + Archive + overlays) without a fragment wrapper; some old code used TSX generics in DOM queries. Most pages converted to controlled inputs and fragments, but a few still need cleanup.
- Duplicated headers/blocks:
  - One case in Center Reports had a duplicated “By” column; removed, but re‑verify all tables.
- Consistency pass:
  - Ensure each Reports section uses a single fragment wrapper and has exactly one Archive box.
  - Convert any remaining `document.querySelector<...>` to controlled inputs.

### Files Touched (reference)
- Backend: `backend/server/hubs/{customer,center,contractor,manager}/routes.ts`, `backend/server/resources/{reports,feedback,orders}.ts`, `backend/server/index.ts`, `backend/server/src/auth/rbac.ts`
- Database: `Database/schema.sql`, `Database/migrations/002_reports_feedback.sql`, `Database/seeds/010_reports_feedback_sample.sql`
- Frontend (selected):
  - Customer: `frontend/src/pages/Hub/Customer/Home.tsx`
  - Center: `frontend/src/pages/Hub/Center/Home.tsx`
  - Manager: `frontend/src/pages/Hub/Manager/Home.tsx`
  - Contractor: `frontend/src/pages/Hub/Contractor/Home.tsx`
  - Crew: `frontend/src/pages/Hub/Crew/Home.tsx`

### Next Steps (Handoff for Claude)
1) Resolve TSX compile errors in Reports sections
   - Wrap multi‑node returns in fragments; remove duplicate Archive blocks; ensure balanced JSX.
   - Verify controlled inputs for Archive boxes across all hubs.
2) Validate role behaviors
   - Manager: status change + comments; Center/Customer/Contractor: comments only; Crew: read‑only.
3) Playwright smokes (post‑fix)
   - Catalog → Request → Contractor Approve → Manager Schedule.
   - Reports: create (Center/Customer) → view in Manager/Contractor/Crew → comment → Archive open by ID.
4) Tighten backend
   - Add basic domain scoping checks (center/customer association) in reports/feedback list routes.
   - Add simple audit log on status change.

Status: Backend endpoints and seeds are ready. Frontend wiring is mostly in place but needs JSX/fragment cleanup to compile and a quick pass for duplicate elements. After fixes, proceed to Playwright and UX polish.

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

See `docs/project/TODO.md` for the complete post‑MVP hardening roadmap (RBAC, Zod validation coverage, shared domain types, Database package, migrations/seeds, Admin Catalog CRUD, Warehouse hub, observability, tests/CI).

### Claude Prompt Starter
“Finalize Database package and imports: switch Database to commonjs or compile to dist; add Database to backend tsconfig include; delete backend duplicate schema; confirm `/test-db` works. Then scaffold migrations/seeds. Update docs/session.”
