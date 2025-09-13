/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

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

import Joi from 'joi';

// Organization creation schema
export const organizationCreationSchema = Joi.object({
  org_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Organization name must be at least 2 characters long',
      'string.max': 'Organization name cannot exceed 100 characters',
      'any.required': 'Organization name is required'
    }),

  org_code: Joi.string()
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

  parent_org_id: Joi.string()
    .optional()
    .allow(null),

  org_type: Joi.string()
    .valid('corporate', 'branch', 'division', 'team')
    .default('branch')
    .messages({
      'any.only': 'Organization type must be one of: corporate, branch, division, team'
    }),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended')
    .default('active')
    .messages({
      'any.only': 'Status must be one of: active, inactive, suspended'
    }),

  contact_email: Joi.string()
    .email()
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Please provide a valid contact email address'
    }),

  contact_phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid contact phone number'
    }),

  address: Joi.object({
    street: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(50).optional(),
    postal_code: Joi.string().max(20).optional(),
    country: Joi.string().max(50).optional()
  }).optional(),

  settings: Joi.object().optional(),

  billing_info: Joi.object({
    billing_email: Joi.string().email().optional(),
    tax_id: Joi.string().max(50).optional(),
    payment_terms: Joi.number().integer().min(0).max(365).optional()
  }).optional()
});

// Organization update schema
export const organizationUpdateSchema = Joi.object({
  org_name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Organization name must be at least 2 characters long',
      'string.max': 'Organization name cannot exceed 100 characters'
    }),

  org_code: Joi.string()
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

  parent_org_id: Joi.string()
    .optional()
    .allow(null),

  org_type: Joi.string()
    .valid('corporate', 'branch', 'division', 'team')
    .optional()
    .messages({
      'any.only': 'Organization type must be one of: corporate, branch, division, team'
    }),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended')
    .optional()
    .messages({
      'any.only': 'Status must be one of: active, inactive, suspended'
    }),

  contact_email: Joi.string()
    .email()
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Please provide a valid contact email address'
    }),

  contact_phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid contact phone number'
    }),

  address: Joi.object({
    street: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(50).optional(),
    postal_code: Joi.string().max(20).optional(),
    country: Joi.string().max(50).optional()
  }).optional(),

  settings: Joi.object().optional(),

  billing_info: Joi.object({
    billing_email: Joi.string().email().optional(),
    tax_id: Joi.string().max(50).optional(),
    payment_terms: Joi.number().integer().min(0).max(365).optional()
  }).optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});