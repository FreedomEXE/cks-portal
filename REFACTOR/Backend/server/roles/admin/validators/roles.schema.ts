/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: roles.schema.ts
 * 
 * Description: Validation schemas for admin role and permission management operations
 * Function: Provide input validation for role creation, updates, and capability assignments
 * Importance: Security and data integrity for RBAC system management
 * Connects to: Role routes, middleware validation
 * 
 * Notes: Validation schemas for comprehensive role-based access control management
 */

import Joi from 'joi';

// Admin role creation schema
export const roleCreationSchema = Joi.object({
  role_name: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_\s-]+$/)
    .required()
    .messages({
      'string.min': 'Role name must be at least 3 characters long',
      'string.max': 'Role name cannot exceed 50 characters',
      'string.pattern.base': 'Role name can only contain letters, numbers, spaces, hyphens, and underscores',
      'any.required': 'Role name is required'
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  is_default: Joi.boolean()
    .default(false),

  can_manage_admins: Joi.boolean()
    .default(false),

  can_manage_system: Joi.boolean()
    .default(false),

  capabilities: Joi.array()
    .items(Joi.string().required())
    .unique()
    .max(100)
    .optional()
    .messages({
      'array.unique': 'Capability IDs must be unique',
      'array.max': 'Cannot assign more than 100 capabilities to a role'
    })
});

// Admin role update schema
export const roleUpdateSchema = Joi.object({
  role_name: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_\s-]+$/)
    .optional()
    .messages({
      'string.min': 'Role name must be at least 3 characters long',
      'string.max': 'Role name cannot exceed 50 characters',
      'string.pattern.base': 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  is_default: Joi.boolean()
    .optional(),

  can_manage_admins: Joi.boolean()
    .optional(),

  can_manage_system: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Capability assignment schema
export const capabilityAssignmentSchema = Joi.object({
  capability_ids: Joi.array()
    .items(Joi.string().required())
    .unique()
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.unique': 'Capability IDs must be unique',
      'array.min': 'At least one capability ID is required',
      'array.max': 'Cannot assign more than 100 capabilities at once',
      'any.required': 'Capability IDs array is required'
    })
});

// Admin user role assignment schema
export const adminRoleAssignmentSchema = Joi.object({
  admin_role_id: Joi.string()
    .required()
    .messages({
      'any.required': 'Admin role ID is required'
    }),

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

// Direct capability grant schema
export const directCapabilityGrantSchema = Joi.object({
  capability_id: Joi.string()
    .required()
    .messages({
      'any.required': 'Capability ID is required'
    }),

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
    }),

  temporary_grant: Joi.boolean()
    .default(false),

  justification: Joi.string()
    .min(10)
    .max(1000)
    .when('temporary_grant', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': 'Justification must be at least 10 characters',
      'string.max': 'Justification cannot exceed 1000 characters',
      'any.required': 'Justification is required for temporary grants'
    })
});

// Capability creation schema (for creating new capabilities)
export const capabilityCreationSchema = Joi.object({
  capability_id: Joi.string()
    .pattern(/^[a-z_]+:[a-z_]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Capability ID must follow format: category:action (e.g., users:create)',
      'any.required': 'Capability ID is required'
    }),

  capability_name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Capability name must be at least 3 characters long',
      'string.max': 'Capability name cannot exceed 100 characters',
      'any.required': 'Capability name is required'
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  category: Joi.string()
    .valid('users', 'organizations', 'roles', 'system', 'audit', 'reports', 'security', 'admin')
    .required()
    .messages({
      'any.only': 'Category must be one of: users, organizations, roles, system, audit, reports, security, admin',
      'any.required': 'Category is required'
    }),

  is_system_critical: Joi.boolean()
    .default(false)
});

// Role hierarchy schema (for complex role relationships)
export const roleHierarchySchema = Joi.object({
  parent_role_id: Joi.string()
    .required()
    .messages({
      'any.required': 'Parent role ID is required'
    }),

  child_role_id: Joi.string()
    .required()
    .messages({
      'any.required': 'Child role ID is required'
    }),

  inheritance_type: Joi.string()
    .valid('full', 'partial', 'additive')
    .default('additive')
    .messages({
      'any.only': 'Inheritance type must be one of: full, partial, additive'
    }),

  excluded_capabilities: Joi.array()
    .items(Joi.string())
    .unique()
    .optional()
    .when('inheritance_type', {
      is: 'partial',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'array.unique': 'Excluded capabilities must be unique',
      'any.required': 'Excluded capabilities are required for partial inheritance'
    })
});

// Permission audit schema
export const permissionAuditSchema = Joi.object({
  audit_type: Joi.string()
    .valid('role_permissions', 'user_permissions', 'capability_usage', 'permission_changes')
    .required()
    .messages({
      'any.only': 'Audit type must be one of: role_permissions, user_permissions, capability_usage, permission_changes',
      'any.required': 'Audit type is required'
    }),

  target_id: Joi.string()
    .optional(),

  start_date: Joi.date()
    .required()
    .messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required'
    }),

  end_date: Joi.date()
    .greater(Joi.ref('start_date'))
    .required()
    .messages({
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required'
    }),

  include_inactive: Joi.boolean()
    .default(false),

  format: Joi.string()
    .valid('json', 'csv', 'xlsx')
    .default('json')
    .messages({
      'any.only': 'Format must be one of: json, csv, xlsx'
    })
});

// Bulk role operation schema
export const bulkRoleOperationSchema = Joi.object({
  operation: Joi.string()
    .valid('assign_role', 'revoke_role', 'grant_capability', 'revoke_capability')
    .required()
    .messages({
      'any.only': 'Operation must be one of: assign_role, revoke_role, grant_capability, revoke_capability',
      'any.required': 'Operation is required'
    }),

  target_admin_ids: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one admin ID is required',
      'array.max': 'Cannot process more than 50 admins at once',
      'any.required': 'Target admin IDs are required'
    }),

  role_id: Joi.string()
    .when('operation', {
      is: Joi.valid('assign_role', 'revoke_role'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

  capability_id: Joi.string()
    .when('operation', {
      is: Joi.valid('grant_capability', 'revoke_capability'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

  expires_at: Joi.date()
    .greater('now')
    .optional()
    .allow(null)
    .messages({
      'date.greater': 'Expiration date must be in the future'
    }),

  justification: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Justification must be at least 10 characters',
      'string.max': 'Justification cannot exceed 1000 characters',
      'any.required': 'Justification is required for bulk operations'
    })
});