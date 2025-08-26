# API Surface v1 (MVP)

Defines minimal, consistent API patterns used by hubs. Start with Crew; other hubs should follow the same structure.

## Conventions

- Base path per hub: `/api/{hub}` (e.g., `/api/crew`).
- Auth headers: client sends both `x-user-id` and hub-specific header (e.g., `x-crew-user-id`) when available. Server should accept either.
- Response shape: `{ success: boolean, data: <payload>, ...optional }`.
- IDs: Use uppercase prefixes (`MGR-XXX`, `CON-XXX`, `CUS-XXX`, `CEN-XXX`, `CRW-XXX`, `ADM-XXX`) in data. Route segments may be lowercase.

## Crew Endpoints

- `GET /api/crew/profile`
  - Headers: `x-user-id` (preferred) and/or `x-crew-user-id`
  - Returns: `{ success, data: { crew_id, crew_name|name, role, status, assigned_center|center_id, ... } }`
  - Notes: Server may return `name` and `assigned_center`; frontend normalizes to `crew_name` and `center_id`.

- `GET /api/crew/tasks?code=<CRW-XXX>&date=today`
  - Returns: `{ success, data: Task[] }`
  - Task: `{ id, title, area, priority, status, estimated_time, due_time, ... }`

- `GET /api/crew/training?code=<CRW-XXX>`
  - Returns: `{ success, data: TrainingModule[] }`
  - TrainingModule: `{ id, title, type, status, due_date, ... }`

- `GET /api/crew/me`
  - Returns: `{ success, data: { crew_id, role, status, last_login, permissions[] } }`

- `GET /api/crew/member`
  - Returns: `{ success, data: { crew_id, name, position, department, assigned_center, ... } }`

## Patterns to Mirror for Other Hubs

- Headers: Always accept `x-user-id` and an optional hub-specific header (e.g., `x-manager-user-id`).
- Data: Prefer snake_case keys; keep IDs uppercase with documented prefixes.
- Errors: Use `{ error: string }` with appropriate HTTP status.

## Rationale

Keeping a consistent response envelope and headers across hubs simplifies client hooks and reduces glue code. We tolerate light normalization in hooks (e.g., `name` → `*_name`), but aim to converge server responses over time.

---

Property of CKS © 2025 – Manifested by Freedom

