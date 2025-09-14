"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomValidators = exports.Transforms = exports.DomainSchemas = exports.CommonSchemas = void 0;
exports.validate = validate;
exports.validateMultiple = validateMultiple;
/**
 * File: zod.ts
 *
 * Description: Shared Zod validation utilities and middleware
 * Function: Consistent validation patterns and error handling across domains
 * Importance: Type-safe validation with standardized error responses
 * Connects to: All domain validators, request validation middleware
 */
const zod_1 = require("zod");
const errors_1 = require("../http/errors");
/**
 * Common Zod schemas used across domains
 */
exports.CommonSchemas = {
    /**
     * CKS User ID format (e.g., ADM-001, MGR-001, CON-001)
     */
    userId: zod_1.z.string().regex(/^[A-Z]{3}-\d{3}$/, 'User ID must be in format XXX-000 (e.g., ADM-001, CON-001)'),
    /**
     * Pagination parameters
     */
    pagination: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
        sort: zod_1.z.string().optional(),
        order: zod_1.z.enum(['asc', 'desc']).default('desc')
    }),
    /**
     * Date range filter
     */
    dateRange: zod_1.z.object({
        date_from: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        date_to: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
    }),
    /**
     * Status filter
     */
    statusFilter: zod_1.z.object({
        status: zod_1.z.enum(['active', 'inactive', 'archived', 'pending']).optional()
    }),
    /**
     * Search parameters
     */
    search: zod_1.z.object({
        query: zod_1.z.string().min(1).max(100).optional(),
        field: zod_1.z.string().optional()
    }),
    /**
     * Metadata object (flexible JSON)
     */
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    /**
     * Email validation
     */
    email: zod_1.z.string().email('Invalid email format'),
    /**
     * Phone validation (flexible format)
     */
    phone: zod_1.z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
    /**
     * Role codes
     */
    roleCode: zod_1.z.enum(['admin', 'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse']),
    /**
     * Template version
     */
    templateVersion: zod_1.z.string().regex(/^v\d+$/, 'Template version must be in format v1, v2, etc.')
};
/**
 * Validation middleware factory
 */
function validate(schema, source = 'body') {
    return async (req, res, next) => {
        try {
            const data = req[source];
            const validated = await schema.parseAsync(data);
            // Replace the original data with validated data
            req[source] = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const details = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    received: err.received
                }));
                return errors_1.ErrorHelpers.validation(req, res, 'Validation failed', details);
            }
            // Other validation errors
            return errors_1.ErrorHelpers.badRequest(req, res, 'Invalid input data', error);
        }
    };
}
/**
 * Validate multiple sources (body, query, params)
 */
function validateMultiple(schemas) {
    return async (req, res, next) => {
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const details = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    received: err.received
                }));
                return errors_1.ErrorHelpers.validation(req, res, 'Validation failed', details);
            }
            return errors_1.ErrorHelpers.badRequest(req, res, 'Invalid input data', error);
        }
    };
}
/**
 * Domain-specific schema helpers
 */
exports.DomainSchemas = {
    /**
     * Dashboard KPI response
     */
    dashboardKPI: zod_1.z.object({
        contractors: zod_1.z.number().int().min(0),
        customers: zod_1.z.number().int().min(0),
        centers: zod_1.z.number().int().min(0),
        crew: zod_1.z.number().int().min(0)
    }),
    /**
     * Order status
     */
    orderStatus: zod_1.z.enum(['pending', 'approved', 'in_progress', 'completed', 'cancelled', 'archived']),
    /**
     * Activity log entry
     */
    activityLog: zod_1.z.object({
        id: zod_1.z.number().int(),
        action_type: zod_1.z.string(),
        description: zod_1.z.string(),
        created_at: zod_1.z.string().datetime(),
        metadata: exports.CommonSchemas.metadata
    }),
    /**
     * User profile base
     */
    userProfile: zod_1.z.object({
        user_id: exports.CommonSchemas.userId,
        user_name: zod_1.z.string().min(1).max(100),
        email: exports.CommonSchemas.email,
        role_code: exports.CommonSchemas.roleCode,
        template_version: exports.CommonSchemas.templateVersion,
        created_at: zod_1.z.string().datetime(),
        archived: zod_1.z.boolean()
    })
};
/**
 * Transform and sanitize input data
 */
exports.Transforms = {
    /**
     * Trim and normalize strings
     */
    normalizeString: zod_1.z.string().transform(val => val.trim()),
    /**
     * Uppercase user IDs
     */
    normalizeUserId: zod_1.z.string().transform(val => val.toUpperCase()),
    /**
     * Lowercase email
     */
    normalizeEmail: zod_1.z.string().email().transform(val => val.toLowerCase()),
    /**
     * Parse and validate JSON
     */
    parseJson: zod_1.z.string().transform((val, ctx) => {
        try {
            return JSON.parse(val);
        }
        catch {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Invalid JSON string'
            });
            return zod_1.z.NEVER;
        }
    })
};
/**
 * Custom validation functions
 */
exports.CustomValidators = {
    /**
     * Check if user ID belongs to specific role
     */
    userIdForRole: (expectedRole) => zod_1.z.string().refine((userId) => {
        const rolePrefix = userId.split('-')[0];
        const rolePrefixMap = {
            'ADM': 'admin',
            'MGR': 'manager',
            'CON': 'contractor',
            'CUS': 'customer',
            'CEN': 'center',
            'CRW': 'crew',
            'WHS': 'warehouse'
        };
        return rolePrefixMap[rolePrefix] === expectedRole;
    }, `User ID must belong to ${expectedRole} role`),
    /**
     * Validate future date
     */
    futureDate: zod_1.z.string().refine((date) => new Date(date) > new Date(), 'Date must be in the future'),
    /**
     * Validate business hours
     */
    businessHours: zod_1.z.string().refine((time) => {
        const [hours] = time.split(':').map(Number);
        return hours >= 6 && hours <= 22; // 6 AM to 10 PM
    }, 'Time must be during business hours (6 AM - 10 PM)')
};
//# sourceMappingURL=zod.js.map