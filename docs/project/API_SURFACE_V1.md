# API Surface v1 (MVP)

Defines minimal, consistent API patterns used by hubs. Start with Crew; other hubs should follow the same structure.

## Conventions

- Base path per hub: `/api/{hub}` (e.g., `/api/crew`).
- Auth headers: client sends both `x-user-id` and hub-specific header (e.g., `x-crew-user-id`) when available. Server should accept either.
- Response shape: `{ success: boolean, data: <payload>, ...optional }`.
- IDs: Use uppercase prefixes (`MGR-XXX`, `CON-XXX`, `CUS-XXX`, `CEN-XXX`, `CRW-XXX`, `ADM-XXX`, `WH-XXX`) in data. Route segments may be lowercase.
- RBAC: Sensitive routes are guarded via middleware like `requirePermission('PERM')`. Role can be inferred from `x-user-id` prefix or explicit `x-user-role`.

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

---

## Warehouse Surface (MVP)

For inventory and logistics operations. Warehouse routes live under `/api/warehouse`.

- Profile & Dashboard
  - `GET /api/warehouse/profile` → warehouse info (+manager details best‑effort)
  - `GET /api/warehouse/dashboard` → KPI cards for at‑a‑glance metrics

- Inventory
  - `GET /api/warehouse/inventory?category&low_stock&limit` → items with computed `quantity_available` and low‑stock flag
  - `POST /api/warehouse/inventory/adjust` (perm: `WAREHOUSE_ADJUST`) → `{ item_id, quantity_change, reason? }`

- Shipments
  - `GET /api/warehouse/shipments?type=inbound|outbound&status&limit` → shipment headers (+counts)
  - `POST /api/warehouse/shipments` (perm: `WAREHOUSE_SHIP`) → create outbound shipment for an order
  - `PATCH /api/warehouse/shipments/:id/deliver` (perm: `WAREHOUSE_SHIP`) → mark delivered and decrement stock

- Orders Fulfillment
  - `GET /api/warehouse/orders?status=pending|shipped|all&limit` → product/supply orders relevant to the warehouse
  - `POST /api/warehouse/orders/:id/assign` (perm: `WAREHOUSE_ASSIGN`) → assign order to this warehouse

Notes:
- Warehouses use `WH-XXX` IDs. Role may be derived from `x-user-id` or `x-user-role: warehouse`.
- Inventory tables are per‑warehouse; fulfillment via shipments updates stock and logs activity.

## Hub Activity Endpoints (v1.1)

Each hub now has its own activity feed showing relevant activities for that user type.

### Manager Activity
- `GET /api/manager/activity?code=<MGR-XXX>`
  - Returns: `{ success, data: Activity[] }` - Activities related to this manager
  - Filters: Contractor assignments, customer/center activities under this manager

### Contractor Activity  
- `GET /api/contractor/activity?code=<CON-XXX>`
  - Returns: `{ success, data: Activity[] }` - Activities related to this contractor
  - Filters: Contractor assignments, customer orders, manager changes

### Customer Activity
- `GET /api/customer/activity?code=<CUS-XXX>`
  - Returns: `{ success, data: Activity[] }` - Activities related to this customer  
  - Filters: Customer creation, center assignments, order activities

### Center Activity
- `GET /api/center/activity?code=<CEN-XXX>`
  - Returns: `{ success, data: Activity[] }` - Activities related to this center
  - Filters: Crew assignments, service scheduling, reports

### Crew Activity
- `GET /api/crew/activity?code=<CRW-XXX>`
  - Returns: `{ success, data: Activity[] }` - Activities related to this crew member
  - Filters: Task assignments, training, schedule updates

### Activity Data Structure
```javascript
Activity {
  activity_id: string,
  activity_type: string,        // e.g., 'contractor_assigned_to_manager'
  actor_id: string,            // Who performed the action
  actor_role: string,          // 'admin', 'manager', etc.
  target_id: string,           // What was acted upon
  target_type: string,         // 'contractor', 'customer', etc.  
  description: string,         // Human readable description
  metadata: object,            // Additional context (JSON)
  created_at: datetime
}
```

## Rationale

Keeping a consistent response envelope and headers across hubs simplifies client hooks and reduces glue code. We tolerate light normalization in hooks (e.g., `name` → `*_name`), but aim to converge server responses over time.

---

## Admin Surface (MVP)

For provisioning and oversight. Admin routes live under `/api/admin`.

- Users
  - `POST /api/admin/users` → create `{ role: manager|contractor|customer|center|crew, ...fields }`
  - Lists: `GET /api/admin/{managers|contractors|customers|centers|crew}?q&limit&offset`

- Catalog & Resources
  - Services: `GET/POST/PUT/DELETE /api/admin/catalog/items`
  - Procedures: `GET /api/admin/procedures` (list), `POST /api/admin/procedures` (create)
  - Training: `GET /api/admin/training` (list), `POST /api/admin/training` (create)
  - Inventory: `GET /api/admin/{products|supplies|warehouses}` (list)

- Operations
  - Orders: `GET /api/admin/orders?q&limit&offset` → `{ order_id, type, requester, status, date }`
  - Crew Assignment:
    - `GET /api/admin/crew/unassigned` → lists crew without center assignment
    - `GET /api/admin/crew/:crew_id/requirements` → readiness status for assignment
    - `POST /api/admin/crew/:crew_id/assign-center` → assign crew to center

- Read-only cross-resource (shared)
  - Reports: `GET /api/reports`
  - Feedback: `GET /api/feedback`

- Utilities
  - `DELETE /api/admin/cleanup-demo-data` → removes all demo/seed data for fresh testing

Notes:
- Crew created without center assignment (Unassigned pool); assignment happens separately in Admin Assign tab.
- Extended Crew profile is captured to `crew.profile` JSONB.
- Crew→Center assignment includes readiness validation with admin override capability.
- Database cleanup removes all demo data while preserving structure and admin access.

---

## Cross‑Resource Surfaces

### Reports
- Base: `/api/reports`
- `GET /api/reports?center_id&customer_id&status&type&from&to&limit&offset` → list + status totals
- `POST /api/reports` (perm: `REPORT_CREATE`) → `{ center_id?, customer_id?, type, severity?, title, description? }`
- `GET /api/reports/:id` → `{ report, comments[] }`
- `POST /api/reports/:id/comments` (perm: `REPORT_COMMENT`) → `{ body }`
- `PATCH /api/reports/:id/status` (perm: `REPORT_STATUS`) → `{ status }`

### Feedback
- Base: `/api/feedback`
- `GET /api/feedback?center_id&customer_id&kind&from&to&limit&offset` → list + kind totals
- `POST /api/feedback` (perm: `FEEDBACK_CREATE`) → `{ center_id?, customer_id?, kind, title, body? }`

Property of CKS © 2025 – Manifested by Freedom

Index
- Overview & Handoff: docs/project/OVERVIEW_AND_HANDOFF.md
- Hub Specs: docs/project/hubs/
 
---

## Contractor Surface (MVP)

For top‑tier clients. Contractor routes live under `/api/contractor`.

- Profile & Dashboard
  - `GET /api/contractor/profile?code=CON-###` → contractor profile including derived fields
    - Returns: `{ success, data: { contractor_id, company_name, cks_manager, main_contact, email, phone, address, website, status, years_with_cks, contract_start_date, num_customers, services_specialized } }`
  - `GET /api/contractor/dashboard` → KPI cards for contractor (customers, centers, services used)

- Customers & Centers
  - `GET /api/contractor/customers?code=CON-###&limit` → list of customers served by contractor
  - `GET /api/contractor/centers?code=CON-###` → centers under this contractor

Notes:
- Client sends `?code=CON-###` where possible to avoid relying on Clerk user mapping.
- Server tolerates `x-user-id`/`x-contractor-user-id` as a fallback.
