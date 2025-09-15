/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * server/index.ts
 *
 * Description: Entry point. Loads env, tests DB, and starts Fastify.
 * Function: Bootstrap server with environment and DB preflight
 * Importance: Ensures DB available on boot and exposes HTTP server
 * Connects to: db/connection, fastify builder
 */

import "dotenv/config";
import { testConnection } from "./db/connection";
import { buildServer } from "./fastify";

async function start() {
  console.log("🚀 Starting CKS Portal Backend Server (Fastify)...");

  try {
    await testConnection();
    console.log("✅ DB connection ok — starting HTTP server...");

    const app = await buildServer();
    const port = Number(process.env.PORT || 5000);
    const host = process.env.HOST || "0.0.0.0";

    await app.listen({ port, host });
    console.log(`🎯 Server listening at http://${host}:${port}`);
  } catch (err) {
    console.error("❌ Startup failed — aborting:", err);
    process.exit(1);
  }
}

start();
