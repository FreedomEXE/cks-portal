/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: audit.schema.ts
 * 
 * Description: Validation schemas for admin audit and security operations
 * Function: Provide input validation for audit queries, exports, and security events
 * Importance: Security and data integrity for audit and compliance operations
 * Connects to: Audit routes, middleware validation
 * 
 * Notes: Validation schemas for comprehensive audit trail and security management
 */

import Joi from 'joi';

// Audit query schema for filtering and searching
export const auditQuerySchema = Joi.object({
  export_type: Joi.string()
    .valid('full', 'filtered', 'summary')
    .default('filtered')
    .messages({
      'any.only': 'Export type must be one of: full, filtered, summary'
    }),

  table_name: Joi.string()
    .valid('system_audit_log', 'admin_activity_log', 'security_events', 'user_activity_log', 'login_attempts')
    .required()
    .messages({
      'any.only': 'Table name must be one of: system_audit_log, admin_activity_log, security_events, user_activity_log, login_attempts',
      'any.required': 'Table name is required'
    }),

  filters: Joi.object({
    event_type: Joi.string().optional(),
    event_category: Joi.string().optional(),
    actor_type: Joi.string().optional(),
    actor_id: Joi.string().optional(),
    target_type: Joi.string().optional(),
    target_id: Joi.string().optional(),
    action: Joi.string().optional(),
    result: Joi.string().valid('success', 'failure', 'error').optional(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    user_role: Joi.string().optional(),
    organization_id: Joi.string().optional()
  }).optional(),

  format: Joi.string()
    .valid('json', 'csv', 'xlsx')
    .default('json')
    .messages({
      'any.only': 'Format must be one of: json, csv, xlsx'
    }),

  start_date: Joi.date()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date'
    }),

  end_date: Joi.date()
    .greater(Joi.ref('start_date'))
    .optional()
    .messages({
      'date.greater': 'End date must be after start date'
    }),

  max_records: Joi.number()
    .integer()
    .min(1)
    .max(100000)
    .default(10000)
    .messages({
      'number.integer': 'Max records must be an integer',
      'number.min': 'Max records must be at least 1',
      'number.max': 'Max records cannot exceed 100,000'
    })
});

// Security event resolution schema
export const securityEventResolutionSchema = Joi.object({
  resolution_notes: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Resolution notes must be at least 10 characters',
      'string.max': 'Resolution notes cannot exceed 1000 characters',
      'any.required': 'Resolution notes are required'
    }),

  follow_up_required: Joi.boolean()
    .default(false),

  follow_up_date: Joi.date()
    .greater('now')
    .when('follow_up_required', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'date.greater': 'Follow-up date must be in the future',
      'any.required': 'Follow-up date is required when follow-up is needed'
    }),

  severity_adjustment: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .optional()
    .messages({
      'any.only': 'Severity adjustment must be one of: low, medium, high, critical'
    }),

  preventive_measures: Joi.array()
    .items(Joi.string().max(200))
    .max(10)
    .optional()
    .messages({
      'string.max': 'Each preventive measure cannot exceed 200 characters',
      'array.max': 'Cannot specify more than 10 preventive measures'
    })
});

// Audit log search schema
export const auditLogSearchSchema = Joi.object({
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
    .max(1000)
    .default(50)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 1000'
    }),

  event_type: Joi.string()
    .valid('user_action', 'system_event', 'security_event', 'data_change')
    .optional()
    .messages({
      'any.only': 'Event type must be one of: user_action, system_event, security_event, data_change'
    }),

  event_category: Joi.string()
    .valid('authentication', 'authorization', 'crud', 'configuration', 'maintenance')
    .optional()
    .messages({
      'any.only': 'Event category must be one of: authentication, authorization, crud, configuration, maintenance'
    }),

  actor_type: Joi.string()
    .valid('admin', 'user', 'system')
    .optional()
    .messages({
      'any.only': 'Actor type must be one of: admin, user, system'
    }),

  actor_id: Joi.string()
    .optional(),

  target_type: Joi.string()
    .optional(),

  target_id: Joi.string()
    .optional(),

  action: Joi.string()
    .optional(),

  result: Joi.string()
    .valid('success', 'failure', 'error')
    .optional()
    .messages({
      'any.only': 'Result must be one of: success, failure, error'
    }),

  start_date: Joi.date()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date'
    }),

  end_date: Joi.date()
    .greater(Joi.ref('start_date'))
    .optional()
    .messages({
      'date.greater': 'End date must be after start date'
    }),

  search: Joi.string()
    .min(1)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Search term must be at least 1 character',
      'string.max': 'Search term cannot exceed 200 characters'
    })
});

// Security event creation schema (for manual security events)
export const securityEventCreationSchema = Joi.object({
  event_type: Joi.string()
    .valid('failed_login', 'account_locked', 'privilege_escalation', 'suspicious_activity', 'data_breach', 'unauthorized_access')
    .required()
    .messages({
      'any.only': 'Event type must be a valid security event type',
      'any.required': 'Event type is required'
    }),

  severity: Joi.string()
    .valid('low', 'medium', 'high', 'critical')
    .default('medium')
    .messages({
      'any.only': 'Severity must be one of: low, medium, high, critical'
    }),

  user_id: Joi.string()
    .optional()
    .allow(null),

  description: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 1000 characters',
      'any.required': 'Description is required'
    }),

  details: Joi.object()
    .optional(),

  ip_address: Joi.string()
    .ip()
    .optional()
    .messages({
      'string.ip': 'IP address must be valid'
    }),

  user_agent: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'User agent cannot exceed 500 characters'
    }),

  geo_location: Joi.object({
    country: Joi.string().max(50).optional(),
    region: Joi.string().max(50).optional(),
    city: Joi.string().max(50).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional()
  }).optional(),

  threat_indicators: Joi.object({
    threat_level: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    attack_vector: Joi.string().max(100).optional(),
    indicators: Joi.array().items(Joi.string().max(200)).max(20).optional()
  }).optional()
});

// Compliance audit request schema
export const complianceAuditSchema = Joi.object({
  regulation_type: Joi.string()
    .valid('GDPR', 'CCPA', 'SOX', 'HIPAA', 'PCI_DSS', 'ISO27001')
    .required()
    .messages({
      'any.only': 'Regulation type must be one of: GDPR, CCPA, SOX, HIPAA, PCI_DSS, ISO27001',
      'any.required': 'Regulation type is required'
    }),

  audit_scope: Joi.string()
    .valid('full_system', 'user_data', 'access_controls', 'data_processing', 'security_measures')
    .default('full_system')
    .messages({
      'any.only': 'Audit scope must be a valid scope type'
    }),

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

  include_user_data: Joi.boolean()
    .default(true),

  include_admin_actions: Joi.boolean()
    .default(true),

  include_system_logs: Joi.boolean()
    .default(true),

  anonymize_personal_data: Joi.boolean()
    .default(true),

  requested_format: Joi.string()
    .valid('json', 'csv', 'pdf', 'xml')
    .default('json')
    .messages({
      'any.only': 'Format must be one of: json, csv, pdf, xml'
    })
});