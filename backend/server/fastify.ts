/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * server/fastify.ts
 *
 * Description: Builds Fastify app and registers domain plugins
 * Function: Configure common plugins and route registration
 * Importance: Core HTTP server setup for Backend
 * Connects to: registerDomains, domain route plugins, roleResolver
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { registerDomainRoutes } from "./registerDomains";

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors);
  await app.register(helmet);
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });

  // Minimal request audit
  app.addHook("onResponse", async (req) => {
    try { app.log.info({ method: req.method, url: req.url, status: (req as any).raw?.statusCode }); } catch {}
  });

  // Register all domain route plugins under their role prefixes
  await registerDomainRoutes(app);

  app.get("/healthz", async () => ({ ok: true }));

  return app;
}
