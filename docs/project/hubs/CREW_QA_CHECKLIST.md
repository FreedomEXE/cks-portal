# Crew Hub QA Checklist (MVP)

Use this checklist to validate Crew hub behavior end-to-end.

## Environment
- Login as `crw-000` (template) and a real `CRW-XXX` once available.
- Ensure backend dev server exposes `/api/crew/*` endpoints.

## Login & Routing
- Enter CKS ID → routes to `/:id/hub` (lowercased path).
- Session keys set: `crew:session`, `crew:lastCode`, `me:lastRole`, `me:lastCode`.

## Dashboard
- Shows current date/time, basic status summary.
- Quick links navigate to Tasks/Timecard/Training.

## Tasks
- Successful response `{ success, data: [...] }` populates list.
- Empty response shows a friendly zero-state.
- Network error: tasks fall back to demo list (template only).

## Training
- Successful response `{ success, data: [...] }` populates list.
- Empty response shows a friendly zero-state.
- Network error: demo list (template only).

## Timecard
- Clock In/Out buttons visible; time increments while clocked in.
- Hours this week display (even if placeholder).

## Center
- Shows `CEN-XXX` ID and center name when present.
- ID prefixes are uppercase; route remains lowercase.

## Profile
- Displays `crew_name` (falls back to `name` if needed).
- Basic contact information present.

## Logout
- Clicking logout clears all Crew keys and redirects to `/login`.
- No auto re-login occurs after logout.

## Headers & IDs (Dev)
- Requests include `x-user-id` and `x-crew-user-id` when logged in.
- Backend accepts either header; profile endpoint responds with `{ success, data }`.
- Sample payloads use `CRW-XXX` and `CEN-XXX` formats.

---

Property of CKS © 2025 – Manifested by Freedom

