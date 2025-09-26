# Session Summary - 2025-09-26 (Late Night)

## Changes Since Last Commit
- Updated manager provisioning to stop sending the `phone_number` field when creating Clerk users and instead persist it as `publicMetadata.contactPhone`.
- Expanded `/api/me/bootstrap` so impersonated hub accounts resolve their role/profile even when no admin record exists; added graceful handling for inactive hub users.

## New / Adjusted Behaviour
- Creating a manager no longer fails with Clerk 422 errors; the contact phone still surfaces via metadata.
- Clerk impersonation or direct sign-in as a manager now lands on the correct hub (if active) rather than returning 404/blank screens.

## Code Touchpoints
- `apps/backend/server/domains/provisioning/store.ts`: removed `phoneNumber` payload, pushed phone into metadata, added explanatory comment.
- `apps/backend/server/index.ts`: `/api/me/bootstrap` now checks admin first, then hub identities via `getHubAccountByClerkId`, returning role/code/status for non-admin users; loosened response schema.

## Notes / Follow-up
- Backend dev server must be restarted to pick up the bootstrap changes.
- Newly provisioned managers still have no password; add a password workflow if password logins are required.
