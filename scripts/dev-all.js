#!/usr/bin/env node
// Runs frontend and backend dev servers together in the foreground with prefixed logs.
// Usage: node scripts/dev-all.js [--timeout <ms>]

const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const args = process.argv.slice(2);
let timeoutMs = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--timeout' && args[i + 1]) {
    timeoutMs = Number(args[i + 1]);
    i++;
  } else if (args[i] === '--smoke') {
    timeoutMs = 2500;
  }
}

function prefixPipe(child, label) {
  function writePrefixed(data) {
    const s = data.toString();
    s.split(/\r?\n/).forEach((line) => {
      if (line.length) process.stdout.write(`[${label}] ${line}\n`);
    });
  }
  child.stdout && child.stdout.on('data', writePrefixed);
  child.stderr && child.stderr.on('data', writePrefixed);
}

function runTarget(label, cwd) {
  const cmd = `${npmCmd} run dev`;
  const child = spawn(cmd, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    shell: true,
  });
  prefixPipe(child, label);
  child.on('exit', (code, signal) => {
    process.stdout.write(`[${label}] exited code=${code} signal=${signal}\n`);
  });
  return child;
}

const backendCwd = path.join(process.cwd(), 'backend', 'server');
const frontendCwd = path.join(process.cwd(), 'frontend');

const backend = runTarget('backend', backendCwd);
const frontend = runTarget('frontend', frontendCwd);

function shutdown() {
  try { backend.kill(); } catch {}
  try { frontend.kill(); } catch {}
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

if (timeoutMs && Number.isFinite(timeoutMs)) {
  setTimeout(() => {
    process.stdout.write(`[dev-all] timeout ${timeoutMs}ms reached, stopping...\n`);
    shutdown();
  }, timeoutMs);
}
