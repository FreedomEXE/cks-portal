#!/usr/bin/env pwsh
#-----------------------------------------------
#  Property of CKS  (c) 2025
#-----------------------------------------------
# File: create-cks-skeleton.ps1
#
# Description:
# PowerShell equivalent of the CKS skeleton generator.
#
# Responsibilities:
# - Scaffold monorepo structure on Windows
# - Generate prebuild codegen and Husky hooks
# - Inject CKS header into supported file types
#
# Role in system:
# - Developer bootstrap tool for initializing the repo structure (Windows)
#
# Notes:
# - JSON/MD/TXT intentionally omit headers to remain valid
#-----------------------------------------------
#  Manifested by Freedom_EXE
#-----------------------------------------------

param(
  [string]$TargetDir = '.'
)

Write-Host "Creating CKS-Portal skeleton structure in: $TargetDir"

function Mk { param([string]$Path) New-Item -ItemType Directory -Force -Path (Join-Path $TargetDir $Path) | Out-Null }

function Get-Header {
  param([string]$RelPath)
  $name = Split-Path $RelPath -Leaf
  $ext = ([System.IO.Path]::GetExtension($name)).TrimStart('.').ToLowerInvariant()
  switch ($ext) {
    'ts' { $style = 'js' }
    'tsx' { $style = 'js' }
    'js' { $style = 'js' }
    'mjs' { $style = 'js' }
    'cjs' { $style = 'js' }
    'sh' { $style = 'hash' }
    'ps1' { $style = 'hash' }
    'yml' { $style = 'hash' }
    'yaml' { $style = 'hash' }
    'gitignore' { $style = 'hash' }
    'editorconfig' { $style = 'hash' }
    'tf' { $style = 'hash' }
    'tfvars' { $style = 'hash' }
    'sql' { $style = 'sql' }
    'html' { $style = 'html' }
    'json' { return '' }
    'md' { return '' }
    'txt' { return '' }
    default { return '' }
  }
  if ($style -eq 'js') {
@"
/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: $name
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
"@
  }
  elseif ($style -eq 'hash') {
@"
#-----------------------------------------------
#  Property of CKS  (c) 2025
#-----------------------------------------------
# File: $name
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
"@
  }
  elseif ($style -eq 'sql') {
@"
/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/*
 File: $name

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
"@
  }
  elseif ($style -eq 'html') {
@"
<!--
-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------
File: $name

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
"@
  }
}

function Write-File {
  param([string]$RelPath, [string]$Body)
  $path = Join-Path $TargetDir $RelPath
  $dir = Split-Path $path
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $header = Get-Header $RelPath
  # Keep shebang as first line
  if ($Body -match "^#!.*") {
    $lineBreak = [Environment]::NewLine
    $first = $Body -split "`n",2 | Select-Object -First 1
    $rest = ($Body -split "`n",2 | Select-Object -Last 1)
    if ([string]::IsNullOrEmpty($header)) {
      Set-Content -Path $path -Value ($first + $lineBreak + $rest) -Encoding utf8NoBOM
    }
    else {
      Set-Content -Path $path -Value ($first + $lineBreak + $header + $lineBreak + $rest) -Encoding utf8NoBOM
    }
  }
  else {
    if ([string]::IsNullOrEmpty($header)) {
      Set-Content -Path $path -Value $Body -Encoding utf8NoBOM
    }
    else {
      Set-Content -Path $path -Value ($header + [Environment]::NewLine + $Body) -Encoding utf8NoBOM
    }
  }
}

function Touch-File {
  param([string]$RelPath)
  $path = Join-Path $TargetDir $RelPath
  $dir = Split-Path $path
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $header = Get-Header $RelPath
  if ([string]::IsNullOrEmpty($header)) { Set-Content -Path $path -Value '' -Encoding utf8NoBOM }
  else { Set-Content -Path $path -Value $header -Encoding utf8NoBOM }
}

# Root dirs
Mk ".vscode"; Mk ".claude"; Mk ".github/workflows"; Mk ".husky"
Mk "infra/policies"; Mk "infra/alerts"
Mk "scripts"; Mk "docs"

# Auth package
Mk "Auth/src/providers"; Mk "Auth/src/hooks"; Mk "Auth/src/pages"; Mk "Auth/src/components"; Mk "Auth/src/utils"; Mk "Auth/src/types"; Mk "Auth/tests"

# Gateway package
Mk "Gateway/src/auth"; Mk "Gateway/tests"

# Backend package
Mk "Backend/server/compat"
Mk "Backend/server/db"
Mk "Backend/server/core/auth"; Mk "Backend/server/core/fastify"; Mk "Backend/server/core/http"; Mk "Backend/server/core/validation"
Mk "Backend/server/core/logging"; Mk "Backend/server/core/telemetry"; Mk "Backend/server/core/cache"; Mk "Backend/server/core/config"
Mk "Backend/server/core/events"; Mk "Backend/server/core/workers/jobs"
Mk "Backend/server/domains/identity"; Mk "Backend/server/domains/catalog"; Mk "Backend/server/domains/directory"; Mk "Backend/server/domains/orders"
Mk "Backend/server/domains/assignments"; Mk "Backend/server/domains/inventory"; Mk "Backend/server/domains/deliveries"; Mk "Backend/server/domains/reports"
Mk "Backend/server/domains/profile"; Mk "Backend/server/domains/dashboard"; Mk "Backend/server/domains/support"; Mk "Backend/server/domains/archive"
('admin','manager','customer','contractor','center','crew','warehouse') | ForEach-Object { Mk "Backend/server/roles/$_" }
Mk "Backend/tests/rls"; Mk "Backend/tests/services"; Mk "Backend/tests/http"; Mk "Backend/tests/e2e"; Mk "Backend/tests/fuzz"; Mk "Backend/tests/perf"; Mk "Backend/tests/chaos"

# Frontend package
Mk "Frontend/src/auth"; Mk "Frontend/src/hub"; Mk "Frontend/src/shared/api"; Mk "Frontend/src/shared/components"; Mk "Frontend/src/shared/catalog"; Mk "Frontend/src/shared/schemas"; Mk "Frontend/src/shared/types"; Mk "Frontend/src/shared/utils"
('admin','manager','customer','contractor','center','crew','warehouse') | ForEach-Object { Mk "Frontend/src/roles/$_" }
Mk "Frontend/src/test-interface/catalog"; Mk "Frontend/src/test-interface/hub"; ('admin','manager','customer','contractor','center','crew','warehouse') | ForEach-Object { Mk "Frontend/src/test-interface/roles/$_" }
Mk "Frontend/tests/e2e"; Mk "Frontend/tests/fuzz"

# Database package
Mk "Database/migrations"; Mk "Database/rls"; Mk "Database/seeds"
Mk "Database/roles/admin/seeds"; Mk "Database/roles/manager/seeds"; Mk "Database/roles/customer"; Mk "Database/roles/contractor"; Mk "Database/roles/center"; Mk "Database/roles/crew"; Mk "Database/roles/warehouse"

# Shared package
Mk "Shared/contracts"; Mk "Shared/types"; Mk "Shared/constants"; Mk "Shared/utils/codegen"; Mk "Shared/roles/configs"

# Workspace config
Write-File "pnpm-workspace.yaml" @"
packages:
  - 'Auth'
  - 'Gateway'
  - 'Backend'
  - 'Frontend'
  - 'Shared'
"@

Write-File ".nvmrc" "20.11.0"

Write-File ".editorconfig" @"
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
"@

# Root package.json
Write-File "package.json" @'
{
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
}
'@

# Package.json files for each workspace
Write-File "Auth/package.json" @'
{
  "name": "@cks/auth",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  }
}
'@

Write-File "Gateway/package.json" @'
{
  "name": "@cks/gateway",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest"
  }
}
'@

Write-File "Backend/package.json" @'
{
  "name": "@cks/backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch server/index.ts",
    "build": "tsc",
    "test": "vitest"
  }
}
'@

Write-File "Frontend/package.json" @'
{
  "name": "@cks/frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
'@

# Backend tsconfig
Write-File "Backend/tsconfig.json" @'
{
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
}
'@

# Minimal backend entry stubs
Write-File "Backend/server/index.ts" "export {};"
Write-File "Backend/server/fastify.ts" "export {};"
Write-File "Backend/server/compat/expressAdapter.ts" "// Express-to-Fastify adapter placeholder`nexport function adaptExpressHandler() {/* TODO */}"
Write-File "Backend/server/compat/expressRoutesMap.ts" "// Map legacy routes to new modules placeholder`nexport const legacyRoutes = [];"
Write-File "Backend/server/compat/README.md" "This folder houses temporary adapters to bridge legacy Express handlers into the new Fastify app. Remove once domains are fully migrated."

# Domains scaffolding
@('identity','catalog','directory','orders','assignments','inventory','deliveries','reports','profile','dashboard','support','archive') | ForEach-Object {
  $d = $_
  Write-File "Backend/server/domains/$d/index.ts" "// Domain module exports`nexport * from './types';`nexport * from './service';"
  Touch-File "Backend/server/domains/$d/types.ts"
  Touch-File "Backend/server/domains/$d/repository.ts"
  Touch-File "Backend/server/domains/$d/service.ts"
  Touch-File "Backend/server/domains/$d/routes.fastify.ts"
  Touch-File "Backend/server/domains/$d/validators.ts"
  Touch-File "Backend/server/domains/$d/events.ts"
}

# Identity extras
Touch-File "Backend/server/domains/identity/customIdGenerator.ts"
Touch-File "Backend/server/domains/identity/customIdValidator.ts"

# Generated role files (placeholders)
@('admin','manager','customer','contractor','center','crew','warehouse') | ForEach-Object {
  $r = $_
  Write-File "Frontend/src/roles/$r/index.ts" "// GENERATED - DO NOT EDIT`n// Source: Shared/roles/configs`nexport default {};"
  Write-File "Frontend/src/roles/$r/config.v1.json" "{}"
  Write-File "Backend/server/roles/$r/config.ts" "// GENERATED - DO NOT EDIT`n// Source: Shared/roles/configs`nexport default {};"
}

# Frontend minimal stubs
Write-File "Frontend/index.html" @"
<!doctype html>
<html>
  <head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>CKS Frontend</title></head>
  <body><div id=\"root\"></div><script type=\"module\" src=\"/src/main.tsx\"></script></body>
</html>
"@
Write-File "Frontend/src/main.tsx" "export {};"
Touch-File "Frontend/vite.config.ts"
Touch-File "Frontend/vite.config.test.ts"

# Gateway minimal stubs
Write-File "Gateway/src/index.ts" "export {};"
Write-File "Gateway/src/config.ts" "export const config = {};"
Write-File "Gateway/src/featureFlags.ts" "export const flags = { versioning: true, rateLimit: true, proxy: true } as const;"

# Shared contracts & roles
Write-File "Shared/contracts/index.ts" "// GENERATED - DO NOT EDIT`n// Run \`pnpm codegen\` to regenerate`nexport interface User { id: string; customId: string; role: string; }"
Write-File "Shared/contracts/README.md" "Contracts are generated from backend Zod/OpenAPI. Do not edit generated outputs directly."
Write-File "Shared/contracts/openapi.json" "{}"
Write-File "Shared/roles/schema.ts" "export type RoleConfig = Record<string, unknown>;"
Write-File "Shared/roles/generate.ts" "// Generation entry that can be used by tooling to emit FE/BE role outputs.`nexport {};"
Write-File "Shared/roles/README.md" "Edit configs in ./configs then run \`pnpm codegen\` to regenerate FE/BE role modules."

# Shared role config placeholders
@('admin','manager','customer','contractor','center','crew','warehouse') | ForEach-Object {
  Write-File "Shared/roles/configs/$_.v1.json" "{}"
}

# Codegen helper and prebuild script
Write-File "scripts/prebuild-codegen.mjs" @'
#!/usr/bin/env node
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
'@

# Placeholder migrations
@('000_extensions','001_users','002_rbac','003_custom_ids','004_identity_sequences','010_activity_logs','020_directory','030_catalog','031_services','040_orders','050_assignments','060_inventory','070_deliveries','080_reports') | ForEach-Object {
  Touch-File "Database/migrations/$_.sql"
}

# RLS files
@('users','directory','catalog','orders','assignments','inventory','deliveries','reports','identity') | ForEach-Object {
  Touch-File "Database/rls/$_.rls.sql"
}

# Backend env example
Write-File "Backend/.env.example" @"
DATABASE_URL=postgresql://user:pass@localhost:5432/cks
REDIS_URL=redis://localhost:6379
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
PORT=3000
NODE_ENV=development
"@

# docker-compose
Write-File "docker-compose.yml" @"
version: '3.8'
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
  postgres_data: {}
"@

# .gitignore
Write-File ".gitignore" @"
# Dependencies
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
.nyc_output/
"@

# Husky hooks (use single-quoted here-strings to avoid PowerShell expanding $ variables)
Write-File ".husky/pre-commit" @'
#!/usr/bin/env sh
if [ -f "$(dirname "$0")/_/husky.sh" ]; then . "$(dirname "$0")/_/husky.sh"; fi
echo 'pre-commit: codegen + typecheck + lint'
pnpm codegen || exit 1
pnpm run typecheck || true
pnpm run lint || true
'@

Write-File ".husky/pre-push" @'
#!/usr/bin/env sh
if [ -f "$(dirname "$0")/_/husky.sh" ]; then . "$(dirname "$0")/_/husky.sh"; fi
echo 'pre-push: codegen + typecheck + tests'
pnpm codegen || exit 1
pnpm run typecheck || true
pnpm test || exit 1
'@

Write-Host "Skeleton structure created successfully!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1) Move existing frontend into Frontend/src/legacy/ (optional)"
Write-Host "2) Update Frontend/src/main.tsx to import from legacy (optional)"
Write-Host "3) Run 'pnpm install' to set up workspaces"
Write-Host "4) Run 'pnpm codegen' to materialize FE/BE role configs"
Write-Host "5) Start developing in the new structure!"


