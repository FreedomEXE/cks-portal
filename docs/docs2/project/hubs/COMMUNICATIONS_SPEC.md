# Communications Spec (News, Inbox, Support)

Defines shared data shapes and API patterns for the Communications areas (News, Inbox/Mailbox, Support/Tickets) across hubs.

## Goals
- Consistent preview components (per hub) with unified data shapes.
- Simple MVP endpoints that can be expanded later.
- Hub isolation: each hub has its own NewsPreview, Inbox preview, and Support view components.

## Shared Data Shapes
- NewsItem: `{ id, title, summary, date, unread?: boolean }`
- Message: `{ id, from, subject, snippet, date, unread: boolean, priority?: 'low'|'normal'|'high' }`
- Ticket: `{ id, subject, status: 'open'|'in_progress'|'closed', priority: 'low'|'normal'|'high', created_at }`

## API Envelope & Headers
- Envelope: `{ success: boolean, data?: T, error?: string, error_code?: string }`
- Headers: accept `x-user-id` and the hub-specific header (e.g., `x-crew-user-id`, `x-center-user-id`, etc.).

## Endpoint Suggestions (Per Hub)
- `GET /api/{hub}/news?limit=3` → `{ success, data: NewsItem[] }`
- `GET /api/{hub}/inbox?limit=5` → `{ success, data: Message[] }`
- `GET /api/{hub}/support?status=open` → `{ success, data: Ticket[] }`

## UI Guidance
- News Preview: 1–3 items, show unread badge if available.
- Inbox Preview: show count badge and 2–5 recent messages; CTA to View All.
- Support: show open tickets count and quick links; full list can be a later enhancement.

## Access & Security
- Scope results to the current hub and user/center/manager as appropriate.
- Filter by role/ID relationships per BEST_PRACTICES.

---

Property of CKS © 2025 – Manifested by Freedom

