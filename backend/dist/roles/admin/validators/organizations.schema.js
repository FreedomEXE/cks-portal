"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationUpdateSchema = exports.organizationCreationSchema = void 0;
/**
 * File: organizations.schema.ts
 *
 * Description: Validation schemas for admin organization management operations
 * Function: Provide input validation for organization creation, updates, and assignments
 * Importance: Security and data integrity for organization management operations
 * Connects to: Organization routes, middleware validation
 *
 * Notes: Comprehensive validation schemas using Joi for organization management
 */
const joi_1 = __importDefault(require("joi"));
// Organization creation schema
exports.organizationCreationSchema = joi_1.default.object({
    org_name: joi_1.default.string()
        .min(2)
        .max(100)
        .required()
        .messages({
        'string.min': 'Organization name must be at least 2 characters long',
        'string.max': 'Organization name cannot exceed 100 characters',
        'any.required': 'Organization name is required'
    }),
    org_code: joi_1.default.string()
        .alphanum()
        .min(2)
        .max(20)
        .uppercase()
        .optional()
        .messages({
        'string.alphanum': 'Organization code must contain only alphanumeric characters',
        'string.min': 'Organization code must be at least 2 characters long',
        'string.max': 'Organization code cannot exceed 20 characters'
    }),
    parent_org_id: joi_1.default.string()
        .optional()
        .allow(null),
    org_type: joi_1.default.string()
        .valid('corporate', 'branch', 'division', 'team')
        .default('branch')
        .messages({
        'any.only': 'Organization type must be one of: corporate, branch, division, team'
    }),
    status: joi_1.default.string()
        .valid('active', 'inactive', 'suspended')
        .default('active')
        .messages({
        'any.only': 'Status must be one of: active, inactive, suspended'
    }),
    contact_email: joi_1.default.string()
        .email()
        .optional()
        .allow(null, '')
        .messages({
        'string.email': 'Please provide a valid contact email address'
    }),
    contact_phone: joi_1.default.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .optional()
        .allow(null, '')
        .messages({
        'string.pattern.base': 'Please provide a valid contact phone number'
    }),
    address: joi_1.default.object({
        street: joi_1.default.string().max(200).optional(),
        city: joi_1.default.string().max(100).optional(),
        state: joi_1.default.string().max(50).optional(),
        postal_code: joi_1.default.string().max(20).optional(),
        country: joi_1.default.string().max(50).optional()
    }).optional(),
    settings: joi_1.default.object().optional(),
    billing_info: joi_1.default.object({
        billing_email: joi_1.default.string().email().optional(),
        tax_id: joi_1.default.string().max(50).optional(),
        payment_terms: joi_1.default.number().integer().min(0).max(365).optional()
    }).optional()
});
// Organization update schema
exports.organizationUpdateSchema = joi_1.default.object({
    org_name: joi_1.default.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
        'string.min': 'Organization name must be at least 2 characters long',
        'string.max': 'Organization name cannot exceed 100 characters'
    }),
    org_code: joi_1.default.string()
        .alphanum()
        .min(2)
        .max(20)
        .uppercase()
        .optional()
        .messages({
        'string.alphanum': 'Organization code must contain only alphanumeric characters',
        'string.min': 'Organization code must be at least 2 characters long',
        'string.max': 'Organization code cannot exceed 20 characters'
    }),
    parent_org_id: joi_1.default.string()
        .optional()
        .allow(null),
    org_type: joi_1.default.string()
        .valid('corporate', 'branch', 'division', 'team')
        .optional()
        .messages({
        'any.only': 'Organization type must be one of: corporate, branch, division, team'
    }),
    status: joi_1.default.string()
        .valid('active', 'inactive', 'suspended')
        .optional()
        .messages({
        'any.only': 'Status must be one of: active, inactive, suspended'
    }),
    contact_email: joi_1.default.string()
        .email()
        .optional()
        .allow(null, '')
        .messages({
        'string.email': 'Please provide a valid contact email address'
    }),
    contact_phone: joi_1.default.string()
        .pattern(/^[\+]?[1-9][\d]{0,15}$/)
        .optional()
        .allow(null, '')
        .messages({
        'string.pattern.base': 'Please provide a valid contact phone number'
    }),
    address: joi_1.default.object({
        street: joi_1.default.string().max(200).optional(),
        city: joi_1.default.string().max(100).optional(),
        state: joi_1.default.string().max(50).optional(),
        postal_code: joi_1.default.string().max(20).optional(),
        country: joi_1.default.string().max(50).optional()
    }).optional(),
    settings: joi_1.default.object().optional(),
    billing_info: joi_1.default.object({
        billing_email: joi_1.default.string().email().optional(),
        tax_id: joi_1.default.string().max(50).optional(),
        payment_terms: joi_1.default.number().integer().min(0).max(365).optional()
    }).optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});
//# sourceMappingURL=organizations.schema.js.map