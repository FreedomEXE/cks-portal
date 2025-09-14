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
 * Description: Zod schema for center dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Center.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */
const zod_1 = require("zod");
exports.DashboardKPISchema = zod_1.z.object({
    activeOrders: zod_1.z.number(),
    completedOrders: zod_1.z.number(),
    totalRevenue: zod_1.z.number(),
    avgRating: zod_1.z.number()
});
//# sourceMappingURL=dashboard.schema.js.map