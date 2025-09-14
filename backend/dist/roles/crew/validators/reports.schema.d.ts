/**
 * File: reports.schema.ts
 *
 * Description: Validation schemas for crew reports operations
 * Function: Input validation and type safety
 * Importance: Ensures data integrity for crew operations
 * Connects to: reports routes and services
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
//# sourceMappingURL=reports.schema.d.ts.map