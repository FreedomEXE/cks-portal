#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const target = process.argv[2];
const tLower = (target || '').toLowerCase();
if (!['backend', 'frontend'].includes(tLower)) {
  console.error('Usage: node scripts/run-dev.js <backend|frontend>');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const cfg = tLower === 'backend'
  ? { cwd: path.join(root, 'Backend'), log: path.join(root, 'Backend', 'backend-dev.log') }
  : { cwd: path.join(root, 'Frontend'), log: path.join(root, 'Frontend', 'frontend-dev.log') };

// Ensure log directory exists
fs.mkdirSync(path.dirname(cfg.log), { recursive: true });
const out = fs.createWriteStream(cfg.log, { flags: 'a' });

// Timestamp header
out.write(`\n===== START ${target.toUpperCase()} ${new Date().toISOString()} =====\n`);

const child = spawn(npmCmd, ['run', 'dev'], {
  cwd: cfg.cwd,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

child.stdout.pipe(out);
child.stderr.pipe(out);

const shutdown = (signal) => {
  try {
    child.kill();
  } catch {}
  // Give it a moment, then hard kill if needed
  const t = setTimeout(() => {
    try { process.kill(child.pid, 'SIGKILL'); } catch {}
    process.exit(0);
  }, 1500);
  // Once child exits, clear timer and exit
  child.once('exit', () => {
    clearTimeout(t);
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

child.on('exit', (code, signal) => {
  out.write(`\n===== STOP ${target.toUpperCase()} code=${code} signal=${signal} ${new Date().toISOString()} =====\n`);
  out.end(() => process.exit(code ?? 0));
});


