# Session Notes - Codex - 2025-09-26 (5)

## Changes Since Last Commit
- Backend
  - Added apps/backend/server/core/clerk/client.ts and wired Clerk client usage so manager provisioning can create a Clerk user and persist the returned clerk_user_id.
  - Hardened requireActiveRole guard to honor dev overrides, enforce active status, match CKS codes, and share logic across hub routes.
  - Bootstrapping flow (apps/backend/server/index.ts) now returns hub user metadata when managers (and other roles) authenticate, checks status, and registers the new scope routes.
  - Introduced /api/hub/scope/:cksCode and /api/hub/activities/:cksCode via domains/scope, delivering role-scoped ecosystems and activity feeds.
  - Updated manager report and order lookups to rely on the new cks_manager column instead of the legacy manager_id, resolving the 42703 error.
  - Refined provisioning routes and store logic (actor mapping, Zod schemas) and tightened order creation schemas to require string-keyed metadata.
  - Cleaned directory warehouse row typing to remove duplicate keys and align with new status fields.
- Frontend
  - Rewrote ManagerHub to depend entirely on hub APIs (profile, dashboard, scope, activities, orders, reports) and removed directory-based filtering.
  - Expanded shared/api/hub.ts with strongly typed responses and SWR hooks for the new endpoints; updated provisioning and directory types with clerkUserId and status fields.
  - Kept Admin Hub in sync with UI exports while leaving its directory tooling intact; tweaked overview rendering helpers.
  - Extended SupportSection so role-specific FAQs, tickets, and contact flows render based on hub role, and exposed ActionModal as a default export from @cks/ui.
- Documentation
  - Added hub migration and system design references (docs/Hub-Dashboard-Migration.md, docs/ORDER_SYSTEM_DESIGN.md, docs/REPORTS_SYSTEM_DESIGN.md, docs/SERVICES*_SYSTEM_DESIGN.md, docs/SUPPORT_TICKET_SYSTEM_DESIGN.md) capturing the new hub strategy and workflow expectations.

## New Features
- Manager hub users now authenticate, load profile/dashboard/scope/orders/reports/activities through hub-scoped endpoints without touching admin-only directory APIs.
- Manager provisioning automatically provisions a Clerk user with role metadata and stores the clerk_user_id for downstream auth flows.

## Summary of Code Changes
- Backend hub routes were expanded to supply scoped data, auth guards were upgraded, and manager-focused SQL now respects cks_manager.
- Frontend hub layer adopted the new data model, restructured Manager Hub tabs to consume scoped payloads, and refreshed shared widgets to support role-driven content.
- New documentation captures the planned hub rollout and support processes for future role work.

## Other Relevant Info
- Ensure CLERK_SECRET_KEY is configured locally or in deployment so the new provisioning flow can talk to Clerk; failures roll back manager inserts.
- Manager-facing services/orders tabs still display legacy data structures; future hub endpoints may need to flesh out richer payloads.
- The SupportSection placeholder content still includes lorem-style data and a malformed "Service Orders" glyph that should be sanitized during polish.

## Next Agent Prompt
Carry the hub-scoped pattern across the remaining roles (contractor, customer, center, crew, warehouse):
1. Mirror the Manager Hub migration by swapping directory hooks for the new /hub/* data sources, trimming client-side filtering, and trusting backend scope payloads.
2. Extend backend scope/orders/report handlers where necessary so each role receives pre-filtered data that matches its existing UI requirements; add missing SQL joins or view models as needed.
3. Update shared widgets (orders, services, ecosystem tree) to accept the hub-shaped payloads for non-manager roles and document any gaps in the new system design files.
