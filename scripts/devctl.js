#!/usr/bin/env node
/*
 Cross-platform dev process controller for CKS Portal
 Commands:
   node scripts/devctl.js start [backend|frontend|all]
   node scripts/devctl.js stop  [backend|frontend|all]
   node scripts/devctl.js restart [backend|frontend|all]
   node scripts/devctl.js status
*/

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = process.cwd();

const PROC = {
  backend: {
    name: 'backend',
    cwd: path.join(root, 'backend', 'server'),
    log: path.join(root, 'backend', 'server', 'backend-dev.log'),
    pid: path.join(root, '.backend_dev_pid'),
  },
  frontend: {
    name: 'frontend',
    cwd: path.join(root, 'frontend'),
    log: path.join(root, 'frontend', 'frontend-dev.log'),
    pid: path.join(root, '.frontend_dev_pid'),
  },
};

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isRunning(pid) {
  if (!pid || Number.isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid(pidFile) {
  try {
    const v = fs.readFileSync(pidFile, 'utf8').trim();
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

function writePid(pidFile, pid) {
  fs.writeFileSync(pidFile, String(pid));
}

function removePid(pidFile) {
  try { fs.unlinkSync(pidFile); } catch {}
}

function startOne(p) {
  const existing = readPid(p.pid);
  if (existing && isRunning(existing)) {
    console.log(`${p.name}: already running (pid ${existing})`);
    return existing;
  }

  ensureDir(p.log);
  const child = spawn(process.execPath, [path.join(root, 'scripts', 'run-dev.js'), p.name], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  writePid(p.pid, child.pid);
  child.unref();
  console.log(`${p.name}: started (pid ${child.pid}) → log: ${path.relative(root, p.log)}`);
  return child.pid;
}

function stopOne(p) {
  const pid = readPid(p.pid);
  if (!pid) {
    console.log(`${p.name}: not running (no pid file)`);
    removePid(p.pid);
    return false;
  }
  if (!isRunning(pid)) {
    console.log(`${p.name}: not running (stale pid ${pid})`);
    removePid(p.pid);
    return false;
  }
  try {
    process.kill(pid);
    const start = Date.now();
    const timeoutMs = 3000;
    while (isRunning(pid) && Date.now() - start < timeoutMs) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
    if (isRunning(pid)) {
      try { process.kill(pid, 'SIGKILL'); } catch {}
    }
    console.log(`${p.name}: stopped (pid ${pid})`);
  } catch (e) {
    console.log(`${p.name}: failed to stop pid ${pid}: ${e.message}`);
  } finally {
    removePid(p.pid);
  }
  return true;
}

function statusOne(p) {
  const pid = readPid(p.pid);
  const running = pid && isRunning(pid);
  console.log(`${p.name}: ${running ? `running (pid ${pid})` : 'stopped'}`);
}

function start(target) {
  if (target === 'all') {
    startOne(PROC.backend);
    startOne(PROC.frontend);
  } else {
    startOne(PROC[target]);
  }
}

function stop(target) {
  if (target === 'all') {
    stopOne(PROC.frontend);
    stopOne(PROC.backend);
  } else {
    stopOne(PROC[target]);
  }
}

function restart(target) {
  if (target === 'all') {
    stop('all');
    start('all');
  } else {
    stop(target);
    start(target);
  }
}

function status() {
  statusOne(PROC.backend);
  statusOne(PROC.frontend);
}

function usage() {
  console.log('Usage: node scripts/devctl.js <start|stop|restart|status> [backend|frontend|all]');
}

const [,, cmd, targetArg] = process.argv;
const target = targetArg || 'all';

if (!cmd || !['start','stop','restart','status'].includes(cmd)) {
  usage();
  process.exit(1);
}

if (cmd !== 'status' && !['backend','frontend','all'].includes(target)) {
  usage();
  process.exit(1);
}

switch (cmd) {
  case 'start':
    start(target);
    break;
  case 'stop':
    stop(target);
    break;
  case 'restart':
    restart(target);
    break;
  case 'status':
    status();
    break;
}

