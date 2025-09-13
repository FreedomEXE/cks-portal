/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

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
import { ErrorHelpers } from '../http/errors';

/**
 * Common Zod schemas used across domains
 */
export const CommonSchemas = {
  /**
   * CKS User ID format (e.g., ADM-001, MGR-001, CON-001)
   */
  userId: z.string().regex(
    /^[A-Z]{3}-\d{3}$/,
    'User ID must be in format XXX-000 (e.g., ADM-001, CON-001)'
  ),

  /**
   * Pagination parameters
   */
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),

  /**
   * Date range filter
   */
  dateRange: z.object({
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }),

  /**
   * Status filter
   */
  statusFilter: z.object({
    status: z.enum(['active', 'inactive', 'archived', 'pending']).optional()
  }),

  /**
   * Search parameters
   */
  search: z.object({
    query: z.string().min(1).max(100).optional(),
    field: z.string().optional()
  }),

  /**
   * Metadata object (flexible JSON)
   */
  metadata: z.record(z.any()).optional(),

  /**
   * Email validation
   */
  email: z.string().email('Invalid email format'),

  /**
   * Phone validation (flexible format)
   */
  phone: z.string().regex(
    /^[\+]?[1-9][\d]{0,15}$/,
    'Invalid phone number format'
  ).optional(),

  /**
   * Role codes
   */
  roleCode: z.enum(['admin', 'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse']),

  /**
   * Template version
   */
  templateVersion: z.string().regex(/^v\d+$/, 'Template version must be in format v1, v2, etc.')
};

/**
 * Validation middleware factory
 */
export function validate(schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validated = await schema.parseAsync(data);

      // Replace the original data with validated data
      req[source] = validated;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));

        return ErrorHelpers.validation(req, res, 'Validation failed', details);
      }

      // Other validation errors
      return ErrorHelpers.badRequest(req, res, 'Invalid input data', error);
    }
  };
}

/**
 * Validate multiple sources (body, query, params)
 */
export function validateMultiple(schemas: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));

        return ErrorHelpers.validation(req, res, 'Validation failed', details);
      }

      return ErrorHelpers.badRequest(req, res, 'Invalid input data', error);
    }
  };
}

/**
 * Domain-specific schema helpers
 */
export const DomainSchemas = {
  /**
   * Dashboard KPI response
   */
  dashboardKPI: z.object({
    contractors: z.number().int().min(0),
    customers: z.number().int().min(0),
    centers: z.number().int().min(0),
    crew: z.number().int().min(0)
  }),

  /**
   * Order status
   */
  orderStatus: z.enum(['pending', 'approved', 'in_progress', 'completed', 'cancelled', 'archived']),

  /**
   * Activity log entry
   */
  activityLog: z.object({
    id: z.number().int(),
    action_type: z.string(),
    description: z.string(),
    created_at: z.string().datetime(),
    metadata: CommonSchemas.metadata
  }),

  /**
   * User profile base
   */
  userProfile: z.object({
    user_id: CommonSchemas.userId,
    user_name: z.string().min(1).max(100),
    email: CommonSchemas.email,
    role_code: CommonSchemas.roleCode,
    template_version: CommonSchemas.templateVersion,
    created_at: z.string().datetime(),
    archived: z.boolean()
  })
};

/**
 * Transform and sanitize input data
 */
export const Transforms = {
  /**
   * Trim and normalize strings
   */
  normalizeString: z.string().transform(val => val.trim()),

  /**
   * Uppercase user IDs
   */
  normalizeUserId: z.string().transform(val => val.toUpperCase()),

  /**
   * Lowercase email
   */
  normalizeEmail: z.string().email().transform(val => val.toLowerCase()),

  /**
   * Parse and validate JSON
   */
  parseJson: z.string().transform((val, ctx) => {
    try {
      return JSON.parse(val);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON string'
      });
      return z.NEVER;
    }
  })
};

/**
 * Custom validation functions
 */
export const CustomValidators = {
  /**
   * Check if user ID belongs to specific role
   */
  userIdForRole: (expectedRole: string) =>
    z.string().refine(
      (userId) => {
        const rolePrefix = userId.split('-')[0];
        const rolePrefixMap: Record<string, string> = {
          'ADM': 'admin',
          'MGR': 'manager',
          'CON': 'contractor',
          'CUS': 'customer',
          'CEN': 'center',
          'CRW': 'crew',
          'WHS': 'warehouse'
        };
        return rolePrefixMap[rolePrefix] === expectedRole;
      },
      `User ID must belong to ${expectedRole} role`
    ),

  /**
   * Validate future date
   */
  futureDate: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Date must be in the future'
  ),

  /**
   * Validate business hours
   */
  businessHours: z.string().refine(
    (time) => {
      const [hours] = time.split(':').map(Number);
      return hours >= 6 && hours <= 22; // 6 AM to 10 PM
    },
    'Time must be during business hours (6 AM - 10 PM)'
  )
};