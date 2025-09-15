/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * server/domains/assignments/routes.fastify.ts
 *
 * Description: Minimal Fastify plugin for assignments domain
 * Function: Seed endpoints (list, get by id)
 * Importance: Baseline domain surface wired under role prefixes
 */

import { FastifyPluginAsync } from "fastify";

const routes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ ok: true, domain: "assignments" }));
  app.get<{ Params: { id: string } }>("/:id", async (req) => ({ ok: true, domain: "assignments", id: req.params.id }));
};

export default routes;
