# CURRENT SESSION 2025-08-28

Focus: Admin Hub “Create → Assign” flow, expanded Directory archive, Admin CRUD for Procedures/Training, Crew profile-first creation.

## Highlights

- Admin Hub
  - Restored Dashboard as landing; Directory second; dedicated Create and Assign tabs.
  - Directory now lists all archives: Managers, Contractors, Customers, Centers, Crew, Services, Products, Supplies, Procedures, Training, Warehouses, Orders (placeholder), Reports, Feedback.
  - Wired Directory to backend for most tabs (read-only lists) with search + pagination.

- Create
  - Create Crew form captures required + optional profile details (email/phone/role/employment/availability/languages/emergency contact, etc.).
  - Crew created without a center assignment (starts Unassigned); manager assignment now happens in Assign (cks_manager optional at create).
  - Create Procedure (center-specific) and Create Training (service-linked) cards implemented.

- Assign (skeleton)
  - Prepared UI for assigning Managers/Centers/Crew to Warehouses (pending Warehouse hub endpoints); added internal state and option loading.
  - Next: add Crew→Center assignment with a readiness checklist soft-gate.

- Backend API
  - Users: `POST /api/admin/users` for all roles. Crew creation stores extended fields in `crew.profile` JSONB. `assigned_center` omitted.
  - Lists: `GET /api/admin/{managers|contractors|customers|centers|crew|warehouses|products|supplies|procedures|training}`.
  - Catalog Admin: `GET/POST/PUT/DELETE /api/admin/catalog/items` (services) aligned to schema.
  - Procedures: `POST /api/admin/procedures`.
  - Training: `POST /api/admin/training`.

- Database
  - `crew.assigned_center` is now NULLable to support Unassigned pool.
  - `crew.profile JSONB` for extended profile fields at creation.
  - Scaffold `crew_requirements` (training/procedures readiness), not yet wired to UI.

## Rationale

- Create focuses on identity + profile; assignment happens later in Assign, matching real operational flow.
- Manager owns readiness (training/procedures). Admin can override or assist when needed.
- Admin can create Procedures/Training to supply requirements.

## Testing Notes

- Start backend: `cd backend/server && npm run dev`.
- Start frontend: `cd frontend && npm run dev`.
- Admin → Create: create Crew, Procedure, Training; confirm messages and Directory updates.
- Directory: verify tabs list data (Reports/Feedback read-only; Orders placeholder).

## System Activity & Real Metrics Implementation (2025-08-31)

Following admin dashboard cleanup request, implemented complete real data integration:

### Database Changes
- **Migration 005**: Created `system_activity` table for audit logging with activity types (user_created, support_ticket_created, etc.)
- **Activity Logging Function**: PostgreSQL function `log_system_activity()` for automated event tracking
- **Support System**: Removed all mock data (ST-001, ST-002 sample tickets) from migrations

### Backend APIs
- **`/api/metrics`**: Real dashboard metrics replacing hardcoded values
  - Total users count from all user tables (managers + contractors + customers + centers + crew)
  - Support ticket metrics (total, open, investigating, high priority, unread count)
  - System metrics (days online calculated from earliest activity, daily activity counts)
- **`/api/activity`**: Complete system activity logging and retrieval
  - `logActivity()` helper function integrated into user creation and support operations
  - Activity feed with filtering, pagination, and real-time updates

### Frontend Updates
- **Admin Dashboard**: Replaced all mock metrics with real API-driven data
  - Removed hardcoded values (Total Users: 1,523 → real count from DB)
  - Added support ticket metrics section with live counts
  - Badge notification system on Support tab showing unread ticket count
- **Real-time Updates**: Dashboard now shows actual database counts starting at 0 until real usage

### Key Features
- **Zero Mock Data**: All metrics start at 0 and only show real database counts
- **Activity Logging**: Automatic tracking of user creation, support tickets, and system events
- **Support Ticket Alerts**: Visual indicators for unread/open tickets requiring admin attention
- **Production Ready**: Cleaned up sample data, ready for real usage testing

## Next Steps

- Orders: add list endpoint and wire Orders tab.
- Assign: implement Crew→Center assignment with readiness soft-gate (force override for Admin).
- Manager Hub: add Crew Requirements CRUD tab (uses `crew_requirements`).
- Testing: Run real user creation and support ticket flows to verify metrics system.

## Docs Updated

- Updated `docs/project/HUB_TEMPLATES_AND_PROVISIONING.md` with Create→Assign flow and Crew profile fields.
- Updated `docs/project/API_SURFACE_V1.md` with Admin endpoints summary.
- Updated current session docs with system activity and real metrics implementation.

Property of CKS © 2025 – Manifested by Freedom
