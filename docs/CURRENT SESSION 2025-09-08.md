# CURRENT SESSION 2025-09-08

Focus: Stabilize hub loading/refresh, enable role-based impersonation across the tree, fix Admin dashboard behavior, consolidate activity logging, align Account Manager panels for Customer/Center with real data, and fix user activity feeds across all hubs.

## Highlights

- Admin hub refresh: removed early-return auth gates that changed hook order; added inline gates and an ErrorBoundary so refresh no longer white-screens.
- Template hubs (CON-000/CUS-000/CEN-000/CRW-000): bypass Clerk load on refresh for template paths and `?code`, eliminating “Loading … hub…” hangs.
- Admin viewer mode: implemented across hubs so Admin can click any ID and view the user hub; Customer/Center/Crew gained `/profile` or improved profile reads.
- Manager impersonation: Manager can impersonate linked users (Contractor, Customer, Center) by clicking IDs; routes jump to `/<ID>/hub` with impersonation flags.
- Activity logging consolidated: Admin sees a single "New X Created: <ID> (<Name>) — Welcome Message Sent" entry per create; admin feed hides `user_welcome` noise.
- User activity feeds fixed: All hubs now show personalized welcome messages and filtered activity (excludes administrative logs); added clear activity functionality.
- Cross-hub navigation: Fixed "View" buttons using admin impersonation pattern for seamless navigation between user hubs.
- Customer/Center Account Manager: simplified to 4 fields (Name, ID, Email, Phone) and bound to real manager data when linked.
- Manager delete fixed: soft-deletes via `archived_at`; contractors are unassigned; no more 500s.

## Backend Changes

- Admin create endpoints [backend/server/hubs/admin/routes.ts]
  - For manager/contractor/customer/center/crew:
    - Log one consolidated `user_created` with “— Welcome Message Sent”.
    - Send welcome message via `sendWelcomeMessage(...)` (no duplicate activity in admin feed).
- Welcome utilities [backend/server/utils/welcomeMessages.ts]
  - `sendWelcomeMessage` now logs `user_welcome` targeted to the user (visible in user hubs).
- Admin activity feed [backend/server/resources/activity.ts]
  - GET `/api/activity` excludes `user_welcome` by default (keeps the admin feed clean).
- Customer/Center profiles
  - Customer: GET `/api/customer/profile?code=` returns customer + `manager` (manager_id, manager_name, email, phone).
  - Center: added GET `/api/center/profile?code=` returning center + `manager`.
- Manager contractors endpoint [backend/server/hubs/manager/routes.ts]
  - Fixed selection to existing columns; returns normalized contractor shape.
  - Manager activity feed now includes `target_id = manager` events to show manager’s own welcome.
- Manager delete [backend/server/hubs/admin/routes.ts]
  - Uses `archived_at = NOW()` (no non-existent `archived` boolean); unassigns contractors; logs deletion + unassignments.
- User activity feeds [backend/server/hubs/{contractor,manager,customer,center,crew}/routes.ts]
  - Added activity filtering: `activity_type NOT IN ('user_deleted', 'user_updated', 'user_created', 'user_welcome')`
  - Added clear activity endpoints: `POST /{role}/clear-activity` with cascading deletion
  - Fixed case-insensitive matching with `UPPER(target_id) = UPPER($1)`
- Warehouse activity [backend/server/hubs/warehouse/routes.ts]
  - Added clear activity endpoint that handles both system_activity and warehouse_activity_log tables

## Frontend Changes

- Admin
  - Home: switched auth gating to inline gates; added ErrorBoundary; removed duplicate client-side `/api/activity` post after create.
- Template hooks (Contractor/Customer/Center/Crew)
  - Short-circuit for template paths and `?code` before Clerk load.
- Contractor hub
  - Dashboard “Recent Activity” panel fetches `/api/contractor/activity?code=`.
- Customer/Center hubs
  - Account Manager panel simplified to (Name, ID, Email, Phone) and wired to returned `manager` data.
- Manager hub
  - "My Contractors" contractor ID impersonates contractor and navigates to `/<CON-###>/hub`.
  - Orders table + detail modal: Customer/Center IDs clickable → impersonate and navigate to `/<ID>/hub`.
  - Fixed "View Contractor" button in activity feed using admin impersonation pattern.
  - Removed separate manager-only contractor profile screen in favor of impersonation path.
- User activity components (Contractor/Manager hubs)
  - Added clear activity functionality with confirmation dialogs.
  - Enhanced error handling for JSON parsing and network errors.
  - Fixed uppercase code handling for backend requests.

## Dev/Tooling

- Multi-run dev scripts were added earlier (dev:all, start/stop/restart helpers) and documented in README.

## Known Gaps / Next Up

- Frontend clear activity buttons needed for Customer/Center/Crew/Warehouse hubs (backend endpoints are ready).
- Cross-hub navigation implementation for Customer→Center, Center→Crew when those features are needed.
- Extend impersonation links to any additional ID surfaces (e.g., Reports scopes) as needed.
- Expand profile reads to include counts/derived fields where helpful.

## Quick Test Checklist

- Admin → Create users (manager/contractor/customer/center/crew): admin feed shows a single consolidated entry; user hub should display a welcome entry.
- Template hubs refresh (CON-000/CUS-000/CEN-000/CRW-000): refresh doesn't hang.
- User activity feeds (CON-###/MGR-###): show personalized welcome messages and filtered activity (no administrative logs).
- Clear activity functionality (CON-###/MGR-###): confirmation dialog → activity cleared → "No recent activity" displayed.
- Manager MGR-###
  - Click CON-### in "My Contractors" → `/CON-###/hub` renders.
  - Orders table/detail: click CUS-### or CEN-### → hub renders.
  - "View Contractor" in activity feed → opens `/CON-###/hub` in new window.
- Delete MGR-###: archives manager, unassigns contractors, no 500s.

*Property of CKS © 2025 – Manifested by Freedom*
