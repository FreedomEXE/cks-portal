/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.schema.ts
 * 
 * Description: Zod schema for dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Manager.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */

import { z } from 'zod';

export const DashboardKPISchema = z.object({
  contractors: z.number(),
  customers: z.number(),
  centers: z.number(),
  crew: z.number()
});

export type DashboardKPI = z.infer<typeof DashboardKPISchema>;

