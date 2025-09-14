/**
 * File: dashboard.schema.ts
 *
 * Description: Zod schema for warehouse dashboard KPIs.
 * Function: Validate the KPI shape returned by the service.
 * Importance: Establishes backend validation pattern for Warehouse.
 * Connects to: dashboard.service.ts, routes/dashboard.ts.
 */
import { z } from 'zod';
export declare const DashboardKPISchema: z.ZodObject<{
    totalItems: z.ZodNumber;
    pendingShipments: z.ZodNumber;
    completedDeliveries: z.ZodNumber;
    inventoryValue: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    totalItems: number;
    pendingShipments: number;
    completedDeliveries: number;
    inventoryValue: number;
}, {
    totalItems: number;
    pendingShipments: number;
    completedDeliveries: number;
    inventoryValue: number;
}>;
export type DashboardKPI = z.infer<typeof DashboardKPISchema>;
//# sourceMappingURL=dashboard.schema.d.ts.map