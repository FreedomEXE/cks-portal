"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
/**
 * server/fastify.ts
 *
 * Description: Builds Fastify app and registers domain plugins
 * Function: Configure common plugins and route registration
 * Importance: Core HTTP server setup for Backend
 * Connects to: registerDomains, domain route plugins, roleResolver
 */
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const registerDomains_1 = require("./registerDomains");
async function buildServer() {
    const app = (0, fastify_1.default)({ logger: true });
    await app.register(cors_1.default);
    await app.register(helmet_1.default);
    await app.register(rate_limit_1.default, { max: 300, timeWindow: "1 minute" });
    // Minimal request audit
    app.addHook("onResponse", async (req) => {
        try {
            app.log.info({ method: req.method, url: req.url, status: req.raw?.statusCode });
        }
        catch { }
    });
    // Register all domain route plugins under their role prefixes
    await (0, registerDomains_1.registerDomainRoutes)(app);
    app.get("/healthz", async () => ({ ok: true }));
    return app;
}
//# sourceMappingURL=fastify.js.map