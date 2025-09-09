<!--
───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────
-->

# CKS Portal Backend Module

Express/TypeScript backend for the CKS Portal refactor.

## Structure
- `server/` - Core server code
  - `middleware/` - Shared middleware (auth, RBAC)
  - `roles/` - Role-specific modules
    - `manager/` - Manager API endpoints and services

## Setup
1. Install dependencies: `npm install`
2. Configure environment: `cp .env.example .env`
3. Run development: `npm run dev`

## Architecture
- Routes → Services → Repositories → Database
- Zod validation on all inputs
- Capability-based authorization

