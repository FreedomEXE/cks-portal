#!/usr/bin/env node
/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: prebuild-codegen.mjs
 *
 * Description:
 * Emit FE/BE role modules from shared/roles/configs
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';

const root = process.cwd();
const rolesDir = join(root, 'shared', 'roles', 'configs');
function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}
function write(p, content) {
  ensureDir(dirname(p));
  writeFileSync(p, content);
}

const files = existsSync(rolesDir) ? readdirSync(rolesDir).filter((f) => f.endsWith('.json')) : [];
for (const file of files) {
  const role = basename(file).replace(/\.v1\.json$/, '');
  const jsonPath = join(rolesDir, file);
  let obj = {};
  try {
    obj = JSON.parse(readFileSync(jsonPath, 'utf8') || '{}');
  } catch {}

  // Frontend
  write(
    join(root, 'apps', 'frontend', 'src', 'roles', role, 'config.v1.json'),
    JSON.stringify(obj, null, 2)
  );
  write(
    join(root, 'apps', 'frontend', 'src', 'roles', role, 'index.ts'),
    `// GENERATED - DO NOT EDIT\n// Source: shared/roles/configs/${file}\nexport default ${JSON.stringify(obj, null, 2)} as const;\n`
  );

  // Backend
  write(
    join(root, 'apps', 'backend', 'server', 'roles', role, 'config.ts'),
    `// GENERATED - DO NOT EDIT\n// Source: shared/roles/configs/${file}\nexport default ${JSON.stringify(obj, null, 2)} as const;\n`
  );
}

// Contracts placeholder regeneration if missing
const contractsIndex = join(root, 'shared', 'contracts', 'index.ts');
if (!existsSync(contractsIndex)) {
  write(
    contractsIndex,
    `// GENERATED - DO NOT EDIT\nexport interface User { id: string; customId: string; role: string; }\n`
  );
}

console.log(`Codegen complete for ${files.length} role config(s).`);
