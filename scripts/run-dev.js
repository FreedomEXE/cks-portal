#!/usr/bin/env node

const path = require('path');
const { runService } = require('./devctl');

process.chdir(path.resolve(__dirname, '..'));

console.log('Starting CKS Portal development environment...');

runService('Backend', 'pnpm --filter @cks/backend dev');
runService('Frontend', 'pnpm --filter @cks/frontend dev');