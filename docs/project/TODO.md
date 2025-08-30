# Post‑MVP Hardening Roadmap (RBAC, Types, Validation, Reorg)

This checklist tracks non‑blocking improvements to pursue once the MVP is functional. The goal is a robust, secure, and maintainable codebase without slowing down feature delivery now.

## MVP Must‑Have (track during build)
- [ ] Tighten critical endpoints with basic guards and validation
  - [ ] Approve/Deny (Contractor): permission check + input body validation
  - [ ] Schedule (Manager): permission check + input body validation
  - [ ] Create Request (Customer/Center): input schema validation
- [ ] Keep response envelope consistent: `{ success, data, error?, error_code? }`

## RBAC (Role‑Based Access Control)
- [ ] Centralize role → permissions map (admin, manager, contractor, customer, center, crew)
- [ ] Backend guard middleware `requirePermission('perm')` for sensitive routes
  - [ ] Contractor approvals (approve/deny)
  - [ ] Manager scheduling/assignment
  - [ ] Admin catalog CRUD
- [ ] Domain scoping checks (limit lists/details to user’s org/territory/center)
- [ ] Basic audit logs for sensitive actions (who/what/when)
- [ ] Frontend gating helpers `useCan()` for UX (hide/disable), backed by server truth

## Validation (Zod)
- [ ] Request schemas for all write endpoints (strict min set first)
  - [ ] Create request (items, qty > 0, type enum)
  - [ ] Approve/deny (note optional, valid status)
  - [ ] Schedule/assign (ISO dates, center/job/crew IDs)
- [ ] Response validation in dev for critical endpoints (orders list/detail)
- [ ] Unify error formatting and codes; add helpful messages for clients
- [ ] Expand env validation (already using Zod for env.ts)

## Shared Domain Types (TypeScript)
- [ ] Define shared types for: `Order`, `OrderItem`, `Approval`, `ServiceJob`, `JobAssignment`
- [ ] Export from a small shared module used by frontend + backend
- [ ] Replace any `any` in hot paths with these interfaces

## Database Package + Structure
- [ ] Finalize `Database/` package
  - [ ] Use commonjs or compiled dist; ensure backend TS includes it
  - [ ] Single canonical `Database/schema.sql` (remove duplicates)
- [ ] Migrations (`Database/migrations/`) and Seeds (`Database/seeds/`)
  - [ ] Seed catalog (services/products) once list arrives
  - [ ] Seed minimal demo data for local runs

## Catalog & Admin
- [ ] Admin Catalog CRUD (`/api/admin/catalog/items`)
  - [ ] Create/Update/Delete (soft delete) with validation + permissions
  - [ ] Keep read‑only for non‑admin users

## Warehouse Hub (Phase‑Next)
- [ ] Scaffold `backend/server/hubs/warehouse/routes.ts`
  - [ ] Buckets: `backlog | picking | shipped | archive`
  - [ ] Read‑only first; gated by RBAC as needed

## Observability & Quality
- [ ] Structured logs for key events (approvals, scheduling)
- [ ] Metrics counters (requests approved, jobs scheduled)
- [ ] Playwright E2E smokes for core flow
  - [ ] Catalog → Request → Contractor Approve → Manager Schedule
- [ ] GitHub Action pipeline
  - [ ] Backend type‑check + lint
  - [ ] Frontend build

## Security & Auth
- [ ] Clerk + ID prefix alignment (role derivation)
- [ ] Ensure headers/tokens are validated in guards
- [ ] Review CORS/Helmet configs per environment

## Docs & Best Practices
- [ ] Best‑practices doc: JSX patterns (avoid inline typed helpers), folder conventions, RBAC/Zod usage
- [ ] Update AGENTS.md with “how to add a new endpoint” checklist (schema, permission, tests)

---

Scope intentionally focuses on high‑value improvements that harden the platform without blocking rapid feature delivery. Tackle items incrementally as features land or as time allows post‑MVP.

