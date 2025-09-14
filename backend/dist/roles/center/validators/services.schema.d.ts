/**
 * File: services.schema.ts
 *
 * Description: Validation schemas for center services operations
 * Function: Input validation and type safety
 * Importance: Ensures data integrity for center operations
 * Connects to: services routes and services
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
//# sourceMappingURL=services.schema.d.ts.map