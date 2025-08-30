# Auth & ID Mapping (Clerk)

This document defines how the CKS ID maps to authentication and routing, keeping MVP simple while allowing future enhancements.

## Identifier

- Use the CKS ID (e.g., `MGR-123`, `CEN-005`) as the primary login identifier and Clerk username.
- Keep a 1:1 mapping for MVP: the value the user types is the value used to identify them in the app.

## Role Derivation

- Role = first three letters of the ID, uppercased (`MGR`, `CON`, `CUS`, `CEN`, `CRW`, `ADM`, `WH`).
- Validate prefix on login; reject unknown prefixes.

## Routing

- Hub entry route: `/:username/hub/*` where `username` is the lowercased CKS ID.
- After successful auth, navigate to `/${idLower}/hub`.

## Session & Storage

- Store `role`, `id`, and `hubPath` in sessionStorage using hub-prefixed keys (e.g., `manager:session`).
- Clear all relevant keys on logout and navigate to `/login`.

## Clerk Integration (MVP)

- Username = CKS ID. Password managed by Clerk.
- Optionally mirror fields into `publicMetadata` (e.g., `{ cksId, role }`) for future flexibility; not required for MVP.
- Authorization for API endpoints is role-based using the derived prefix and CKS ID (includes `warehouse`).

## Future Enhancements (Optional)

- Allow email alias login while preserving `cksId` as canonical identifier.
- Device/session hardening and stricter token validation on the backend.
- Map `cksId` and `role` to Clerk metadata and enforce via middleware.

---

Property of CKS © 2025 – Manifested by Freedom
