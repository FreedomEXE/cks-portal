# CURRENT SESSION 2025-09-05

Focus: Enable end-to-end testing without Clerk friction, wire Admin → Create users, map sign-ins to hubs, add secure(ish) impersonation for Admin, and align hub profiles + DB with field mapping.

## Highlights

- Added `app_users` mapping (Clerk → role/code) and implemented `/api/me/bootstrap` to resolve role/code at login.
- Implemented Admin create endpoints for all user types; added dynamic, schema-aware insert for contractors.
- Added Admin “View As” from Directory to impersonate any created user (dev-only), and adjusted all hubs to honor impersonation only when explicitly set.
- Cleaned up login page (removed Sign Up and Quick Access per request) and preserved Clerk sign-in for later live usage.
- Formatted profile dates consistently across hubs and ensured Manager profile reads from DB.

## Backend Changes

- Mapping & Bootstrap
  - New `app_users` table (Clerk user ↔ role/code) [Database/migrations/007_app_users_mapping.sql].
  - `/api/me/bootstrap`: resolves `{ linked, role, code }` from `x-user-id` (Clerk) or `x-user-email`; backfills `clerk_user_id` when matched by email. [backend/server/routes/me.ts]

- Admin Hub API
  - `POST /api/admin/users` (manager, contractor, customer, center, crew): creates DB row and upserts `app_users` by email. [backend/server/hubs/admin/routes.ts]
  - `POST /api/admin/warehouses`: creates warehouse, bootstraps inventory from products/supplies, and upserts `app_users`. [backend/server/hubs/admin/routes.ts]
  - `POST /api/admin/auth/invite`: returns 501 in dev (placeholder until Clerk Management API is wired). [backend/server/hubs/admin/routes.ts]
  - Improved error reporting for create errors; now returns `details` for quick diagnosis. [backend/server/hubs/admin/routes.ts]

- Contractors (schema alignment)
  - Dynamic create: Admin contractor create checks real columns and only inserts those present (e.g., `contact_person`, `address`, `website`, `status`). Prevents breakage on older DBs. [backend/server/hubs/admin/routes.ts]
  - Migrations: add `contact_person` and `status` if missing. [Database/migrations/008_*.sql, 009_*.sql]
  - Contractor profile GET returns documented fields + derived `years_with_cks` and `contract_start_date`. [backend/server/hubs/contractor/routes.ts]

- Manager profile read
  - `GET /api/manager/profile`: resolves `MGR-###` via `app_users` and returns manager row from DB with `start_date = created_at`. [backend/server/hubs/manager/routes.ts]

## Frontend Changes

- Admin Directory
  - Services and Warehouses now visible after creation (removed forced empty filtering). [frontend/src/pages/Hub/Admin/Home.tsx]
  - “View As”: Clicking ID fields (manager_id, contractor_id, etc.) opens hub in a new tab and sets impersonation flags. [frontend/src/pages/Hub/Admin/Home.tsx]

- Impersonation (dev-only)
  - Hubs’ API wrappers (Manager, Contractor, Customer, Center, Crew, Warehouse) accept session overrides only when `sessionStorage.impersonate === 'true'`. [frontend/src/pages/Hub/*/utils/*Api.ts]
  - HubRoleRouter reads session role only when impersonating; otherwise uses Clerk/user metadata. [frontend/src/pages/HubRoleRouter.tsx]
  - Login clears impersonation on load to avoid sticky overrides. [frontend/src/pages/Login.tsx]

- Login Page
  - Removed Sign Up route and Quick Access. UI now: username/password, Google sign-in, and “Secured by Clerk”. [frontend/src/index.tsx, frontend/src/pages/Login.tsx]

- Profile Formatting (Display)
  - Manager: format `start_date` (created_at) to readable date. [frontend/src/pages/Hub/Manager/Home.tsx]
  - Contractor: format Contract Start Date. [frontend/src/pages/Hub/Contractor/Home.tsx]
  - Customer: format Contract Start Date. [frontend/src/pages/Hub/Customer/Home.tsx]
  - Center: format Service Start Date. [frontend/src/pages/Hub/Center/Home.tsx]
  - Crew: format Start Date. [frontend/src/pages/Hub/Crew/Home.tsx]
  - Warehouse: format Date Acquired. [frontend/src/pages/Hub/Warehouse/Home.tsx]

## Database Changes

- New migrations
  - 007_app_users_mapping.sql: add `app_users` (clerk_user_id, email, role, code, name, status, timestamps).
  - 008_contractors_add_contact_person.sql: add `contact_person` if missing.
  - 009_contractors_add_status.sql: add `status` with default `active` if missing.

- Compatibility strategy
  - Admin contractor create dynamically adapts to whatever columns exist; migrations recommended to converge with docs, but code no longer breaks on older DBs.

## Workflows Now Supported

- Admin creates users (Manager/Contractor/Customer/Center/Crew/Warehouse) with email.
- Admin Directory shows created entities (including Services and Warehouses).
- Admin clicks a row ID to “View As” that user (impersonate in a new tab) for testing without additional sign-in.
- Optional Clerk sign-in flows remain; `/api/me/bootstrap` maps Clerk user to role/code when used.

## Clerk Plan (Live)

- Admin “Invite” uses Clerk Management API to create a Clerk user and send an invite; email ↔ role/code stored in `app_users`.
- First login updates `app_users.clerk_user_id` and all future logins resolve via ID.
- Admin “View As” (production): secure with actor/impersonation tokens or an Admin-signed short-lived “view-as” token.

## Known Gaps / TODOs

- Wire notification settings (Manager Settings) to a simple preferences store (or JSONB on managers) when needed.
- Extend DB-backed profile reads for other hubs where we still show placeholders.
- Add migrations/scripts to normalize older DBs comprehensively (status columns, addresses, etc.) beyond contractors if needed.
- Implement Clerk invites (server-side) when switching from dev to live.

## Quick Test Checklist

- Run migrations: `node Database/migrations/run.js`
- Start backend: `cd backend/server && npm install && npm run dev`
- Start frontend: `cd frontend && npm install && npm run dev`
- Admin → Create → Contractor/Manager/… with email → should succeed even on older DBs.
- Admin → Directory: click ID → opens hub and shows formatted profile with start dates.
- Login page shows only username/password + Google + "Secured by Clerk" (no Quick Access or Sign Up).

*Property of CKS © 2025 – Manifested by Freedom*

