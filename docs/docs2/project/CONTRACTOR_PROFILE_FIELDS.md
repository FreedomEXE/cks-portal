# Contractor Profile – Fields & Data Rules (MVP)

This document defines the Contractor Hub profile fields, what is required at creation, and how remaining fields populate post‑creation.

## Creation-Time (Required) Fields

Collected via Admin Hub → Create → Contractor (required for profile provisioning):

- Company Name
- Address
- Main Contact
- Phone
- Email
- Website

API: `POST /api/admin/users` with `role: 'contractor'`

Suggested request body (MVP):

```
{
  "role": "contractor",
  "company_name": "Acme Services LLC",
  "main_contact": "Jane Doe",
  "phone": "(555) 555-1212",
  "email": "ops@acme.com",
  "address": "123 Main St, Springfield, ST 12345",
  "website": "https://acme.com"
}
```

DB mapping (MVP):

- `contractors.company_name` ← company_name
- `contractors.contact_person` ← main_contact
- `contractors.phone` ← phone
- `contractors.email` ← email
- `contractors.address` ← address  (add column; see Gaps below)
- `contractors.website` ← website  (add column; see Gaps below)

Notes:
- Do not require a CKS Manager at creation; assignment happens later.

## Post‑Creation (Derived/Assigned) Fields

- Contractor ID: auto‑generated sequentially upon creation (e.g., `CON-001`, `CON-002`, …).
  - Rule: Next available ID using `CON-` prefix and 3‑digit counter.
- CKS Manager (Assigned): populated later once a manager is assigned to the contractor.
  - Rule: Nullable at creation; filled by Admin Assign flow.
- Years with CKS: starts at 1 on creation, increases by 1 each anniversary.
  - Rule: Compute from `created_at` as `max(1, floor((now - created_at)/1y) + 1)`.
- Contract Start Date: creation date.
  - Rule: Use `created_at` timestamp.
- Status: defaults to `active` at creation.
  - Rule: Read from `contractors.status` (schema default `active`).
- Services Specialized In: updated later based on catalog selections (and custom additions).
  - Rule: Derived from selected services; stored via future join/array.

## Current Implementation Status

- Auto ID: Implemented (`getNextIdGeneric('contractors', 'contractor_id', 'CON-')`).
- Status default: Implemented in schema (`status DEFAULT 'active'`).
- Creation endpoint: Exists at `POST /api/admin/users` for `role=contractor`.

## Gaps To Resolve (MVP)

1) Allow manager assignment later
   - Change: Relax NOT NULL on `contractors.cks_manager` (allow NULL) and remove `cks_manager` requirement from the create endpoint.

2) Persist Address and Website
   - Change: Add `address TEXT` and `website TEXT` to `contractors` (or a `profile JSONB` if preferred), and accept these in the create endpoint.

Optional (computed at read time, no schema change required):
- Years with CKS (derive from `created_at`).
- Contract Start Date (use `created_at`).

## UI Display (Contractor Hub → Profile)

Company Info tab shows:

- Contractor ID
- Company Name
- Address
- CKS Manager (Assigned)
- Main Contact
- Phone
- Email
- Website
- Years with CKS
- # of Customers (derived)
- Contract Start Date
- Status
- Services Specialized In

Account Manager tab will be wired after manager assignment logic is implemented.

