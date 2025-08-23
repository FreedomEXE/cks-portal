# CKS Portal – Product Requirements Document (PRD)

Status: Revamped — August 17, 2025

## 1) Overview
The CKS Portal is a centralized, role‑based platform for Centers, Customers, Contractors, Crew, Managers, and Admins. It replaces spreadsheet workflows with a secure, scalable system that supports supply ordering, job requests, identity, directories, training/procedures, and reporting (phased).

This PRD defines the MVP and the current state, with a refreshed breakdown of role goals and system requirements.

---

## 2) What’s new in Aug 2025
- Username‑scoped hubs and routes: after sign‑in, users land on `/{id}/hub` (no more duplicate “/hub”).
- Admin Directory unified into a single page with 13 tabs; Orders/Reports have split views.
- Consistent “My Hub” pattern across roles; compact header UserWidget is the My Profile entry (suppressed on Admin routes).
- Reusable News & Updates preview; Admin shows unread badge; “View all” emphasized.
- Support/Documents pages scaffolded and scoped by user code.
- Clerk sign‑in streamlined: “Enter username and password” or sign in with linked Google account; logo visible on the homepage.
- `/me` linking kept for bootstrap, impersonation, and developer flows.

---

## 3) Goals
- Unified, secure access for all roles with clear, role‑specific actions.
- Fast admin directories with search and pagination.
- Simple, guided request flows for Centers and Managers.
- Modular, extensible hubs and profile templates.
- Production‑ready auth, with safe “View As” (impersonation) design.

---

## 4) Roles: “Wants to” and “System must”

Important: MVP sign‑in roles are Admin, Crew, Contractor, Customer, Center, and Manager (manager is first‑class and may act on behalf of assigned centers).

### Admin
Wants to:
- Browse, search, and filter every entity (crew, contractors, customers, centers, services, supplies, jobs, procedures, training, management, warehouses).
- Triage incoming reports and oversee Orders/Requests.
- Impersonate (View As) for troubleshooting.
- Access financials (restricted) and management views.

System must:
- Provide a unified Admin Directory with fast search/pagination and consistent tables.
- Offer Orders and Reports views, with clear status and filters; preserve auditability.
- Support “View As” with audit logging; no privilege escalation; clear “Stop viewing as.”
- Restrict financials to admins with an additional password gate.
- Allow navigation to any entity profile via IDs; keep role-safe fallbacks for missing data.

### Contractor
Wants to:
- See assigned customers and centers.
- Confirm orders and services/supply requests requested by its customers/centers.
- Access all user specific info to its role: to be determined.

System must:
- Provide a Contractor Hub with clear links to assigned entities.
- Surface orders/requests actions aligned with permissions and center context.
-Access all user specific info to its role: to be determined.

### Customer
Wants to:
- View centers and services tied to their organization.
- Initiate or review service/supply requests when permitted.
- Access all user specific info to its role: to be determined.

System must:
- Provide a Customer Hub with actionable links and read access to relevant entities.
- Enable request initiation where contracts allow; otherwise provide clear guidance.
- Ensure data visibility follows role and account relationships.
Access all user specific info to its role: to be determined.

### Center
Wants to:
- View assigned contractor/customer info and available services/supplies.
- Request services/supplies quickly, with status tracking.
- Access training and procedures.
- Access info on all crew assigned to its center including training, procedures etc. 
Access all user specific info to its role: to be determined.

System must:
- Provide a Center Hub with a prominent “New Request” CTA and request history.
- Pull catalog options from admin‑managed sources (services/supplies) with safe defaults.
- Keep the flow mobile‑friendly and resilient to partial data.
- Access all user specific info to its role: to be determined.

### Crew
Wants to:
- See assignments and context (center/jobs) when available.
- Access training and procedures.
- Access all user specific info to its role: to be determined.

System must:
- Provide a Crew Hub and profile with role‑appropriate visibility.
- Show assigned center and upcoming work when data is ready; otherwise explain status.
-Access all user specific info to its role: to be determined.

### Manager
Wants to:
- Oversee assigned centers and crews.
- Place orders/requests on behalf of centers.
- Triage reports from their centers and resolve or escalate.
- Access training and procedures.
-Access all user specific info to its role: to be determined.

System must:
- Provide a Manager Hub and profile with multi‑center views.
- Allow managers to initiate requests and view statuses across their centers.
- Surface reports tied to their centers with actions and communication hooks.

---

## 5) MVP Scope
1) Authentication & role access: Clerk + internal code linking (/me bootstrap).
2) Admin: unified Directory (13 tabs), Orders, Reports; fast search and pagination.
3) Role hubs: Center/Manager request flows; Contractor/Customer/Crew hubs with clear navigation.
4) Training & Procedures placeholders accessible across roles.
5) Financials (admin‑only, password protected).
6) Reporting (phase-in): center-originated, visible to allowed roles; admin/manager triage UI.

Non‑goals (MVP): job scheduling, real‑time notifications, payments/invoicing, advanced analytics.

---

## 6) Architecture and Routing

Profiles as templates
- Each role has a profile presenter used by “My Profile” or entity detail. Templates ensure consistent fields and tabs.

Hubs as role containers
- Each role has a hub (dashboard) that links to its profile and role actions. The header UserWidget is the canonical entry to “My Profile” and is hidden on Admin routes.

Admin Directory
- A single page with tabs for Crew, Contractors, Customers, Centers, Services, Jobs, Supplies, Procedures, Training, Management, Warehouses, plus Orders and Reports split views. Consistent tables; search; pagination.

Auth and linking
- Clerk handles sign‑in: users can enter CKS ID/password or sign in with linked Google. After sign‑in, users are redirected to `/{id}/hub`.
- `/me/bootstrap` returns `{ role, code }` for linking and routing. `/me/profile` returns `{ kind, data }`. Impersonation uses `?code=` in dev.

Routing (current)
- `/login` → sign‑in (logo present); forward to `/{id}/hub` after auth.
- `/{id}/hub` → role hub (username‑scoped). Legacy `/hub` normalizes to the scoped route.
- `/me/*` → developer/diagnostic flows (bootstrap, profile) and link state.

Reporting visibility
- Reports originate from Centers and are visible to: Center, its Customer, its Contractor, assigned Manager, serving Crew, and Admins.

Financials access
- Restricted to admins only, with a password gate; never visible to non‑admins.

---

## 7) Success Criteria
- Auth + linking land users on the correct hub; no redirect loops.
- Admin can browse directories quickly with consistent UX and accessible contrast.
- Centers and Managers can initiate request flows; statuses are visible.
- Profiles render with consistent tabs and fields across roles.
- Admin‑only financials are gated and non‑admins cannot access.
- Mobile‑friendly and responsive layout across hubs and directories.

---

## 8) Future Enhancements
- Reporting: submission with attachments; triage workflows; timeline and commenting.
- Job scheduling and crew assignment tracking.
- Real‑time notifications.
- Payments/invoicing and deeper financials.
- Advanced analytics.

---

## 9) “View As” (Admin‑only) — design notes
Goal: let admins view the portal as another user with full traceability.

Key points
- Requires admin auth and an audit reason (log admin_id, target_code, timestamp, reason, IP, user‑agent).
- Server‑issued, short‑lived, scope‑limited token; clients never forge claims.
- Every request logs both the real admin and the impersonated subject; persistent banner with “Stop viewing as”.
- No privilege escalation; optional read‑only diagnostics.
- Expiration and manual termination enforced; state changes attribute both actors.

Next steps
1) Backend: start/stop impersonation endpoints, token minting, middleware, centralized audit logging.
2) Frontend: start modal (pick code + reason), top banner, stop button.

---

## 10) Confirmed Business Rules (Aug 2025)
- Requests can be placed by Centers and Managers only. Managers may act on behalf of centers.
- Flow: Centers receive services; Customers pay; Contractors fulfill; CKS orchestrates fulfillment.
- Reports originate from Centers; visibility spans Center, Customer, Contractor, assigned Manager, Crew, and Admins.
- Financials remain Admin‑only.

---

## 11) References and ADRs
- ADR 0001 — Single Profile Entry Point via Header User Widget: `docs/adr/0001-single-profile-entry-point.md`
- Developer notes: routes and hub structure live under `src/pages/Hub/*` (Admin) and `src/pages/Hubs/*` (roles).

Consistency notes
- Profile paths follow `src/pages/Hubs/<Role>/<Role>Profile.tsx`. Manager profile exists and is rendered by `/me/profile` when role is manager.

---

## Aug 15, 2025 — Daily Summary

- Added compact UserWidget (avatar + name) to the Page header, top-right, for signed-in users; hidden on Admin routes and the Admin hub root. No route changes; widget links to `/me/profile` with role/code when available.
- Removed in-page “My Profile” buttons from role hubs (Center, Crew, Contractor, Customer, Manager) to avoid duplication; the header widget is the canonical entry point to My Profile.
- Simplified My Profile pages to remove the large header card; kept only the tabbed layout with table headings. Introduced a `showHeader` flag on profile presenters and disabled it on My Profile.
- Implemented Manager profile template using `ProfileTabs` and a new `managerTabs.config` (tabs & column headings only; no data rendering). Wired Manager into `/me/profile`.
- Expanded Manager “Profile” tab fields to: Full Name; Reports To; Manager ID; Role; Start Date; Years with Company; Primary Region; Email; Languages; Phone; Emergency Contact; Home Address; LinkedIn; Status; Availability; Preferred Areas; QR Code; Synced with Portal.
- Typecheck/production builds completed successfully after each change.

Consistency notes:
- Profile component paths follow `src/pages/Hubs/<Role>/<Role>Profile.tsx` (e.g., `Hubs/Crew/CrewProfile.tsx`, `Hubs/Contractor/ContractorProfile.tsx`, `Hubs/Customer/CustomerProfile.tsx`, `Hubs/Center/CenterProfile.tsx`, `Hubs/Manager/ManagerProfile.tsx`). Any references in Section 4c using `src/pages/Profiles/*` should be read as the current `Hubs/<Role>` paths.
- Manager Profile now exists at `src/pages/Hubs/Manager/ManagerProfile.tsx` and is rendered by `/me/profile` when role is manager.
