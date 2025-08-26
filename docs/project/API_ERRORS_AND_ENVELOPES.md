# API Errors & Envelopes (MVP Standard)

Defines the standard response envelope and error codes for all hub APIs.

## Envelope
- Success: `200 OK` with `{ success: true, data: <payload> }`
- Error: appropriate `4xx/5xx` with `{ success: false, error: string, error_code: string }`

## Error Codes
- `validation_error` (400): invalid or missing input
- `unauthorized` (401): not signed in or invalid token
- `forbidden` (403): signed in but lacks permission
- `not_found` (404): resource does not exist
- `conflict` (409): constraint/uniqueness issues
- `server_error` (500): unexpected failure

## Headers
- Accept `x-user-id` and hub-specific headers (e.g., `x-crew-user-id`, `x-center-user-id`).
- Future: add Authorization (Clerk JWT) and decode server-side to set `cksId`/role.

## IDs
- Accept case-insensitive (`UPPER(id) = UPPER($1)`).
- Return canonical uppercase prefixes in responses (e.g., `CEN-XXX`, `CRW-XXX`).

## Rationale
- Consistent envelope simplifies client hooks and error handling.
- Stable `error_code` enables precise UI messages and analytics.

---

Property of CKS © 2025 – Manifested by Freedom

