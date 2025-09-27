## End goal
- Decouple hub users from admin directory data by giving every role dedicated hub endpoints.
- Ensure all new hub users are provisioned in Clerk with their clerk_user_id persisted in-role tables.
- Roll out the pattern role-by-role: manager complete, contractor mid-refactor, remaining roles still backed by directory data.

## Changes since last commit
- No code changes committed; investigation only. Contractor hub still returns 403 until guard tweak lands.

## New features / progress
- Confirmed contractor provisioning flow hits Clerk and persists clerk_user_id; mapped main contact handling and noted legacy column naming.
- Pinpointed guard (pps/backend/server/core/auth/guards.ts) blocking contractors with status unassigned, explaining all hub request 403s.

## Current blockers
- Need to let early provisioning statuses through ensureAccountAllowed or register hub routes with llowInactive: true.
- Sandbox was read-only this session, so guard fix couldn’t be pushed.

## Next steps recommended
1. Patch guard to accept statuses ['', 'active', 'unassigned', 'pending'] and redeploy backend.
2. Smoke test contractor login + hub tabs after change; confirm welcome, profile, ecosystem, and activity feed populate via hub services.
3. Proceed role-by-role to migrate remaining hubs off directory data; share hooks/types across roles where possible.
4. Optionally create migration to add contractors.main_contact alias if schema parity is desired with other tables.

## Notes
- Existing contractor accounts (e.g. CON-008) and fresh ones fail hub fetches for 403 until guard fix ships; data otherwise intact.
- Manager hub remains fully functional on new shared hub plumbing; contractor refactor is roughly halfway, other roles still pending.
