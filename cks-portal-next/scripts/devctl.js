/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: devctl.js
 *
 * Description:
 * devctl.js implementation
 *
 * Responsibilities:
 * - Provide devctl.js functionality
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

// Development orchestration helper
const { spawn } = require('child_process');

function runService(name, cmd) {
  console.log(`Starting ${name}...`);
  return spawn(cmd, { shell: true, stdio: 'inherit' });
}

module.exports = { runService };