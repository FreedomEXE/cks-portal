<!--
───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────
-->

# CKS Portal Frontend Module

React/TypeScript frontend for the CKS Portal refactor.

## Structure
- `shared/` - Cross-role utilities and types
- `hub/` - Role-based hub system
  - `roles/` - Role-specific implementations
    - `manager/` - Manager hub components

## Setup
1. Install dependencies: `npm install`
2. Configure environment: `cp .env.example .env`
3. Run development: `npm run dev`

## Architecture
- Config-driven role rendering
- TypeScript throughout
- Zod validation for configs
- API types match backend exactly

