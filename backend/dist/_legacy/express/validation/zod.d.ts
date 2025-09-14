/**
 * File: zod.ts
 *
 * Description: Shared Zod validation utilities and middleware
 * Function: Consistent validation patterns and error handling across domains
 * Importance: Type-safe validation with standardized error responses
 * Connects to: All domain validators, request validation middleware
 */
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
/**
 * Common Zod schemas used across domains
 */
export declare const CommonSchemas: {
    /**
     * CKS User ID format (e.g., ADM-001, MGR-001, CON-001)
     */
    userId: z.ZodString;
    /**
     * Pagination parameters
     */
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        order: "asc" | "desc";
        limit: number;
        page: number;
        sort?: string | undefined;
    }, {
        sort?: string | undefined;
        order?: "asc" | "desc" | undefined;
        limit?: number | undefined;
        page?: number | undefined;
    }>;
    /**
     * Date range filter
     */
    dateRange: z.ZodObject<{
        date_from: z.ZodOptional<z.ZodString>;
        date_to: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        date_from?: string | undefined;
        date_to?: string | undefined;
    }, {
        date_from?: string | undefined;
        date_to?: string | undefined;
    }>;
    /**
     * Status filter
     */
    statusFilter: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<["active", "inactive", "archived", "pending"]>>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "inactive" | "archived" | "pending" | undefined;
    }, {
        status?: "active" | "inactive" | "archived" | "pending" | undefined;
    }>;
    /**
     * Search parameters
     */
    search: z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        field: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        query?: string | undefined;
        field?: string | undefined;
    }, {
        query?: string | undefined;
        field?: string | undefined;
    }>;
    /**
     * Metadata object (flexible JSON)
     */
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    /**
     * Email validation
     */
    email: z.ZodString;
    /**
     * Phone validation (flexible format)
     */
    phone: z.ZodOptional<z.ZodString>;
    /**
     * Role codes
     */
    roleCode: z.ZodEnum<["admin", "manager", "contractor", "customer", "center", "crew", "warehouse"]>;
    /**
     * Template version
     */
    templateVersion: z.ZodString;
};
/**
 * Validation middleware factory
 */
export declare function validate(schema: z.ZodSchema, source?: 'body' | 'query' | 'params'): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Validate multiple sources (body, query, params)
 */
export declare function validateMultiple(schemas: {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
}): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Domain-specific schema helpers
 */
export declare const DomainSchemas: {
    /**
     * Dashboard KPI response
     */
    dashboardKPI: z.ZodObject<{
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
    /**
     * Order status
     */
    orderStatus: z.ZodEnum<["pending", "approved", "in_progress", "completed", "cancelled", "archived"]>;
    /**
     * Activity log entry
     */
    activityLog: z.ZodObject<{
        id: z.ZodNumber;
        action_type: z.ZodString;
        description: z.ZodString;
        created_at: z.ZodString;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        created_at: string;
        id: number;
        action_type: string;
        metadata?: Record<string, any> | undefined;
    }, {
        description: string;
        created_at: string;
        id: number;
        action_type: string;
        metadata?: Record<string, any> | undefined;
    }>;
    /**
     * User profile base
     */
    userProfile: z.ZodObject<{
        user_id: z.ZodString;
        user_name: z.ZodString;
        email: z.ZodString;
        role_code: z.ZodEnum<["admin", "manager", "contractor", "customer", "center", "crew", "warehouse"]>;
        template_version: z.ZodString;
        created_at: z.ZodString;
        archived: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        user_id: string;
        role_code: "admin" | "manager" | "contractor" | "customer" | "center" | "crew" | "warehouse";
        created_at: string;
        user_name: string;
        email: string;
        template_version: string;
        archived: boolean;
    }, {
        user_id: string;
        role_code: "admin" | "manager" | "contractor" | "customer" | "center" | "crew" | "warehouse";
        created_at: string;
        user_name: string;
        email: string;
        template_version: string;
        archived: boolean;
    }>;
};
/**
 * Transform and sanitize input data
 */
export declare const Transforms: {
    /**
     * Trim and normalize strings
     */
    normalizeString: z.ZodEffects<z.ZodString, string, string>;
    /**
     * Uppercase user IDs
     */
    normalizeUserId: z.ZodEffects<z.ZodString, string, string>;
    /**
     * Lowercase email
     */
    normalizeEmail: z.ZodEffects<z.ZodString, string, string>;
    /**
     * Parse and validate JSON
     */
    parseJson: z.ZodEffects<z.ZodString, any, string>;
};
/**
 * Custom validation functions
 */
export declare const CustomValidators: {
    /**
     * Check if user ID belongs to specific role
     */
    userIdForRole: (expectedRole: string) => z.ZodEffects<z.ZodString, string, string>;
    /**
     * Validate future date
     */
    futureDate: z.ZodEffects<z.ZodString, string, string>;
    /**
     * Validate business hours
     */
    businessHours: z.ZodEffects<z.ZodString, string, string>;
};
//# sourceMappingURL=zod.d.ts.map