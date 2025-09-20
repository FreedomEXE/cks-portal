# CKS Portal — Project Overview & Handoff (MVP)

Purpose: Single entry point for context, priorities, and where to find things. Replaces AGENTS.md + index.md duplication.

## Quick Summary
- Product: Role-based service delivery platform with 7 hubs (Admin, Manager, Contractor, Customer, Center, Crew, Warehouse).
- MVP: Admin creates users → they can use their hub → core orders/reports/requests flows work end-to-end with RBAC.
- IDs: MGR-XXX, CON-XXX, CUS-XXX, CEN-XXX, CRW-XXX, ADM-XXX, WH-XXX.

## Status & Priorities
- Status: Stable; Admin Create/Assign flows in progress; template hubs cleaned; Warehouse hub in progress.
- Near-term: Complete Create forms; wire Assign logic; replace template reads with DB for each hub profile; minimal RBAC.

## Start Here
- PRD: docs/project/CKS-Portal-Project-Outline-PRD.md
- API map: docs/project/API_SURFACE_V1.md
- Auth & IDs: docs/project/AUTH_AND_ID_MAPPING.md
- Field mapping overview: docs/CKS-FIELD-MAPPING-DOCUMENTATION.md
- Current session: docs/CURRENT SESSION 2025-09-08.md (older in docs/session-archive/)
- Testing creds: docs/TESTING_CREDENTIALS.md

## Hub Specs
- Collected under docs/project/hubs/ (Crew, Center, Warehouse, Communications, QA checklists).
- Profile field mappings (when wired) get dedicated pages under docs/project (e.g., CONTRACTOR_PROFILE_FIELDS.md).

## Development Notes
- Frontend: React + TS + Vite + Tailwind; each hub is fully independent and self-contained.
- Backend: Express; unified under /api; Postgres via Database/db/pool.
- Auth: Clerk; MVP favors explicit ?code=ID for profile reads.
- RBAC: Minimal guards in backend for sensitive operations.

## Sessions
- Latest session is at docs/CURRENT SESSION YYYY-MM-DD.md.
- Older sessions are archived in docs/session-archive/.

Property of CKS © 2025 – Manifested by Freedom
