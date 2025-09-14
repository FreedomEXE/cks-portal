/**
 * File: profile.schema.ts
 *
 * Description: Validation schemas for center profile operations
 * Function: Input validation and type safety
 * Importance: Ensures data integrity for center operations
 * Connects to: profile routes and services
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
//# sourceMappingURL=profile.schema.d.ts.map