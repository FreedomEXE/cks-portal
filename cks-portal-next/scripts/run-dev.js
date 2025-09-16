/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: run-dev.js
 *
 * Description:
 * run-dev.js implementation
 *
 * Responsibilities:
 * - Provide run-dev.js functionality
 *
 * Role in system:
 * - Used by CKS Portal system
 *
 * Notes:
 * To be implemented
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

// One-command local dev runner
const { runService } = require('./devctl');

console.log('Starting CKS Portal development environment...');
runService('Frontend', 'cd Frontend && pnpm dev');
runService('Backend', 'cd Backend && pnpm dev');