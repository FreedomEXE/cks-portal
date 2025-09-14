/**
 * File: deliveries.schema.ts
 *
 * Description: Validation schemas for warehouse deliveries operations
 * Function: Input validation and type safety
 * Importance: Ensures data integrity for warehouse operations
 * Connects to: deliveries routes and services
 */
import { z } from 'zod';
export declare const PlaceholderSchema: z.ZodObject<{
    message: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
}, {
    message?: string | undefined;
}>;
export type PlaceholderType = z.infer<typeof PlaceholderSchema>;
//# sourceMappingURL=deliveries.schema.d.ts.map