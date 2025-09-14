/**
 * File: services.schema.ts
 *
 * Description: Validates contractor service create/update DTOs.
 * Function: Validate service operations for contractor role
 * Importance: Ensures data integrity for contractor service management
 * Connects to: services.ts routes, services.service.ts.
 */
import { z } from 'zod';
export declare const ServiceCreateSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodString;
    description: z.ZodString;
    pricing: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["fixed", "hourly", "negotiable"]>;
        amount: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "fixed" | "hourly" | "negotiable";
        currency: string;
        amount?: number | undefined;
    }, {
        type: "fixed" | "hourly" | "negotiable";
        amount?: number | undefined;
        currency?: string | undefined;
    }>>;
    availability: z.ZodOptional<z.ZodObject<{
        daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
        timeSlots: z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            start: string;
            end: string;
        }, {
            start: string;
            end: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        daysOfWeek: number[];
        timeSlots: {
            start: string;
            end: string;
        }[];
    }, {
        daysOfWeek: number[];
        timeSlots: {
            start: string;
            end: string;
        }[];
    }>>;
    requirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description: string;
    category: string;
    name: string;
    tags?: string[] | undefined;
    pricing?: {
        type: "fixed" | "hourly" | "negotiable";
        currency: string;
        amount?: number | undefined;
    } | undefined;
    availability?: {
        daysOfWeek: number[];
        timeSlots: {
            start: string;
            end: string;
        }[];
    } | undefined;
    requirements?: string[] | undefined;
}, {
    description: string;
    category: string;
    name: string;
    tags?: string[] | undefined;
    pricing?: {
        type: "fixed" | "hourly" | "negotiable";
        amount?: number | undefined;
        currency?: string | undefined;
    } | undefined;
    availability?: {
        daysOfWeek: number[];
        timeSlots: {
            start: string;
            end: string;
        }[];
    } | undefined;
    requirements?: string[] | undefined;
}>;
export declare const ServiceUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    pricing: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["fixed", "hourly", "negotiable"]>;
        amount: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "fixed" | "hourly" | "negotiable";
        currency: string;
        amount?: number | undefined;
    }, {
        type: "fixed" | "hourly" | "negotiable";
        amount?: number | undefined;
        currency?: string | undefined;
    }>>>;
    availability: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        daysOfWeek: z.ZodArray<z.ZodNumber, "many">;
        timeSlots: z.ZodArray<z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            start: string;
            end: string;
        }, {
            start: string;
            end: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        daysOfWeek: number[];
        timeSlots: {
            start: string;
            end: string;
        }[];
    }, {
        daysOfWeek: number[];
        timeSlots: {
            start: string;
            end: string;
        }[];
    }>>>;
    requirements: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    category?: string | undefined;
    tags?: string[] | undefined;
    name?: string | undefined;
    pricing?: {
        type: "fixed" | "hourly" | "negotiable";
        currency: string;
        amount?: number | undefined;
    } | undefined;
    availability?: {
        daysOfWeek: number[];
        timeSlots: {
            start: string;
            end: string;
        }[];
    } | undefined;
    requirements?: string[] | undefined;
}, {
    description?: string | undefined;
    category?: string | undefined;
    tags?: string[] | undefined;
    name?: string | undefined;
    pricing?: {
        type: "fixed" | "hourly" | "negotiable";
        amount?: number | undefined;
        currency?: string | undefined;
    } | undefined;
    availability?: {
        daysOfWeek: number[];
        timeSlots: {
            start: string;
            end: string;
        }[];
    } | undefined;
    requirements?: string[] | undefined;
}>;
export declare const ServiceFilterSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodBoolean>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    active?: boolean | undefined;
    category?: string | undefined;
    search?: string | undefined;
}, {
    active?: boolean | undefined;
    category?: string | undefined;
    search?: string | undefined;
}>;
export type ServiceCreate = z.infer<typeof ServiceCreateSchema>;
export type ServiceUpdate = z.infer<typeof ServiceUpdateSchema>;
export type ServiceFilter = z.infer<typeof ServiceFilterSchema>;
//# sourceMappingURL=services.schema.d.ts.map