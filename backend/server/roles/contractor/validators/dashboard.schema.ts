/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: dashboard.schema.ts
 * 
 * Description: Zod schema for contractor dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Contractor.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */

import { z } from 'zod';

export const DashboardKPISchema = z.object({
  activeJobs: z.number(),
  completedJobs: z.number(),
  totalRevenue: z.number(),
  avgRating: z.number()
});

export type DashboardKPI = z.infer<typeof DashboardKPISchema>;