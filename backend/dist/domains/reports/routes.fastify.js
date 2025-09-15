"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
const routes = async (app) => {
    app.get("/", async () => ({ ok: true, domain: "reports" }));
    app.get("/:id", async (req) => ({ ok: true, domain: "reports", id: req.params.id }));
};
exports.default = routes;
//# sourceMappingURL=routes.fastify.js.map