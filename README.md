# CKS Portal

Role‑based service delivery management system with 7 independent hubs (Admin, Manager, Contractor, Customer, Center, Crew, Warehouse). Frontend is Vite + React + Clerk; Backend is Node.js + Express + PostgreSQL. Documentation lives under `docs/` with a project index and session handoffs.

## Quick Start

- Prereqs: Node 18+, npm 9+, (optional) PostgreSQL 14+ if exercising DB‑backed endpoints.

- Backend (API at `http://localhost:5000`):
  1) `cd backend/server`
  2) `npm install`
  3) Configure env in `backend/server/.env` (at minimum `PORT=5000`; add DB vars when needed: `DATABASE_URL` or `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`).
  4) `npm run dev`
  5) Verify: `GET /` or `/health`, docs at `/api/docs`.

- Frontend (Vite dev server at `http://localhost:5183`):
  1) `cd frontend`
  2) `npm install`
  3) Ensure `frontend/.env.local` points `VITE_API_URL=http://localhost:5000/api` and has a Clerk publishable key.
  4) `npm run dev`
  5) Open `http://localhost:5183` (login page is `/login`).

Notes:
- You can explore hubs using template users (e.g., `cen-000`, `crw-000`, `mgr-000`, etc.). See docs for credentials and flows. Some backend routes currently return template data until DB is wired.

## Documentation

- Project Index: `docs/project/index.md`
- Latest Session Handoff: `docs/CURRENT SESSION 2025-09-07.md`
- Session Archive: see `docs/session-archive/`
- Key specs (examples):
  - `docs/project/CKS-Portal-Project-Outline-PRD.md`
  - `docs/project/API_SURFACE_V1.md`
  - `docs/project/AUTH_AND_ID_MAPPING.md`
  - `docs/project/CREW_HUB_SPEC.md` and `docs/project/CENTER_HUB_SPEC.md`

## Repository Structure

- `frontend/` — React apps for all hubs (each hub isolated: `components/`, `hooks/`, `utils/`). Includes `Warehouse` hub.
- `backend/server/` — Express API, modular routes under `/api`, Postgres pool, health/metrics.
- `docs/` — Specs, patterns, and session logs (start at `docs/project/index.md`).
- Playwright test scripts are in repo root (e.g., `test-center-login.js`).

## Testing (Playwright)

These are standalone scripts for UI checks.

- At repo root: `npm install` (installs Playwright libs)
- Install browsers once: `npm run playwright:install`
- Run Center login smoke test: `npm run test:ui:login:center`
- Aggregated sample run: `npm run test:ui`
- Ensure frontend and backend dev servers are running before tests

## Database: Migrations and Seeds

To initialize or update the database schema locally:

- Configure connection in `backend/server/.env` (use either `DATABASE_URL` or discrete `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`).
- Run migrations: `node Database/migrations/run.js`
- Optional sample data:
  - Reports/Feedback samples: use your SQL client to run `Database/seeds/010_reports_feedback_sample.sql`
  - Warehouse samples: run `Database/seeds/011_warehouse_sample.sql`
- Reset demo data: call `DELETE /api/admin/cleanup-demo-data` (removes demo/seed rows; preserves structure).

## Status

- Frontend hubs implemented with consistent Dashboard/Profile/Comms patterns. New Warehouse hub added with Inventory, Orders, Shipments, and Activity.
- **Assignment System Complete**: Contractor-to-Manager assignments now work end-to-end with proper activity logging and hub displays.
- **Hub-Specific Activity Feeds**: Each hub now has its own activity endpoint showing relevant activities.
- Backend surface unified under `/api`; added Warehouse, Reports, and Feedback resources. Activity logging standardized with centralized `logActivity()` function.
- Next steps: finalize auth (Clerk + custom ID), broaden tests, and add remaining business logic.

*Property of CKS © 2025 – Manifested by Freedom*
