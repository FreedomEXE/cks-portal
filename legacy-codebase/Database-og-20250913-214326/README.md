Modular Database Layout

This folder organizes the CKS database schema into modules that mirror the application domains: manager, contractor, customer, center, crew, warehouse, and shared resources.

Structure
- schema/
  - shared/: app_users, system_activity, catalog, orders, reporting
  - manager/: managers
  - contractor/: contractors, contractor_services
  - customer/: customers
  - center/: centers
  - crew/: crew, crew_requirements (optional)
  - warehouse/: warehouses, inventory tables
- bootstrap.sql: idempotent baseline (includes all module create.sql files)
- migrations/: versioned changes applied after baseline
- runner.ts: applies bootstrap then unapplied migrations (records in schema_migrations)

Principles
- Idempotent CREATEs in baseline (safe re-run)
- Foreign keys reflect ownership hierarchy and use ON DELETE SET NULL to enable unassigned behavior
- Soft-delete via archived_at (to support Admin Archive + restore)
- Deterministic migrations with recorded history

Usage
1) Run bootstrap to ensure baseline tables
2) Apply new migrations via runner.ts
3) Use Admin Archive to soft-delete and restore records

