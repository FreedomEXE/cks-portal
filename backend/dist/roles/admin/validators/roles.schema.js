"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkRoleOperationSchema = exports.permissionAuditSchema = exports.roleHierarchySchema = exports.capabilityCreationSchema = exports.directCapabilityGrantSchema = exports.adminRoleAssignmentSchema = exports.capabilityAssignmentSchema = exports.roleUpdateSchema = exports.roleCreationSchema = void 0;
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
const joi_1 = __importDefault(require("joi"));
// Admin role creation schema
exports.roleCreationSchema = joi_1.default.object({
    role_name: joi_1.default.string()
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
    description: joi_1.default.string()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
        'string.max': 'Description cannot exceed 500 characters'
    }),
    is_default: joi_1.default.boolean()
        .default(false),
    can_manage_admins: joi_1.default.boolean()
        .default(false),
    can_manage_system: joi_1.default.boolean()
        .default(false),
    capabilities: joi_1.default.array()
        .items(joi_1.default.string().required())
        .unique()
        .max(100)
        .optional()
        .messages({
        'array.unique': 'Capability IDs must be unique',
        'array.max': 'Cannot assign more than 100 capabilities to a role'
    })
});
// Admin role update schema
exports.roleUpdateSchema = joi_1.default.object({
    role_name: joi_1.default.string()
        .min(3)
        .max(50)
        .pattern(/^[a-zA-Z0-9_\s-]+$/)
        .optional()
        .messages({
        'string.min': 'Role name must be at least 3 characters long',
        'string.max': 'Role name cannot exceed 50 characters',
        'string.pattern.base': 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'
    }),
    description: joi_1.default.string()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
        'string.max': 'Description cannot exceed 500 characters'
    }),
    is_default: joi_1.default.boolean()
        .optional(),
    can_manage_admins: joi_1.default.boolean()
        .optional(),
    can_manage_system: joi_1.default.boolean()
        .optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});
// Capability assignment schema
exports.capabilityAssignmentSchema = joi_1.default.object({
    capability_ids: joi_1.default.array()
        .items(joi_1.default.string().required())
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
exports.adminRoleAssignmentSchema = joi_1.default.object({
    admin_role_id: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Admin role ID is required'
    }),
    expires_at: joi_1.default.date()
        .greater('now')
        .optional()
        .allow(null)
        .messages({
        'date.greater': 'Expiration date must be in the future'
    }),
    notes: joi_1.default.string()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
        'string.max': 'Notes cannot exceed 500 characters'
    })
});
// Direct capability grant schema
exports.directCapabilityGrantSchema = joi_1.default.object({
    capability_id: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Capability ID is required'
    }),
    expires_at: joi_1.default.date()
        .greater('now')
        .optional()
        .allow(null)
        .messages({
        'date.greater': 'Expiration date must be in the future'
    }),
    notes: joi_1.default.string()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
        'string.max': 'Notes cannot exceed 500 characters'
    }),
    temporary_grant: joi_1.default.boolean()
        .default(false),
    justification: joi_1.default.string()
        .min(10)
        .max(1000)
        .when('temporary_grant', {
        is: true,
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .messages({
        'string.min': 'Justification must be at least 10 characters',
        'string.max': 'Justification cannot exceed 1000 characters',
        'any.required': 'Justification is required for temporary grants'
    })
});
// Capability creation schema (for creating new capabilities)
exports.capabilityCreationSchema = joi_1.default.object({
    capability_id: joi_1.default.string()
        .pattern(/^[a-z_]+:[a-z_]+$/)
        .required()
        .messages({
        'string.pattern.base': 'Capability ID must follow format: category:action (e.g., users:create)',
        'any.required': 'Capability ID is required'
    }),
    capability_name: joi_1.default.string()
        .min(3)
        .max(100)
        .required()
        .messages({
        'string.min': 'Capability name must be at least 3 characters long',
        'string.max': 'Capability name cannot exceed 100 characters',
        'any.required': 'Capability name is required'
    }),
    description: joi_1.default.string()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
        'string.max': 'Description cannot exceed 500 characters'
    }),
    category: joi_1.default.string()
        .valid('users', 'organizations', 'roles', 'system', 'audit', 'reports', 'security', 'admin')
        .required()
        .messages({
        'any.only': 'Category must be one of: users, organizations, roles, system, audit, reports, security, admin',
        'any.required': 'Category is required'
    }),
    is_system_critical: joi_1.default.boolean()
        .default(false)
});
// Role hierarchy schema (for complex role relationships)
exports.roleHierarchySchema = joi_1.default.object({
    parent_role_id: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Parent role ID is required'
    }),
    child_role_id: joi_1.default.string()
        .required()
        .messages({
        'any.required': 'Child role ID is required'
    }),
    inheritance_type: joi_1.default.string()
        .valid('full', 'partial', 'additive')
        .default('additive')
        .messages({
        'any.only': 'Inheritance type must be one of: full, partial, additive'
    }),
    excluded_capabilities: joi_1.default.array()
        .items(joi_1.default.string())
        .unique()
        .optional()
        .when('inheritance_type', {
        is: 'partial',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .messages({
        'array.unique': 'Excluded capabilities must be unique',
        'any.required': 'Excluded capabilities are required for partial inheritance'
    })
});
// Permission audit schema
exports.permissionAuditSchema = joi_1.default.object({
    audit_type: joi_1.default.string()
        .valid('role_permissions', 'user_permissions', 'capability_usage', 'permission_changes')
        .required()
        .messages({
        'any.only': 'Audit type must be one of: role_permissions, user_permissions, capability_usage, permission_changes',
        'any.required': 'Audit type is required'
    }),
    target_id: joi_1.default.string()
        .optional(),
    start_date: joi_1.default.date()
        .required()
        .messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required'
    }),
    end_date: joi_1.default.date()
        .greater(joi_1.default.ref('start_date'))
        .required()
        .messages({
        'date.greater': 'End date must be after start date',
        'any.required': 'End date is required'
    }),
    include_inactive: joi_1.default.boolean()
        .default(false),
    format: joi_1.default.string()
        .valid('json', 'csv', 'xlsx')
        .default('json')
        .messages({
        'any.only': 'Format must be one of: json, csv, xlsx'
    })
});
// Bulk role operation schema
exports.bulkRoleOperationSchema = joi_1.default.object({
    operation: joi_1.default.string()
        .valid('assign_role', 'revoke_role', 'grant_capability', 'revoke_capability')
        .required()
        .messages({
        'any.only': 'Operation must be one of: assign_role, revoke_role, grant_capability, revoke_capability',
        'any.required': 'Operation is required'
    }),
    target_admin_ids: joi_1.default.array()
        .items(joi_1.default.string().required())
        .min(1)
        .max(50)
        .required()
        .messages({
        'array.min': 'At least one admin ID is required',
        'array.max': 'Cannot process more than 50 admins at once',
        'any.required': 'Target admin IDs are required'
    }),
    role_id: joi_1.default.string()
        .when('operation', {
        is: joi_1.default.valid('assign_role', 'revoke_role'),
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    capability_id: joi_1.default.string()
        .when('operation', {
        is: joi_1.default.valid('grant_capability', 'revoke_capability'),
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    expires_at: joi_1.default.date()
        .greater('now')
        .optional()
        .allow(null)
        .messages({
        'date.greater': 'Expiration date must be in the future'
    }),
    justification: joi_1.default.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
        'string.min': 'Justification must be at least 10 characters',
        'string.max': 'Justification cannot exceed 1000 characters',
        'any.required': 'Justification is required for bulk operations'
    })
});
//# sourceMappingURL=roles.schema.js.map