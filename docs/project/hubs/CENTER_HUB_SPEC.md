# Center Hub Spec (MVP)

Defines structure, fields, API contracts, session, and behaviors for the Center hub. Mirrors Crew patterns to keep hubs consistent.

## Purpose

- Primary interface for center users (facility coordinators) to coordinate crew, request services/products, view communications, and manage operations.
- Strict isolation: Center hub owns its components, hooks, and utils; no cross-hub imports.

## Routes & Entry

- Path: `/:username/hub/*` where `username` is the lowercased CKS ID (e.g., `cen-001`).
- Component: `frontend/src/pages/Hub/Center/Home.tsx` (single-page with internal sections).
- Base variable: `base = "/:username/hub"` for local nav.

## Session Keys

- `center:session`: JSON `{ code, centerName, timestamp }`
- `center:lastCode`, `center:lastCenter`
- Compatibility: `me:lastRole = center`, `me:lastCode = <CEN-XXX>`

## Sections (Tabs)

- Dashboard: business metrics, active crew, CTAs (New Service Request, New Product Request), Communications (News + Inbox preview).
- Crew: assigned crew list with status and shifts.
- Services: active, scheduled, history views with simple filters.
- Reports: create/view operational reports (stub for MVP UI until backend wiring).
- Support: support/help content and ticket shortcuts.
- Profile: compact center profile details.

## Minimal Field Set

- Center: `center_id (CEN-XXX)`, `center_name`, `manager_id (MGR-XXX)`, `customer_id (CUS-XXX)`, `contractor_id (CON-XXX)`, `status`.
- CrewMember: `id (CRW-XXX)`, `name`, `status ('On Duty'|'Off Duty'|'Break')`, `shift`, `area`, `last_update`.
- Metric: `{ label, value, status?: 'Good'|'Warning'|'Critical', change?: string }`.
- NewsItem: `{ id, title, summary, date, unread?: boolean }`.
- Message: `{ id, from, subject, snippet, date, unread: boolean, priority?: 'low'|'normal'|'high' }`.
- Ticket: `{ id, subject, status: 'open'|'in_progress'|'closed', priority: 'low'|'normal'|'high', created_at }`.

## API Contracts

- Headers: client sends `x-user-id` and `x-center-user-id` (when available); server accepts either.
- Envelope: `{ success: boolean, data?: T, error?: string, error_code?: string }`.

Endpoints:
- `GET /api/center/profile` → `{ success, data: { center_id, center_name, manager_id, customer_id, contractor_id, status } }`
- `GET /api/center/crew?center_id=CEN-XXX` → `{ success, data: CrewMember[] }`
- `GET /api/center/metrics?center_id=CEN-XXX` → `{ success, data: Metric[] }`
- `GET /api/center/news?limit=3` → `{ success, data: NewsItem[] }`
- `GET /api/center/inbox?limit=5` → `{ success, data: Message[] }`
- `GET /api/center/support?status=open` → `{ success, data: Ticket[] }`

## Error & Offline Behavior

- Loading: orange-tinted loading card.
- Error: orange header + readable error copy.
- Offline/dev fallback: hook may return demo data similar to Crew pattern.

## ID & Case Rules

- Canonical display IDs uppercase: `CEN-XXX`, `CRW-XXX`, `MGR-XXX`.
- Route segment lowercase for ergonomics.
- Server accepts case-insensitive queries; responds with uppercase.

## Accessibility & UX

- Clear CTAs with descriptive text; large hit areas.
- Badges for unread counts (Inbox), color-coded priorities with sufficient contrast.
- Consistent header placement and button sizing with Crew hub.

## Performance

- Combine initial fetches (crew + metrics) via `Promise.all`.
- Keep Home.tsx within ~600–700 lines when feasible; split only into hub-local files.

## Testing

- Dashboard renders metrics and active crew (demo or API data).
- CTAs present and clickable (placeholder alerts acceptable for MVP).
- News preview shows items; Inbox preview shows unread count.
- Session keys set on load; logout clears them and navigates to `/login`.
- Error path renders `{ success:false, error }` messages.

---

Property of CKS © 2025 – Manifested by Freedom

