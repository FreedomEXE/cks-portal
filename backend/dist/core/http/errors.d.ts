/**
 * File: errors.ts
 *
 * Description: Standardized error handling and HTTP response utilities
 * Function: Consistent error shapes, codes, and logging across all domains
 * Importance: Unified error handling for debugging and client error handling
 * Connects to: All domain handlers, audit logging, client error display
 */
import { Request, Response } from 'express';
/**
 * Standard error codes used across the CKS API
 */
export declare const ErrorCodes: {
    readonly AUTH_REQUIRED: "AUTH_REQUIRED";
    readonly AUTH_INVALID_TOKEN: "AUTH_INVALID_TOKEN";
    readonly AUTH_FORBIDDEN: "AUTH_FORBIDDEN";
    readonly AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly RESOURCE_ALREADY_EXISTS: "RESOURCE_ALREADY_EXISTS";
    readonly RESOURCE_CONFLICT: "RESOURCE_CONFLICT";
    readonly BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION";
    readonly ECOSYSTEM_ACCESS_DENIED: "ECOSYSTEM_ACCESS_DENIED";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR";
    readonly ORDER_INVALID_STATUS: "ORDER_INVALID_STATUS";
    readonly USER_ALREADY_ARCHIVED: "USER_ALREADY_ARCHIVED";
    readonly ASSIGNMENT_CONFLICT: "ASSIGNMENT_CONFLICT";
};
/**
 * Standard error interface
 */
export interface ApiError {
    code: string;
    message: string;
    domain?: string;
    details?: any;
    timestamp: string;
    requestId?: string;
}
/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        [key: string]: any;
    };
}
/**
 * Create standardized error response
 */
export declare function createError(code: string, message: string, domain?: string, details?: any): ApiError;
/**
 * Send error response with logging
 */
export declare function sendError(req: Request, res: Response, statusCode: number, error: ApiError, logLevel?: 'error' | 'warn' | 'info'): Promise<void>;
/**
 * Common error response helpers
 */
export declare const ErrorHelpers: {
    /**
     * 400 Bad Request
     */
    badRequest: (req: Request, res: Response, message: string, details?: any) => Promise<void>;
    /**
     * 401 Unauthorized
     */
    unauthorized: (req: Request, res: Response, message?: string) => Promise<void>;
    /**
     * 403 Forbidden
     */
    forbidden: (req: Request, res: Response, message?: string, details?: any) => Promise<void>;
    /**
     * 404 Not Found
     */
    notFound: (req: Request, res: Response, resource?: string) => Promise<void>;
    /**
     * 409 Conflict
     */
    conflict: (req: Request, res: Response, message: string, details?: any) => Promise<void>;
    /**
     * 422 Validation Failed
     */
    validation: (req: Request, res: Response, message: string, details?: any) => Promise<void>;
    /**
     * 500 Internal Server Error
     */
    internal: (req: Request, res: Response, message?: string, details?: any) => Promise<void>;
    /**
     * Database error
     */
    database: (req: Request, res: Response, operation: string, originalError?: any) => Promise<void>;
};
/**
 * Error handling middleware for unhandled errors
 */
export declare function errorHandler(error: any, req: Request, res: Response, next: any): any;
//# sourceMappingURL=errors.d.ts.map