#!/usr/bin/env node

const path = require('path');
const net = require('net');
const { runService, waitForUrl } = require('./devctl');

process.chdir(path.resolve(__dirname, '..'));

async function isPortInUse(port, host = '127.0.0.1', timeoutMs = 350) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onClose = () => resolve(false);
    const onConnect = () => {
      socket.destroy();
      resolve(true);
    };
    const onError = (err) => {
      // If actively refused, there's nothing listening.
      if (err && (err.code === 'ECONNREFUSED' || err.code === 'EHOSTUNREACH')) {
        resolve(false);
      } else {
        // Treat other conditions conservatively as "likely in use".
        resolve(true);
      }
    };

    socket.setTimeout(timeoutMs, () => socket.destroy());
    socket.once('connect', onConnect);
    socket.once('error', onError);
    socket.once('close', onClose);
    try {
      socket.connect(port, host);
    } catch {
      resolve(true);
    }
  });
}

async function main() {
  console.log('Starting CKS Portal development environment...');

  const port = Number(process.env.PORT || 4000);
  const backendHealthUrl = `http://localhost:${port}/api/health`;

  // If something already listens on the backend port, skip starting a new one.
  if (await isPortInUse(port)) {
    console.log(`Detected a server on port ${port}. Skipping backend start.`);
  } else {
    runService(
      'Backend',
      'pnpm --filter @cks/backend exec tsx -r dotenv/config server/index.ts',
      {
        env: {
          ...process.env,
          PORT: String(port),
          NODE_ENV: 'development',
          TS_NODE_TRANSPILE_ONLY: '1',
        },
      }
    );
  }

  waitForUrl(backendHealthUrl, { timeoutMs: 120_000, intervalMs: 750 })
    .then(() => {
      console.log('Backend is ready. Starting Frontend...');
      runService('Frontend', 'pnpm --filter @cks/frontend dev');
    })
    .catch((err) => {
      console.error('Backend did not become ready in time:', err?.message || err);
      console.error('You can still start the Frontend, but API calls may fail until the backend is up.');
      runService('Frontend', 'pnpm --filter @cks/frontend dev');
    });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
