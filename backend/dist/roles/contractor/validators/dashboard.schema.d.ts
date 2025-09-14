/**
 * File: dashboard.schema.ts
 *
 * Description: Zod schema for contractor dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Contractor.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */
import { z } from 'zod';
export declare const DashboardKPISchema: z.ZodObject<{
    activeJobs: z.ZodNumber;
    completedJobs: z.ZodNumber;
    totalRevenue: z.ZodNumber;
    avgRating: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalRevenue: number;
    avgRating: number;
    activeJobs: number;
    completedJobs: number;
}, {
    totalRevenue: number;
    avgRating: number;
    activeJobs: number;
    completedJobs: number;
}>;
export type DashboardKPI = z.infer<typeof DashboardKPISchema>;
//# sourceMappingURL=dashboard.schema.d.ts.map