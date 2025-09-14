"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHelpers = void 0;
exports.responseMiddleware = responseMiddleware;
exports.corsMiddleware = corsMiddleware;
/**
 * Standard success response helpers
 */
exports.ResponseHelpers = {
    /**
     * 200 OK - Standard success response
     */
    ok: (res, data, meta) => {
        const response = {
            success: true,
            data,
            meta
        };
        return res.status(200).json(response);
    },
    /**
     * 201 Created - Resource creation success
     */
    created: (res, data, meta) => {
        const response = {
            success: true,
            data,
            meta
        };
        return res.status(201).json(response);
    },
    /**
     * 202 Accepted - Asynchronous operation started
     */
    accepted: (res, data, meta) => {
        const response = {
            success: true,
            data,
            meta
        };
        return res.status(202).json(response);
    },
    /**
     * 204 No Content - Success with no response body
     */
    noContent: (res) => {
        return res.status(204).send();
    },
    /**
     * Paginated response helper
     */
    paginated: (res, data, pagination) => {
        const totalPages = pagination.totalPages || Math.ceil(pagination.total / pagination.limit);
        const response = {
            success: true,
            data,
            meta: {
                pagination: {
                    ...pagination,
                    totalPages,
                    hasNext: pagination.page < totalPages,
                    hasPrev: pagination.page > 1
                }
            }
        };
        return res.status(200).json(response);
    },
    /**
     * Collection response with counts
     */
    collection: (res, data, meta) => {
        const response = {
            success: true,
            data,
            meta: {
                count: data.length,
                ...meta
            }
        };
        return res.status(200).json(response);
    },
    /**
     * Health check response
     */
    health: (res, status = 'ok', meta) => {
        const statusCode = status === 'ok' ? 200 : status === 'degraded' ? 200 : 503;
        const response = {
            status,
            timestamp: new Date().toISOString(),
            version: process.env.API_VERSION || 'v1',
            ...meta
        };
        return res.status(statusCode).json(response);
    }
};
/**
 * Response middleware to add request ID and timing
 */
function responseMiddleware(req, res, next) {
    // Add request ID header
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.set('X-Request-ID', requestId);
    // Add timing
    const startTime = Date.now();
    // Override json method to add timing metadata
    const originalJson = res.json;
    res.json = function (body) {
        const duration = Date.now() - startTime;
        // Add timing to response if it's our standard format
        if (body && typeof body === 'object' && body.hasOwnProperty('success')) {
            body.meta = {
                ...body.meta,
                requestId,
                duration: `${duration}ms`
            };
        }
        return originalJson.call(this, body);
    };
    next();
}
/**
 * CORS middleware for API responses
 */
function corsMiddleware(req, res, next) {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');
    res.header('Access-Control-Expose-Headers', 'X-Request-ID, X-Rate-Limit-Remaining');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
}
//# sourceMappingURL=responses.js.map