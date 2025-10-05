#!/usr/bin/env node

const path = require('path');
const { runService, waitForUrl } = require('./devctl');

process.chdir(path.resolve(__dirname, '..'));

console.log('Starting CKS Portal development environment...');

runService('Backend', 'pnpm --filter @cks/backend exec cross-env PORT=4000 NODE_ENV=development TS_NODE_TRANSPILE_ONLY=1 tsx -r dotenv/config server/index.ts');

waitForUrl('http://localhost:4000/api/health', { timeoutMs: 120_000, intervalMs: 750 })
  .then(() => {
    console.log('Backend is ready. Starting Frontend...');
    runService('Frontend', 'pnpm --filter @cks/frontend dev');
  })
  .catch((err) => {
    console.error('Backend did not become ready in time:', err?.message || err);
    console.error('You can still start the Frontend, but API calls may fail until the backend is up.');
    runService('Frontend', 'pnpm --filter @cks/frontend dev');
  });
