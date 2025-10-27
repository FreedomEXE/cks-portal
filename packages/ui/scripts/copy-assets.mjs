#!/usr/bin/env node
import fg from 'fast-glob';
import { mkdir, cp } from 'fs/promises';
import { watch } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const pkgRoot = fileURLToPath(new URL('..', import.meta.url));
const srcDir = resolve(pkgRoot, 'src');
const distDir = resolve(pkgRoot, 'dist');

const patterns = [
  'styles/**/*',            // global CSS (e.g., styles/globals.css)
  '**/*.module.css',        // CSS modules alongside TSX
  'assets/**/*'             // images/fonts/etc if present
];

async function copyAll() {
  try {
    const files = await fg(patterns, { cwd: srcDir, dot: false });
    for (const rel of files) {
      const from = join(srcDir, rel);
      const to = join(distDir, rel);
      await mkdir(dirname(to), { recursive: true });
      await cp(from, to, { recursive: true });
    }
    console.log(`[ui] Copied ${files.length} asset(s) to dist.`);
  } catch (error) {
    console.error(`[ui] Error copying assets:`, error);
  }
}

await copyAll();

if (process.argv.includes('--watch')) {
  // Lightweight watcher without extra deps
  let pending = false;
  watch(srcDir, { recursive: true }, async (_event, filename) => {
    if (!filename) return;
    // Throttle bursts
    if (pending) return;
    pending = true;
    setTimeout(async () => {
      await copyAll();
      pending = false;
    }, 100);
  });
  console.log('[ui] Watching assets for changes...');
}
