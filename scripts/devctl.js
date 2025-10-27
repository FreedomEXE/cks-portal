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
const http = require('http');
const https = require('https');
const { URL } = require('url');

function runService(name, cmd, options = {}) {
  console.log(`Starting ${name}...`);
  return spawn(cmd, { shell: true, stdio: 'inherit', ...options });
}

function waitForUrl(rawUrl, {
  timeoutMs = 30_000,
  intervalMs = 500,
  expectStatus = 200,
} = {}) {
  const deadline = Date.now() + timeoutMs;
  const url = new URL(rawUrl);
  const client = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    function attempt() {
      if (Date.now() > deadline) {
        reject(new Error(`Timed out waiting for ${rawUrl}`));
        return;
      }
      const req = client.get(url, (res) => {
        const { statusCode } = res;
        res.resume();
        if (statusCode === expectStatus) {
          resolve(true);
        } else {
          setTimeout(attempt, intervalMs);
        }
      });
      req.on('error', () => setTimeout(attempt, intervalMs));
    }
    attempt();
  });
}

module.exports = { runService, waitForUrl };
