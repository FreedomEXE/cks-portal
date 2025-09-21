# Crew Hub Spec (MVP)

Defines structure, fields, API contracts, session, and behaviors for the Crew hub. Serves as the template for other hubs to mirror structure and patterns.

## Purpose

- Primary interface for field workers to view assignments, complete tasks, log time, and track training.
- Strictly isolated implementation: Crew hub owns its components, hooks, and utils; no cross-hub imports.

## Routes & Entry

- Path: `/:username/hub/*` where `username` is the lowercased CKS ID (e.g., `crw-123`).
- Component: `frontend/src/pages/Hub/Crew/Home.tsx` (single-page with internal tabs/sections).
- Base URL variable in component: `base = "/:username/hub"` for internal navigation.

## Session Keys

- `crew:session`: JSON `{ code, crewName, centerId, timestamp }` (valid ~24h)
- `crew:lastCode`, `crew:lastCrew`, `crew:centerId`
- Generic compatibility keys: `me:lastRole = crew`, `me:lastCode = <CRW-XXX>`

## Sections (Tabs)

- Dashboard: current shift status, today’s assignments, training due, quick links.
- Tasks: daily tasks list with status chips (Pending/In Progress/Completed).
- Timecard: Clock In/Out, elapsed time, hours this week.
- Training: required/optional/completed modules with due dates.
- Center: assigned center summary (ID, name, key contacts).
- Profile: compact view of personal/work details (subset from template list).

For MVP, the critical four are Dashboard, Tasks, Timecard, Training. Center and Profile are compact.

## Minimal Field Set

- Crew: `crew_id (CRW-XXX)`, `crew_name`, `role`, `status`, `center_id (CEN-XXX)`
- Tasks: `id`, `title`, `area`, `priority (High|Medium|Low)`, `status`, `estimated_time`, `due_time`
- Training: `id`, `title`, `type (Safety|Equipment|Procedure)`, `status (Required|Optional|Completed)`, `due_date`
- Center: `center_id (CEN-XXX)`, `center_name`, `manager_id (MGR-XXX)` (optional)

## API Contracts

- Headers: client sends `x-user-id` and `x-crew-user-id` when available; server accepts either.
- Envelope: `{ success: boolean, data: <payload> }`

Endpoints:
- `GET /api/crew/profile`
  - Returns: `{ success, data: { crew_id, crew_name|name, role, status, center_id|assigned_center, ... } }`
  - Frontend normalization: `name -> crew_name`, `assigned_center -> center_id`

- `GET /api/crew/tasks?code=<CRW-XXX>&date=today`
  - Returns: `{ success, data: Task[] }`

- `GET /api/crew/training?code=<CRW-XXX>`
  - Returns: `{ success, data: Training[] }`

- `GET /api/crew/me`
  - Returns: `{ success, data: { crew_id, role, status, last_login, permissions[] } }`

- `GET /api/crew/member`
  - Returns: `{ success, data: { crew_id, name, position, department, assigned_center, supervisor, ... } }`

## Error & Offline Behavior

- Loading: show red-tinted card with “Loading crew hub…”
- Error: show red alert card with error message.
- Offline/dev fallback: `useCrewData` injects demo data for template users or network errors.
- Empty states: tasks/training gracefully show zero-state cards.

## ID & Case Rules

- Canonical IDs use uppercase prefixes: `CRW-XXX`, `CEN-XXX`.
- Route segment is lowercase (e.g., `/crw-123/hub`) for URL ergonomics.
- Client tolerates case-insensitive ID matching; display uses uppercase.

## Accessibility & UX

- Buttons have clear labels (`aria-label` on logout).
- Keyboard focus order follows sections; tab controls should be buttons or anchors.
- Colors follow Crew red (`#ef4444`) with adequate contrast on text.

## Performance

- Combine initial fetches via `Promise.all` (already done: tasks + training).
- Avoid heavy re-renders: state updates are batched per response.
- Keep Home.tsx under ~600–700 lines whenever feasible; split-only if it keeps hub-local.

## Testing

- Smoke tests: load with template user (`crw-000`), expect demo data to render.
- Auth header test: ensure `x-user-id` reaches backend (visible in server logs).
- Response parsing test: return `{ success, data }` and verify UI lists populate.
- Logout test: session keys cleared, navigates to `/login`.
- Error test: simulate 500; error card shows with message.

## Future Enhancements

- Persist timecard events; integrate with backend tasks updates.
- Add task actions (start/complete) and simple notes.
- Sync training completion back to server; show certification history.

---

Property of CKS © 2025 – Manifested by Freedom

