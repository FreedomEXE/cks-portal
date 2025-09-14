/**
 * File: dashboard.schema.ts
 *
 * Description: Zod schema for crew dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Crew.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */
import { z } from 'zod';
export declare const DashboardKPISchema: z.ZodObject<{
    activeJobs: z.ZodNumber;
    completedJobs: z.ZodNumber;
    hoursWorked: z.ZodNumber;
    avgRating: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    avgRating: number;
    activeJobs: number;
    completedJobs: number;
    hoursWorked: number;
}, {
    avgRating: number;
    activeJobs: number;
    completedJobs: number;
    hoursWorked: number;
}>;
export type DashboardKPI = z.infer<typeof DashboardKPISchema>;
//# sourceMappingURL=dashboard.schema.d.ts.map