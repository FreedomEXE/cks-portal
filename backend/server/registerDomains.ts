/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * server/registerDomains.ts
 *
 * Description: Helper to mount each domain plugin under every role prefix
 * Function: Loops rolePrefixes and registers domain Fastify plugins
 * Importance: Centralized domain-to-role wiring
 * Connects to: core/config/roleResolver, domain route plugins
 */

import { FastifyInstance } from "fastify";
import { rolePrefixes } from "./core/config/roleResolver";

// Domain Fastify plugins (default exports)
import dashboard from "./domains/dashboard/routes.fastify";
import directory from "./domains/directory/routes.fastify";
import services from "./domains/services/routes.fastify";
import orders from "./domains/orders/routes.fastify";
import reports from "./domains/reports/routes.fastify";
import assignments from "./domains/assignments/routes.fastify";
import support from "./domains/support/routes.fastify";

// Optional extra domains present in repo
import archive from "./domains/archive/routes.fastify";
import catalog from "./domains/catalog/routes.fastify";
import inventory from "./domains/inventory/routes.fastify";
import deliveries from "./domains/deliveries/routes.fastify";
import profile from "./domains/profile/routes.fastify";

export async function registerDomainRoutes(app: FastifyInstance) {
  const domains: Record<string, any> = {
    dashboard,
    directory,
    services,
    orders,
    reports,
    assignments,
    support,
    // extras
    archive,
    catalog,
    inventory,
    deliveries,
    profile,
  };

  for (const prefix of Object.values(rolePrefixes)) {
    for (const [name, plugin] of Object.entries(domains)) {
      await app.register(plugin, { prefix: `${prefix}/${name}` });
    }
  }
}

