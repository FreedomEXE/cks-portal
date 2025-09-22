# Role Configuration System

**S-Tier Architecture**: Single source of truth for all role configurations across the entire CKS Portal.

## Vision

This system implements a code-generation approach where JSON configs drive type-safe role modules for frontend, backend, and any future applications. One config file = consistent role behavior everywhere.

## Structure

- `configs/*.v1.json` - **Master role configurations** (currently empty, ready for data migration)
- `schema.ts` - TypeScript schema definitions for role configs
- `generate.ts` - Generation entry point for build tooling
- `README.md` - This file

## Current State

**Status**: Foundation ready, awaiting S-tier refactor migration

**What exists now**:
- ✅ Empty JSON configs in `configs/` (7 role files)
- ✅ Codegen infrastructure in `scripts/prebuild-codegen.mjs`
- ✅ Working role data in `apps/frontend/src/shared/schemas/roleConfig.ts`

**What needs migration**:
- [ ] Move role data from `roleConfig.ts` into JSON files
- [ ] Populate schema.ts with proper types
- [ ] Update codegen to emit proper modules
- [ ] Replace hardcoded hub tabs with generated configs

## The S-Tier Refactor Plan

### Phase 1: Data Migration
```bash
# Move from apps/frontend/src/shared/schemas/roleConfig.ts
# Into shared/roles/configs/*.v1.json
```

### Phase 2: Schema Definition
```typescript
// shared/roles/schema.ts
export interface RoleConfig {
  id: string;
  name: string;
  label: string;
  color: string;
  accentColor: string;
  permissions: string[];
  tabs: TabConfig[];
  features: string[];
}
```

### Phase 3: Codegen Activation
```bash
# scripts/prebuild-codegen.mjs generates:
# → apps/frontend/src/generated/roles/admin.ts
# → apps/backend/server/generated/roles/admin.ts
```

### Phase 4: Hub Refactor
```typescript
// Before: hardcoded tabs in ManagerHub.tsx
const tabs = [
  { id: 'dashboard', label: 'Dashboard', path: '/manager/dashboard' },
  // ...
];

// After: generated config
import { managerConfig } from '@/generated/roles/manager';
const tabs = managerConfig.tabs;
```

## Benefits of S-Tier Architecture

- **Single Source of Truth**: One JSON file per role, used everywhere
- **Type Safety**: Generated TypeScript modules with full IntelliSense
- **Consistency**: Impossible to have frontend/backend role mismatches
- **Maintainability**: Change one JSON file, updates propagate everywhere
- **Scalability**: Add new apps/services, they get same role configs automatically

## Migration Commands (Future)

```bash
# When ready for S-tier refactor:
pnpm run codegen:roles    # Generate from JSON configs
pnpm run migrate:roles    # Move data from roleConfig.ts to JSONs
```

## Files to Update During Migration

- [ ] `shared/roles/configs/*.v1.json` - Add real role data
- [ ] `shared/roles/schema.ts` - Proper TypeScript interfaces
- [ ] `scripts/prebuild-codegen.mjs` - Emit to correct locations
- [ ] `apps/frontend/src/hubs/*.tsx` - Remove hardcoded tabs
- [ ] `apps/backend/server/roles/*/config.ts` - Use generated configs
- [ ] Delete: `apps/frontend/src/shared/schemas/roleConfig.ts`

## Architecture Philosophy

> "Configuration as Code" - Role definitions should be declarative, version-controlled, and the single authoritative source for all role behavior across the system.

---

**Ready when you are for the S-tier upgrade!** 🚀