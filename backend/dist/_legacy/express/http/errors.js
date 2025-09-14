"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHelpers = exports.ErrorCodes = void 0;
exports.createError = createError;
exports.sendError = sendError;
exports.errorHandler = errorHandler;
const audit_1 = require("../logging/audit");
/**
 * Standard error codes used across the CKS API
 */
exports.ErrorCodes = {
    // Authentication & Authorization
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
    AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
    AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
    // Validation
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    // Resources
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
    // Business Logic
    BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
    ECOSYSTEM_ACCESS_DENIED: 'ECOSYSTEM_ACCESS_DENIED',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    // System
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    // Domain-specific
    ORDER_INVALID_STATUS: 'ORDER_INVALID_STATUS',
    USER_ALREADY_ARCHIVED: 'USER_ALREADY_ARCHIVED',
    ASSIGNMENT_CONFLICT: 'ASSIGNMENT_CONFLICT'
};
/**
 * Create standardized error response
 */
function createError(code, message, domain, details) {
    return {
        code,
        message,
        domain,
        details,
        timestamp: new Date().toISOString()
    };
}
/**
 * Send error response with logging
 */
async function sendError(req, res, statusCode, error, logLevel = 'error') {
    // Log error for debugging
    const logData = {
        error: error.code,
        message: error.message,
        domain: error.domain || req.context?.domain,
        role: req.context?.role,
        userId: req.user?.userId,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: error.details
    };
    console[logLevel]('API Error:', logData);
    // Log to audit trail if user is authenticated
    if (req.user) {
        try {
            await (0, audit_1.logActivity)(req.user.userId, req.user.roleCode, 'api_error', 'system', `API error: ${error.code} - ${error.message}`, 'error', error.code, logData, req.user.sessionId);
        }
        catch (auditError) {
            console.error('Failed to log error to audit trail:', auditError);
        }
    }
    // Send response
    const response = {
        success: false,
        error: {
            ...error,
            requestId: res.get('X-Request-ID') || generateRequestId()
        }
    };
    res.status(statusCode).json(response);
}
/**
 * Common error response helpers
 */
exports.ErrorHelpers = {
    /**
     * 400 Bad Request
     */
    badRequest: (req, res, message, details) => sendError(req, res, 400, createError(exports.ErrorCodes.INVALID_INPUT, message, req.context?.domain, details)),
    /**
     * 401 Unauthorized
     */
    unauthorized: (req, res, message = 'Authentication required') => sendError(req, res, 401, createError(exports.ErrorCodes.AUTH_REQUIRED, message, req.context?.domain)),
    /**
     * 403 Forbidden
     */
    forbidden: (req, res, message = 'Insufficient permissions', details) => sendError(req, res, 403, createError(exports.ErrorCodes.AUTH_FORBIDDEN, message, req.context?.domain, details)),
    /**
     * 404 Not Found
     */
    notFound: (req, res, resource = 'Resource') => sendError(req, res, 404, createError(exports.ErrorCodes.RESOURCE_NOT_FOUND, `${resource} not found`, req.context?.domain)),
    /**
     * 409 Conflict
     */
    conflict: (req, res, message, details) => sendError(req, res, 409, createError(exports.ErrorCodes.RESOURCE_CONFLICT, message, req.context?.domain, details)),
    /**
     * 422 Validation Failed
     */
    validation: (req, res, message, details) => sendError(req, res, 422, createError(exports.ErrorCodes.VALIDATION_FAILED, message, req.context?.domain, details)),
    /**
     * 500 Internal Server Error
     */
    internal: (req, res, message = 'Internal server error', details) => sendError(req, res, 500, createError(exports.ErrorCodes.INTERNAL_ERROR, message, req.context?.domain, details), 'error'),
    /**
     * Database error
     */
    database: (req, res, operation, originalError) => {
        const details = process.env.NODE_ENV === 'development' ? { originalError } : undefined;
        return sendError(req, res, 500, createError(exports.ErrorCodes.DATABASE_ERROR, `Database error during ${operation}`, req.context?.domain, details), 'error');
    }
};
/**
 * Error handling middleware for unhandled errors
 */
function errorHandler(error, req, res, next) {
    // If response already sent, delegate to default Express error handler
    if (res.headersSent) {
        return next(error);
    }
    // Handle known error types
    if (error.code && error.message) {
        return sendError(req, res, error.statusCode || 500, error);
    }
    // Handle validation errors (Zod, Joi, etc.)
    if (error.name === 'ValidationError' || error.name === 'ZodError') {
        return exports.ErrorHelpers.validation(req, res, 'Invalid input data', {
            validationErrors: error.errors || error.details
        });
    }
    // Handle database errors
    if (error.code?.startsWith('23') || error.name === 'PostgresError') {
        return exports.ErrorHelpers.database(req, res, 'query execution', error);
    }
    // Generic internal error
    console.error('Unhandled error:', error);
    return exports.ErrorHelpers.internal(req, res, 'An unexpected error occurred');
}
/**
 * Generate unique request ID for tracing
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=errors.js.map