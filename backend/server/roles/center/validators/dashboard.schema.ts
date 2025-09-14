/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.schema.ts
 * 
 * Description: Zod schema for center dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Center.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */

import { z } from 'zod';

export const DashboardKPISchema = z.object({
  activeOrders: z.number(),
  completedOrders: z.number(),
  totalRevenue: z.number(),
  avgRating: z.number()
});

export type DashboardKPI = z.infer<typeof DashboardKPISchema>;