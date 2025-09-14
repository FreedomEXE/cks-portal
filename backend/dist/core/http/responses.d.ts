/**
 * File: responses.ts
 *
 * Description: Standardized success response utilities
 * Function: Consistent response shapes and patterns across all domains
 * Importance: Unified API response format for client consistency
 * Connects to: All domain handlers, client response parsing
 */
import { Request, Response } from 'express';
import { ApiResponse } from './errors';
/**
 * Standard success response helpers
 */
export declare const ResponseHelpers: {
    /**
     * 200 OK - Standard success response
     */
    ok: <T = any>(res: Response, data: T, meta?: any) => Response<ApiResponse<T>>;
    /**
     * 201 Created - Resource creation success
     */
    created: <T = any>(res: Response, data: T, meta?: any) => Response<ApiResponse<T>>;
    /**
     * 202 Accepted - Asynchronous operation started
     */
    accepted: <T = any>(res: Response, data?: T, meta?: any) => Response<ApiResponse<T>>;
    /**
     * 204 No Content - Success with no response body
     */
    noContent: (res: Response) => Response;
    /**
     * Paginated response helper
     */
    paginated: <T = any>(res: Response, data: T[], pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages?: number;
    }) => Response<ApiResponse<T[]>>;
    /**
     * Collection response with counts
     */
    collection: <T = any>(res: Response, data: T[], meta?: {
        total?: number;
        filtered?: number;
        [key: string]: any;
    }) => Response<ApiResponse<T[]>>;
    /**
     * Health check response
     */
    health: (res: Response, status?: "ok" | "degraded" | "down", meta?: any) => Response;
};
/**
 * Response middleware to add request ID and timing
 */
export declare function responseMiddleware(req: Request, res: Response, next: any): void;
/**
 * CORS middleware for API responses
 */
export declare function corsMiddleware(req: Request, res: Response, next: any): any;
//# sourceMappingURL=responses.d.ts.map