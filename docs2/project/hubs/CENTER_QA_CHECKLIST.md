# Center Hub QA Checklist (MVP)

Use this checklist to validate Center hub behavior end-to-end.

## Environment
- Login as a template `cen-000` and a real `CEN-XXX` when available.
- Backend exposes `/api/center/*` endpoints or returns demo data.

## Login & Routing
- Enter CKS ID → routes to `/:id/hub` (lowercased path).
- Session keys set: `center:session`, `center:lastCode`, `me:lastRole`, `me:lastCode`.

## Dashboard
- Business metrics render with sensible defaults.
- Active crew count reflects API or demo data.
- CTAs: “New Service Request” and “New Product Request” are visible and clickable.
- Communications: News preview shows 1–3 items; Inbox preview shows unread badge.

## Crew
- Assigned crew list shows names, status, shifts, areas, last update.
- Empty state displays friendly message if no crew.

## Services
- Active/Scheduled/History sections render lists or empty states.
- Filters/search work if present; otherwise basic lists are visible.

## Reports
- Reports section visible; create/view actions can be placeholders for MVP.

## Support
- Support/help content renders; ticket shortcuts present (placeholders acceptable).

## Profile
- Displays `center_name` and key identifiers (`CEN-XXX`, `MGR-XXX`, `CUS-XXX`, `CON-XXX`).

## Logout
- Clears Center session keys and navigates to `/login`.

## Headers & IDs (Dev)
- Requests include `x-user-id` and (optionally) `x-center-user-id`.
- Server accepts case-insensitive IDs and responds with uppercase `CEN-XXX`.
- Error paths return `{ success:false, error, error_code }`.

---

Property of CKS © 2025 – Manifested by Freedom

