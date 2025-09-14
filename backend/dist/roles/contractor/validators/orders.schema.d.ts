/**
 * File: orders.schema.ts
 *
 * Description: Validates contractor order create/update DTOs.
 * Function: Validate order operations for contractor role
 * Importance: Ensures data integrity for contractor order management
 * Connects to: orders.ts routes, orders.service.ts.
 */
import { z } from 'zod';
export declare const OrderUpdateSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["accepted", "in_progress", "completed", "cancelled"]>>;
    notes: z.ZodOptional<z.ZodString>;
    progress_notes: z.ZodOptional<z.ZodString>;
    completed_date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "in_progress" | "completed" | "cancelled" | "accepted" | undefined;
    notes?: string | undefined;
    completed_date?: string | undefined;
    progress_notes?: string | undefined;
}, {
    status?: "in_progress" | "completed" | "cancelled" | "accepted" | undefined;
    notes?: string | undefined;
    completed_date?: string | undefined;
    progress_notes?: string | undefined;
}>;
export declare const OrderFilterSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    date_from: z.ZodOptional<z.ZodString>;
    date_to: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: string | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
}, {
    limit?: number | undefined;
    status?: string | undefined;
    date_from?: string | undefined;
    date_to?: string | undefined;
    offset?: number | undefined;
}>;
export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;
export type OrderFilter = z.infer<typeof OrderFilterSchema>;
//# sourceMappingURL=orders.schema.d.ts.map