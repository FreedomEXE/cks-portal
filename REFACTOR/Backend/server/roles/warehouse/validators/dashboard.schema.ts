/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.schema.ts
 * 
 * Description: Zod schema for warehouse dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Warehouse.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */

import { z } from 'zod';

export const DashboardKPISchema = z.object({
  totalItems: z.number(),
  pendingShipments: z.number(),
  completedDeliveries: z.number(),
  inventoryValue: z.number()
});

export type DashboardKPI = z.infer<typeof DashboardKPISchema>;