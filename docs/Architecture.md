# Architecture

High-level system architecture

## Overview

To be documented.

---

## Overview Cards (2025-10-18 update)

The role hub “Overview” metrics were modularized to reduce duplication and prepare for JSON configuration.

- UI components remain pure in `packages/ui` (e.g., `OverviewCard`).
- Domain-level composition lives in `packages/domain-widgets`:
  - Presets: `src/overview/cards/{manager,contractor,customer,center,crew,warehouse}.ts`
  - Section: `src/overview/OverviewSection.tsx`
- App-specific data shaping lives in `apps/frontend`:
  - Builders: `src/shared/overview/builders.ts`
  - Utilities: `src/shared/overview/metrics.ts` (uses `viewerStatus === 'pending'` for pending orders fallback).

Hubs now import presets and call builders, keeping them presentational. RBAC remains server-enforced by backend guards.
