# Hub Templates & Provisioning

This document explains how role-specific hub templates are used to provision personalized experiences for each user, and the minimal data contract needed for MVP.

## Concept

- One hub template per role lives at `frontend/src/pages/Hub/{Role}/Home.tsx`.
- A user’s CKS ID (e.g., `MGR-123`) determines the role and which hub template renders.
- The hub template defines sections/tabs and expected fields; user-specific data is fetched from the backend and bound into the template at runtime.
- Hubs are strictly isolated: no shared components between roles. Patterns may be mirrored; code remains hub-local.

## Provisioning Flow

1. Admin creates a user with a CKS ID (e.g., `MGR-123`, `CEN-005`).
2. The system infers the role from the ID prefix (`MGR`, `CON`, `CUS`, `CEN`, `CRW`, `ADM`).
3. Minimal seed records are created in the database for that entity (role table + relationships as available).
4. On login, the app routes to `/:idLower/hub` and renders the role’s hub template.
5. The hub fetches user-specific data and related records; the template “materializes” a personalized view from the shared role template.

## Data Binding (Per Role)

The template defines what to display; the backend provides role-filtered data. For MVP, keep fields minimal and expand later.

- Admin: global directory (contractors, managers, customers, centers, crew, services, products, supplies, procedures, training, warehouses), plus unified orders/requests and reports views.
- Manager: profile, assigned centers[], assigned crew[], reports[], orders/requests[] (for their centers), basic metrics.
- Contractor: profile, customers[], centers[], visibility into requests/orders impacting their centers.
- Customer: profile, centers[], visibility into services and requests/orders for their centers.
- Center: profile, contractor, customer, assigned crew[], requests/orders[], reports[].
- Crew: profile, assigned center, training[], procedures[].

## Isolation & Session Keys

- Each hub uses hub-prefixed session keys (e.g., `manager:session`, `crew:session`).
- No cross-hub imports or shared UI code; duplication is acceptable to preserve isolation.

## Minimal Data Contract (MVP)

Focus on essential fields only. Examples:

- Manager: `manager_id`, `manager_name`, `centers[]`, `crew[]`, `reports[]`, `orders[]`, `status`.
- Center: `center_id`, `center_name`, `contractor_id`, `customer_id`, `assigned_crew[]`, `requests[]`, `reports[]`, `status`.
- Crew: `crew_id`, `crew_name`, `assigned_center`, `skills[]` (optional), `training[]` (optional), `status`.

These map to the current schema in `backend/server/db/schema.sql`. Arrays are acceptable for MVP; we can normalize later if needed.

## Orders vs Service Requests (MVP)

- Treat service requests (services) and product orders (products/supplies) as two flows feeding a unified queue for Admin oversight.
- Hubs show clear CTAs (e.g., “New Service Request”, “New Product Order”).
- Admin sees a combined list with filters by type and status.

## Routing & Role Resolution

- Path pattern: `/:username/hub/*` where `username` is the CKS ID in lowercase.
- Role is derived from the first three letters of the ID, uppercased.
- On login, navigate to `/${idLower}/hub` and load role-specific data.

---

Property of CKS © 2025 – Manifested by Freedom

