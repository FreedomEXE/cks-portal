/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: users.schema.ts
 * 
 * Description: Validation schemas for admin user management operations
 * Function: Provide input validation for user creation, updates, and role assignments
 * Importance: Security and data integrity for user management operations
 * Connects to: User routes, middleware validation
 * 
 * Notes: Comprehensive validation schemas using Joi for all user management operations
 */

import Joi from 'joi';

// User creation schema
export const userCreationSchema = Joi.object({
  user_name: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  first_name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),

  last_name: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),

  role_code: Joi.string()
    .valid('manager', 'contractor', 'center', 'customer', 'crew', 'warehouse')
    .required()
    .messages({
      'any.only': 'Role must be one of: manager, contractor, center, customer, crew, warehouse',
      'any.required': 'Role is required'
    }),

  org_id: Joi.string()
    .optional()
    .allow(null),

  manager_id: Joi.string()
    .optional()
    .allow(null),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'pending')
    .default('pending')
    .messages({
      'any.only': 'Status must be one of: active, inactive, suspended, pending'
    }),

  password_hash: Joi.string()
    .min(60) // bcrypt hashes are typically 60 characters
    .required()
    .messages({
      'string.min': 'Invalid password hash format',
      'any.required': 'Password hash is required'
    }),

  email_verified: Joi.boolean()
    .default(false),

  profile_data: Joi.object()
    .default({}),

  preferences: Joi.object()
    .default({})
});

// User update schema (all fields optional except validation requirements)
export const userUpdateSchema = Joi.object({
  user_name: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters'
    }),

  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  first_name: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name cannot exceed 50 characters'
    }),

  last_name: Joi.string()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name cannot exceed 50 characters'
    }),

  org_id: Joi.string()
    .optional()
    .allow(null),

  manager_id: Joi.string()
    .optional()
    .allow(null),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'pending')
    .optional()
    .messages({
      'any.only': 'Status must be one of: active, inactive, suspended, pending'
    }),

  email_verified: Joi.boolean()
    .optional(),

  profile_data: Joi.object()
    .optional(),

  preferences: Joi.object()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Role assignment schema
export const roleAssignmentSchema = Joi.object({
  role_code: Joi.string()
    .valid('manager', 'contractor', 'center', 'customer', 'crew', 'warehouse')
    .required()
    .messages({
      'any.only': 'Role must be one of: manager, contractor, center, customer, crew, warehouse',
      'any.required': 'Role is required'
    }),

  org_id: Joi.string()
    .optional()
    .allow(null),

  expires_at: Joi.date()
    .greater('now')
    .optional()
    .allow(null)
    .messages({
      'date.greater': 'Expiration date must be in the future'
    }),

  notes: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
});

// Password reset schema
export const passwordResetSchema = Joi.object({
  new_password_hash: Joi.string()
    .min(60) // bcrypt hashes are typically 60 characters
    .required()
    .messages({
      'string.min': 'Invalid password hash format',
      'any.required': 'New password hash is required'
    })
});

// User search/filter schema
export const userFilterSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),

  role_code: Joi.string()
    .valid('manager', 'contractor', 'center', 'customer', 'crew', 'warehouse')
    .optional()
    .messages({
      'any.only': 'Role must be one of: manager, contractor, center, customer, crew, warehouse'
    }),

  org_id: Joi.string()
    .optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'suspended', 'pending')
    .optional()
    .messages({
      'any.only': 'Status must be one of: active, inactive, suspended, pending'
    }),

  search: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Search term must be at least 1 character',
      'string.max': 'Search term cannot exceed 100 characters'
    })
});

// Bulk user operation schema
export const bulkUserOperationSchema = Joi.object({
  user_ids: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one user ID is required',
      'array.max': 'Cannot process more than 100 users at once',
      'any.required': 'User IDs array is required'
    }),

  operation: Joi.string()
    .valid('activate', 'deactivate', 'suspend', 'delete', 'assign_org', 'assign_role')
    .required()
    .messages({
      'any.only': 'Operation must be one of: activate, deactivate, suspend, delete, assign_org, assign_role',
      'any.required': 'Operation is required'
    }),

  // Optional parameters based on operation
  org_id: Joi.string()
    .when('operation', {
      is: 'assign_org',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

  role_code: Joi.string()
    .valid('manager', 'contractor', 'center', 'customer', 'crew', 'warehouse')
    .when('operation', {
      is: 'assign_role',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

  notes: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    })
});

// User impersonation schema (for admin support features)
export const userImpersonationSchema = Joi.object({
  target_user_id: Joi.string()
    .required()
    .messages({
      'any.required': 'Target user ID is required'
    }),

  reason: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Reason must be at least 10 characters',
      'string.max': 'Reason cannot exceed 500 characters',
      'any.required': 'Reason for impersonation is required'
    }),

  duration_minutes: Joi.number()
    .integer()
    .min(1)
    .max(480) // Maximum 8 hours
    .default(60)
    .messages({
      'number.integer': 'Duration must be an integer',
      'number.min': 'Duration must be at least 1 minute',
      'number.max': 'Duration cannot exceed 480 minutes (8 hours)'
    })
});