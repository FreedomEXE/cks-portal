/**
 * File: dashboard.schema.ts
 *
 * Description: Zod schema for dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Manager.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */
import { z } from 'zod';
export declare const DashboardKPISchema: z.ZodObject<{
    contractors: z.ZodNumber;
    customers: z.ZodNumber;
    centers: z.ZodNumber;
    crew: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    crew: number;
    contractors: number;
    customers: number;
    centers: number;
}, {
    crew: number;
    contractors: number;
    customers: number;
    centers: number;
}>;
export type DashboardKPI = z.infer<typeof DashboardKPISchema>;
//# sourceMappingURL=dashboard.schema.d.ts.map