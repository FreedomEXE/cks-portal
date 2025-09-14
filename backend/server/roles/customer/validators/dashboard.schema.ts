/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.schema.ts
 * 
 * Description: Zod schema for customer dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Customer.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */

import { z } from 'zod';

export const DashboardKPISchema = z.object({
  activeOrders: z.number(),
  completedOrders: z.number(),
  totalSpent: z.number(),
  avgRating: z.number()
});

export type DashboardKPI = z.infer<typeof DashboardKPISchema>;