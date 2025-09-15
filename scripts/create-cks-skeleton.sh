#!/usr/bin/env bash
#-----------------------------------------------
#  Property of CKS  (c) 2025
#-----------------------------------------------
# File: create-cks-skeleton.sh
#
# Description:
# Creates the complete CKS-Portal skeleton structure as described in docs/FINAL_TREE.md.
#
# Responsibilities:
# - Scaffold monorepo directories and files
# - Generate prebuild codegen and Husky hooks
# - Inject CKS header into supported file types
#
# Role in system:
# - Developer bootstrap tool for initializing the repo structure
#
# Notes:
# - Pass a target directory arg to avoid overwrites
# - JSON/MD/TXT files intentionally omit headers to remain valid
#-----------------------------------------------
#  Manifested by Freedom_EXE
#-----------------------------------------------
# Usage:
#   bash scripts/create-cks-skeleton.sh [TARGET_DIR]
# Defaults to current directory. Provide a TARGET_DIR to avoid overwriting existing files.

set -Eeuo pipefail

TARGET_DIR="${1:-.}"

echo "Creating CKS-Portal skeleton structure in: ${TARGET_DIR}"

# Helpers
mk() { mkdir -p "$TARGET_DIR/$1"; }

# Build CKS header based on file type; omit for JSON/MD/TXT to keep validity
render_header() {
  local path="$1"
  local name ext
  name="$(basename -- "$path")"
  ext="${name##*.}"; ext="${ext,,}"
  case "$ext" in
    ts|tsx|js|mjs|cjs)
      cat <<EOF
/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: ${name}
 *
 * Description:
 * Short what/why
 *
 * Responsibilities:
 * - Key responsibility
 * - Another responsibility
 *
 * Role in system:
 * - Who imports/uses this; high-level, not a list of files
 *
 * Notes:
 * Special behaviors, flags, envs
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
EOF
      ;;
    sh|ps1|yml|yaml|gitignore|editorconfig|tf|tfvars)
      cat <<EOF
#-----------------------------------------------
#  Property of CKS  (c) 2025
#-----------------------------------------------
# File: ${name}
#
# Description:
# Short what/why
#
# Responsibilities:
# - Key responsibility
# - Another responsibility
#
# Role in system:
# - Who imports/uses this; high-level
#
# Notes:
# Special behaviors, flags, envs
#-----------------------------------------------
#  Manifested by Freedom_EXE
#-----------------------------------------------
EOF
      ;;
    sql)
      cat <<EOF
/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/*
 File: ${name}

 Description:
 Short what/why

 Responsibilities:
 - Key responsibility
 - Another responsibility

 Role in system:
 - Who imports/uses this; high-level

 Notes:
 Special behaviors, flags, envs
*/
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
EOF
      ;;
    html)
      cat <<EOF
<!--
-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------
File: ${name}

Description:
Short what/why

Responsibilities:
- Key responsibility
- Another responsibility

Role in system:
- Who imports/uses this; high-level

Notes:
Special behaviors, flags, envs

-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------
-->
EOF
      ;;
    json|md|txt)
      ;;
    *)
      ;;
  esac
}

w() { # write file (overwrites). Supports inline args or heredoc via stdin, and injects header where applicable.
  local path="$TARGET_DIR/$1"; shift || true
  mkdir -p "$(dirname "$path")"
  local header body first_line rest
  header="$(render_header "$path")"
  if [ "$#" -gt 0 ]; then
    body="$*"
  else
    body="$(cat)"
  fi
  # Preserve shebang as first line when present
  first_line="${body%%$'\n'*}"
  if [[ "$first_line" == '#!'* ]]; then
    rest="${body#*$'\n'}"
    if [ -n "$header" ]; then
      printf '%s\n%s\n\n%s' "$first_line" "$header" "$rest" > "$path"
    else
      printf '%s\n%s' "$first_line" "$rest" > "$path"
    fi
  else
    if [ -n "$header" ]; then
      printf '%s\n\n%s' "$header" "$body" > "$path"
    else
      printf '%s' "$body" > "$path"
    fi
  fi
}

touchf() { # create empty file with header if applicable
  local path="$TARGET_DIR/$1"
  mkdir -p "$(dirname "$path")"
  local header
  header="$(render_header "$path")"
  if [ -n "$header" ]; then printf '%s\n' "$header" > "$path"; else : > "$path"; fi
}

# Root dirs
mk ".vscode"; mk ".claude"; mk ".github/workflows"; mk ".husky"
mk "infra/policies"; mk "infra/alerts"
mk "scripts"; mk "docs"

# Auth package
mk "Auth/src/providers"; mk "Auth/src/hooks"; mk "Auth/src/pages"; mk "Auth/src/components"; mk "Auth/src/utils"; mk "Auth/src/types"; mk "Auth/tests"

# Gateway package
mk "Gateway/src/auth"; mk "Gateway/tests"

# Backend package
mk "Backend/server/compat"
mk "Backend/server/db"
mk "Backend/server/core/auth"; mk "Backend/server/core/fastify"; mk "Backend/server/core/http"; mk "Backend/server/core/validation"
mk "Backend/server/core/logging"; mk "Backend/server/core/telemetry"; mk "Backend/server/core/cache"; mk "Backend/server/core/config"
mk "Backend/server/core/events"; mk "Backend/server/core/workers/jobs"
mk "Backend/server/domains/identity"; mk "Backend/server/domains/catalog"; mk "Backend/server/domains/directory"; mk "Backend/server/domains/orders"
mk "Backend/server/domains/assignments"; mk "Backend/server/domains/inventory"; mk "Backend/server/domains/deliveries"; mk "Backend/server/domains/reports"
mk "Backend/server/domains/profile"; mk "Backend/server/domains/dashboard"; mk "Backend/server/domains/support"; mk "Backend/server/domains/archive"
for role in admin manager customer contractor center crew warehouse; do mk "Backend/server/roles/$role"; done
mk "Backend/tests/rls"; mk "Backend/tests/services"; mk "Backend/tests/http"; mk "Backend/tests/e2e"; mk "Backend/tests/fuzz"; mk "Backend/tests/perf"; mk "Backend/tests/chaos"

# Frontend package
mk "Frontend/src/auth"; mk "Frontend/src/hub"; mk "Frontend/src/shared/api"; mk "Frontend/src/shared/components"; mk "Frontend/src/shared/catalog"; mk "Frontend/src/shared/schemas"; mk "Frontend/src/shared/types"; mk "Frontend/src/shared/utils"
for role in admin manager customer contractor center crew warehouse; do mk "Frontend/src/roles/$role"; done
mk "Frontend/src/test-interface/catalog"; mk "Frontend/src/test-interface/hub"; for role in admin manager customer contractor center crew warehouse; do mk "Frontend/src/test-interface/roles/$role"; done
mk "Frontend/tests/e2e"; mk "Frontend/tests/fuzz"

# Database package
mk "Database/migrations"; mk "Database/rls"; mk "Database/seeds"
mk "Database/roles/admin/seeds"; mk "Database/roles/manager/seeds"; mk "Database/roles/customer"; mk "Database/roles/contractor"; mk "Database/roles/center"; mk "Database/roles/crew"; mk "Database/roles/warehouse"

# Shared package
mk "Shared/contracts"; mk "Shared/types"; mk "Shared/constants"; mk "Shared/utils/codegen"; mk "Shared/roles/configs"

# Workspace config
w pnpm-workspace.yaml "packages:
  - 'Auth'
  - 'Gateway'
  - 'Backend'
  - 'Frontend'
  - 'Shared'"

w .nvmrc "20.11.0"

w .editorconfig "root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true"

# Root package.json
w package.json '{
  "name": "@cks/portal",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "node scripts/run-dev.js",
    "build": "pnpm run -r build",
    "test": "pnpm run -r test",
    "codegen": "node scripts/prebuild-codegen.mjs",
    "typecheck": "pnpm -r --if-present typecheck",
    "lint": "pnpm -r --if-present lint",
    "prebuild": "pnpm run codegen"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}'

# Package.json files for each workspace
w Auth/package.json '{
  "name": "@cks/auth",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  }
}'

w Gateway/package.json '{
  "name": "@cks/gateway",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest"
  }
}'

w Backend/package.json '{
  "name": "@cks/backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch server/index.ts",
    "build": "tsc",
    "test": "vitest"
  }
}'

w Frontend/package.json '{
  "name": "@cks/frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}'

# Backend tsconfig
w Backend/tsconfig.json '{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./server",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["server/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}'

# Minimal backend entry stubs
w Backend/server/index.ts "export {};"
w Backend/server/fastify.ts "export {};"
w Backend/server/compat/expressAdapter.ts "// Express-to-Fastify adapter placeholder
export function adaptExpressHandler() {/* TODO */}"
w Backend/server/compat/expressRoutesMap.ts "// Map legacy routes to new modules placeholder
export const legacyRoutes = [];"
w Backend/server/compat/README.md "This folder houses temporary adapters to bridge legacy Express handlers into the new Fastify app. Remove once domains are fully migrated."

# Domains scaffolding
for domain in identity catalog directory orders assignments inventory deliveries reports profile dashboard support archive; do
  w "Backend/server/domains/$domain/index.ts" "// Domain module exports
export * from './types';
export * from './service';"
  touchf "Backend/server/domains/$domain/types.ts"
  touchf "Backend/server/domains/$domain/repository.ts"
  touchf "Backend/server/domains/$domain/service.ts"
  touchf "Backend/server/domains/$domain/routes.fastify.ts"
  touchf "Backend/server/domains/$domain/validators.ts"
  touchf "Backend/server/domains/$domain/events.ts"
done

# Identity extras
touchf Backend/server/domains/identity/customIdGenerator.ts
touchf Backend/server/domains/identity/customIdValidator.ts

# Generated role files (placeholders)
for role in admin manager customer contractor center crew warehouse; do
  w "Frontend/src/roles/$role/index.ts" "// GENERATED - DO NOT EDIT
// Source: Shared/roles/configs
export default {};"
  w "Frontend/src/roles/$role/config.v1.json" "{}"
  w "Backend/server/roles/$role/config.ts" "// GENERATED - DO NOT EDIT
// Source: Shared/roles/configs
export default {};"
done

# Frontend minimal stubs
w Frontend/index.html "<!doctype html>
<html>
  <head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>CKS Frontend</title></head>
  <body><div id=\"root\"></div><script type=\"module\" src=\"/src/main.tsx\"></script></body>
</html>"
w Frontend/src/main.tsx "export {};"
touchf Frontend/vite.config.ts
touchf Frontend/vite.config.test.ts

# Gateway minimal stubs
w Gateway/src/index.ts "export {};"
w Gateway/src/config.ts "export const config = {};"
w Gateway/src/featureFlags.ts "export const flags = { versioning: true, rateLimit: true, proxy: true } as const;"

# Shared contracts & roles
w Shared/contracts/index.ts "// GENERATED - DO NOT EDIT
// Run \`pnpm codegen\` to regenerate
export interface User { id: string; customId: string; role: string; }"
w Shared/contracts/README.md "Contracts are generated from backend Zod/OpenAPI. Do not edit generated outputs directly."
w Shared/contracts/openapi.json "{}"
w Shared/roles/schema.ts "export type RoleConfig = Record<string, unknown>;"
w Shared/roles/generate.ts "// Generation entry that can be used by tooling to emit FE/BE role outputs.
export {};"
w Shared/roles/README.md "Edit configs in ./configs then run \`pnpm codegen\` to regenerate FE/BE role modules."

# Shared role config placeholders (single source of truth)
for role in admin manager customer contractor center crew warehouse; do
  w "Shared/roles/configs/$role.v1.json" "{}"
done

# Codegen helper and prebuild script
w scripts/prebuild-codegen.mjs "#!/usr/bin/env node
// Prebuild codegen: emits FE/BE role modules from Shared/roles/configs
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';

const root = process.cwd();
const rolesDir = join(root, 'Shared', 'roles', 'configs');
function ensureDir(p){ mkdirSync(p, { recursive: true }); }
function write(p, content){ ensureDir(dirname(p)); writeFileSync(p, content); }

const files = existsSync(rolesDir) ? readdirSync(rolesDir).filter(f => f.endsWith('.json')) : [];
for (const file of files) {
  const role = basename(file).replace(/\.v1\.json$/, '');
  const jsonPath = join(rolesDir, file);
  let obj = {};
  try { obj = JSON.parse(readFileSync(jsonPath, 'utf8') || '{}'); } catch {}

  // Frontend
  write(join(root, 'Frontend', 'src', 'roles', role, 'config.v1.json'), JSON.stringify(obj, null, 2));
  write(join(root, 'Frontend', 'src', 'roles', role, 'index.ts'), `// GENERATED - DO NOT EDIT\n// Source: Shared/roles/configs/${file}\nexport default ${JSON.stringify(obj, null, 2)} as const;\n`);

  // Backend
  write(join(root, 'Backend', 'server', 'roles', role, 'config.ts'), `// GENERATED - DO NOT EDIT\n// Source: Shared/roles/configs/${file}\nexport default ${JSON.stringify(obj, null, 2)} as const;\n`);
}

// Contracts placeholder regeneration if missing
const contractsIndex = join(root, 'Shared', 'contracts', 'index.ts');
if (!existsSync(contractsIndex)) {
  write(contractsIndex, `// GENERATED - DO NOT EDIT\nexport interface User { id: string; customId: string; role: string; }\n`);
}

console.log(`Codegen complete for ${files.length} role config(s).`);
"

# Placeholder migrations
touchf Database/migrations/000_extensions.sql
touchf Database/migrations/001_users.sql
touchf Database/migrations/002_rbac.sql
touchf Database/migrations/003_custom_ids.sql
touchf Database/migrations/004_identity_sequences.sql
touchf Database/migrations/010_activity_logs.sql
touchf Database/migrations/020_directory.sql
touchf Database/migrations/030_catalog.sql
touchf Database/migrations/031_services.sql
touchf Database/migrations/040_orders.sql
touchf Database/migrations/050_assignments.sql
touchf Database/migrations/060_inventory.sql
touchf Database/migrations/070_deliveries.sql
touchf Database/migrations/080_reports.sql

# RLS files
for table in users directory catalog orders assignments inventory deliveries reports identity; do
  touchf "Database/rls/$table.rls.sql"
done

# Backend env example (no header for .env.example)
w Backend/.env.example "DATABASE_URL=postgresql://user:pass@localhost:5432/cks
REDIS_URL=redis://localhost:6379
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
PORT=3000
NODE_ENV=development"

# docker-compose
w docker-compose.yml "version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cks
      POSTGRES_USER: cks
      POSTGRES_PASSWORD: cks
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data: {}"

# .gitignore
w .gitignore "# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/settings.local.json
.idea/

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/
.nyc_output/"

# Husky hooks (shebang preserved as first line)
w .husky/pre-commit "#!/usr/bin/env sh
if [ -f \"$(dirname \"$0\")/_/husky.sh\" ]; then . \"$(dirname \"$0\")/_/husky.sh\"; fi
echo 'pre-commit: codegen + typecheck + lint'
pnpm codegen || exit 1
pnpm run typecheck || true
pnpm run lint || true
"
w .husky/pre-push "#!/usr/bin/env sh
if [ -f \"$(dirname \"$0\")/_/husky.sh\" ]; then . \"$(dirname \"$0\")/_/husky.sh\"; fi
echo 'pre-push: codegen + typecheck + tests'
pnpm codegen || exit 1
pnpm run typecheck || true
pnpm test || exit 1
"

echo "Skeleton structure created successfully!"
echo
echo "Next steps:"
echo "1) Move existing frontend into Frontend/src/legacy/ (optional)"
echo "2) Update Frontend/src/main.tsx to import from legacy (optional)"
echo "3) Run 'pnpm install' to set up workspaces"
echo "4) Run 'pnpm codegen' to materialize FE/BE role configs"
echo "5) Start developing in the new structure!"

