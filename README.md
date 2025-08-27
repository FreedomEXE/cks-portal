# CKS Portal

Role‑based service delivery management system with 6 independent hubs (Admin, Manager, Contractor, Customer, Center, Crew). Frontend is Vite + React + Clerk; Backend is Node.js + Express + PostgreSQL. Documentation lives under `docs/` with a project index and session handoffs.

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
- Latest Session Handoff: `docs/CURRENT SESSION 2025-08-25.md`
- Key specs (examples):
  - `docs/project/CKS-Portal-Project-Outline-PRD.md`
  - `docs/project/API_SURFACE_V1.md`
  - `docs/project/AUTH_AND_ID_MAPPING.md`
  - `docs/project/CREW_HUB_SPEC.md` and `docs/project/CENTER_HUB_SPEC.md`

## Repository Structure

- `frontend/` — React apps for all hubs (each hub isolated: `components/`, `hooks/`, `utils/`).
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

## Status

- Frontend hubs implemented with consistent Dashboard/Profile/Comms patterns.
- Backend surface unified under `/api`; many routes return template data pending DB mapping.
- Next steps: wire real DB field mappings, finalize auth (Clerk + custom ID), and broaden tests.

*Property of CKS © 2025 – Manifested by Freedom*
