/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: errors.ts
 *
 * Description: Standardized error handling and HTTP response utilities
 * Function: Consistent error shapes, codes, and logging across all domains
 * Importance: Unified error handling for debugging and client error handling
 * Connects to: All domain handlers, audit logging, client error display
 */

import { Request, Response } from 'express';
import { logActivity } from '../logging/audit';

/**
 * Standard error codes used across the CKS API
 */
export const ErrorCodes = {
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
} as const;

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
export function createError(
  code: string,
  message: string,
  domain?: string,
  details?: any
): ApiError {
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
export async function sendError(
  req: Request,
  res: Response,
  statusCode: number,
  error: ApiError,
  logLevel: 'error' | 'warn' | 'info' = 'error'
) {
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
      await logActivity(
        req.user.userId,
        req.user.roleCode,
        'api_error',
        'system',
        `API error: ${error.code} - ${error.message}`,
        'error',
        error.code,
        logData,
        req.user.sessionId
      );
    } catch (auditError) {
      console.error('Failed to log error to audit trail:', auditError);
    }
  }

  // Send response
  const response: ApiResponse = {
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
export const ErrorHelpers = {
  /**
   * 400 Bad Request
   */
  badRequest: (req: Request, res: Response, message: string, details?: any) =>
    sendError(req, res, 400, createError(ErrorCodes.INVALID_INPUT, message, req.context?.domain, details)),

  /**
   * 401 Unauthorized
   */
  unauthorized: (req: Request, res: Response, message: string = 'Authentication required') =>
    sendError(req, res, 401, createError(ErrorCodes.AUTH_REQUIRED, message, req.context?.domain)),

  /**
   * 403 Forbidden
   */
  forbidden: (req: Request, res: Response, message: string = 'Insufficient permissions', details?: any) =>
    sendError(req, res, 403, createError(ErrorCodes.AUTH_FORBIDDEN, message, req.context?.domain, details)),

  /**
   * 404 Not Found
   */
  notFound: (req: Request, res: Response, resource: string = 'Resource') =>
    sendError(req, res, 404, createError(ErrorCodes.RESOURCE_NOT_FOUND, `${resource} not found`, req.context?.domain)),

  /**
   * 409 Conflict
   */
  conflict: (req: Request, res: Response, message: string, details?: any) =>
    sendError(req, res, 409, createError(ErrorCodes.RESOURCE_CONFLICT, message, req.context?.domain, details)),

  /**
   * 422 Validation Failed
   */
  validation: (req: Request, res: Response, message: string, details?: any) =>
    sendError(req, res, 422, createError(ErrorCodes.VALIDATION_FAILED, message, req.context?.domain, details)),

  /**
   * 500 Internal Server Error
   */
  internal: (req: Request, res: Response, message: string = 'Internal server error', details?: any) =>
    sendError(req, res, 500, createError(ErrorCodes.INTERNAL_ERROR, message, req.context?.domain, details), 'error'),

  /**
   * Database error
   */
  database: (req: Request, res: Response, operation: string, originalError?: any) => {
    const details = process.env.NODE_ENV === 'development' ? { originalError } : undefined;
    return sendError(
      req,
      res,
      500,
      createError(ErrorCodes.DATABASE_ERROR, `Database error during ${operation}`, req.context?.domain, details),
      'error'
    );
  }
};

/**
 * Error handling middleware for unhandled errors
 */
export function errorHandler(error: any, req: Request, res: Response, next: any) {
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
    return ErrorHelpers.validation(req, res, 'Invalid input data', {
      validationErrors: error.errors || error.details
    });
  }

  // Handle database errors
  if (error.code?.startsWith('23') || error.name === 'PostgresError') {
    return ErrorHelpers.database(req, res, 'query execution', error);
  }

  // Generic internal error
  console.error('Unhandled error:', error);
  return ErrorHelpers.internal(req, res, 'An unexpected error occurred');
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}