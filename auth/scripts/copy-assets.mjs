#!/usr/bin/env node
import fg from 'fast-glob';
import { mkdir, cp } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const pkgRoot = fileURLToPath(new URL('..', import.meta.url));
const srcDir = resolve(pkgRoot, 'src');
const distDir = resolve(pkgRoot, 'dist');

const patterns = [
  'assets/**/*'             // images/fonts/etc if present
];

try {
  const files = await fg(patterns, { cwd: srcDir, dot: false });

  for (const rel of files) {
    const from = join(srcDir, rel);
    const to = join(distDir, rel);
    await mkdir(dirname(to), { recursive: true });
    await cp(from, to, { recursive: true });
  }

  console.log(`[auth] Copied ${files.length} asset(s) to dist.`);
} catch (error) {
  console.error(`[auth] Error copying assets:`, error);
  process.exit(1);
}