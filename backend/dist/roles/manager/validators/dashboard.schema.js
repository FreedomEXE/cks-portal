"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardKPISchema = void 0;
/**
 * File: dashboard.schema.ts
 *
 * Description: Zod schema for dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Manager.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */
const zod_1 = require("zod");
exports.DashboardKPISchema = zod_1.z.object({
    contractors: zod_1.z.number(),
    customers: zod_1.z.number(),
    centers: zod_1.z.number(),
    crew: zod_1.z.number()
});
//# sourceMappingURL=dashboard.schema.js.map