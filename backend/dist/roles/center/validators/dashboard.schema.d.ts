/**
 * File: dashboard.schema.ts
 *
 * Description: Zod schema for center dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Center.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */
import { z } from 'zod';
export declare const DashboardKPISchema: z.ZodObject<{
    activeOrders: z.ZodNumber;
    completedOrders: z.ZodNumber;
    totalRevenue: z.ZodNumber;
    avgRating: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    activeOrders: number;
    completedOrders: number;
    totalRevenue: number;
    avgRating: number;
}, {
    activeOrders: number;
    completedOrders: number;
    totalRevenue: number;
    avgRating: number;
}>;
export type DashboardKPI = z.infer<typeof DashboardKPISchema>;
//# sourceMappingURL=dashboard.schema.d.ts.map