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
 * Description: Zod schema for warehouse dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Warehouse.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */
const zod_1 = require("zod");
exports.DashboardKPISchema = zod_1.z.object({
    totalItems: zod_1.z.number(),
    pendingShipments: zod_1.z.number(),
    completedDeliveries: zod_1.z.number(),
    inventoryValue: zod_1.z.number()
});
//# sourceMappingURL=dashboard.schema.js.map