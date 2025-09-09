<!--
───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────
-->

# CKS Portal Database Module

This module contains database migrations, seeds, and documentation for the CKS Portal refactor.

## Structure
- `roles/` - Role-specific database schemas and migrations
  - `manager/` - Manager role database components
  - `contractor/` - (future) Contractor role database components
  - `customer/` - (future) Customer role database components

## Setup
1. Create database: `createdb cks_portal_v2`
2. Run migrations: See role-specific migration guides

## Conventions
- Migrations numbered: `XXX_description.sql`
- Tables use snake_case
- Role-specific tables prefixed with role code

