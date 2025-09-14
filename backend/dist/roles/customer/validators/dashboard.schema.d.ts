/**
 * File: dashboard.schema.ts
 *
 * Description: Zod schema for customer dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Customer.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */
import { z } from 'zod';
export declare const DashboardKPISchema: z.ZodObject<{
    activeOrders: z.ZodNumber;
    completedOrders: z.ZodNumber;
    totalSpent: z.ZodNumber;
    avgRating: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    activeOrders: number;
    completedOrders: number;
    avgRating: number;
    totalSpent: number;
}, {
    activeOrders: number;
    completedOrders: number;
    avgRating: number;
    totalSpent: number;
}>;
export type DashboardKPI = z.infer<typeof DashboardKPISchema>;
//# sourceMappingURL=dashboard.schema.d.ts.map