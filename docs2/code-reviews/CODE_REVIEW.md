CKS Portal — Code Review & Next Steps

Purpose

This document captures an initial code + docs review, prioritized risks, and recommended next steps to get the UI and platform ready for MVP/production. It was created from the repo's README, Dockerfiles, Playwright config, and observed test scripts.

Scope

- Surface-level review only (no code changes made).
- Focus: auth, DB wiring, tests, CI, and dev/production parity for the UI and E2E testing.

Summary / Quick understanding

CKS Portal is a multi-hub, role-based service delivery platform with distinct frontends for Admin, Manager, Contractor, Customer, Center, Crew, and Warehouse. Frontend stack is Vite + React; backend is Node/Express with PostgreSQL. Playwright is used for UI E2E tests; Docker/Docker Compose exists for orchestration.

Top findings (prioritized)

1) Authentication & ID mapping (High)
- Clerk is referenced but final mapping between Clerk identities and internal user/role IDs is incomplete.
- Impact: role-scoped UI and server-side access control cannot be trusted until this is fixed.

2) Backend DB wiring & template endpoints (High)
- Several API routes still return template/demo data according to docs.
- Migrations and seeds exist but some route handlers lack production DB integration.

3) Playwright test organization & fragility (High)
- Playwright config expects tests in `./tests`, but many scripts are at repo root (e.g., `test-center-login.js`).
- `playwright.config.ts` uses `webServer.command: 'docker-compose up frontend backend'` which can be slow and brittle for local dev & CI.

4) Environment management and onboarding (Medium)
- No top-level `.env.example` observed. Required keys (Clerk publishable key, DATABASE_URL, etc.) should be documented and scaffolded for new developers.

5) CI / automation (Medium)
- No CI workflow detected. Add a GitHub Actions pipeline to build, start services, run health checks, and execute Playwright tests headless.

6) Docker / dev vs prod parity (Medium)
- Dockerfiles and compose target production-style builds (frontend `serve` on port 3000). Clarify and document dev vs prod steps and port expectations.

7) Healthcheck and readiness endpoints (Low)
- Add HTTP health endpoints and compose healthchecks to make CI and Playwright waits reliable.

Concrete recommendations (short-term)

- Add a top-level `.env.example` listing required env vars and short descriptions.
- Consolidate Playwright scripts into `tests/` (or update `playwright.config.ts` to include the current script layout). Convert ad-hoc scripts into Playwright tests using fixtures for login/demo users.
- Replace or supplement `playwright.config.ts`'s `webServer.command` with either a) a fast dev server command for local runs, or b) run `docker-compose` separately in CI before invoking Playwright. Prefer separate CI steps for clearer failure points.
- Create deterministic seed data for CI E2E runs and include a small script to load it (or a migration step) so tests are repeatable.
- Add lightweight GitHub Actions workflow: install deps, start services (docker-compose up -d), wait-for-health, run Playwright tests headless, teardown.
- Add server-side role checks and unit tests around auth middleware and critical routes (assignments, inventory, orders).

Medium-term improvements

- Provide a small `tests/health` smoke suite that validates health endpoints, auth flows, and a minimal CRUD path for each hub in MVP.
- Add healthcheck entries to `docker-compose.yml` for frontend/backend to allow `docker-compose up --wait` style readiness.
- Improve error logging and add a metrics/monitoring endpoint for prod readiness.

Suggested prioritization for the team (MVP-focused)

1. Auth mapping (Clerk <> internal IDs) + role enforcement (server-side)
2. Wire critical backend endpoints to Postgres (assignments, orders, inventory, reports)
3. Consolidate Playwright tests and create deterministic CI seeds
4. Add `.env.example` and document onboarding steps in `README.md`
5. Add a CI workflow that runs Playwright headless against a reproducible stack

Files referenced during review

- `README.md` — quickstart and dev notes
- `package.json` — Playwright and test scripts
- `docker-compose.yml` — dev/orchestration setup
- `Dockerfile.backend` / `Dockerfile.frontend` — container images
- `playwright.config.ts` — test config & webServer usage

Next actions I can take for you (pick one or more)

- Deep-dive: audit backend `auth` middleware and route handlers; produce a ticket list and proposed fixes.
- Tests: consolidate Playwright scripts into `tests/`, add deterministic seeds, and add a CI workflow (GitHub Actions) to run them headless.
- Dev DX: add `.env.example`, add healthchecks to `docker-compose.yml`, and update `README.md` onboarding steps.

Status: document created. No code changes were made.

If you want, I’ll start implementing one of the next actions above — tell me which and I’ll proceed.
