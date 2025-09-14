"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceAuditSchema = exports.securityEventCreationSchema = exports.auditLogSearchSchema = exports.securityEventResolutionSchema = exports.auditQuerySchema = void 0;
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
const joi_1 = __importDefault(require("joi"));
// Audit query schema for filtering and searching
exports.auditQuerySchema = joi_1.default.object({
    export_type: joi_1.default.string()
        .valid('full', 'filtered', 'summary')
        .default('filtered')
        .messages({
        'any.only': 'Export type must be one of: full, filtered, summary'
    }),
    table_name: joi_1.default.string()
        .valid('system_audit_log', 'admin_activity_log', 'security_events', 'user_activity_log', 'login_attempts')
        .required()
        .messages({
        'any.only': 'Table name must be one of: system_audit_log, admin_activity_log, security_events, user_activity_log, login_attempts',
        'any.required': 'Table name is required'
    }),
    filters: joi_1.default.object({
        event_type: joi_1.default.string().optional(),
        event_category: joi_1.default.string().optional(),
        actor_type: joi_1.default.string().optional(),
        actor_id: joi_1.default.string().optional(),
        target_type: joi_1.default.string().optional(),
        target_id: joi_1.default.string().optional(),
        action: joi_1.default.string().optional(),
        result: joi_1.default.string().valid('success', 'failure', 'error').optional(),
        severity: joi_1.default.string().valid('low', 'medium', 'high', 'critical').optional(),
        user_role: joi_1.default.string().optional(),
        organization_id: joi_1.default.string().optional()
    }).optional(),
    format: joi_1.default.string()
        .valid('json', 'csv', 'xlsx')
        .default('json')
        .messages({
        'any.only': 'Format must be one of: json, csv, xlsx'
    }),
    start_date: joi_1.default.date()
        .optional()
        .messages({
        'date.base': 'Start date must be a valid date'
    }),
    end_date: joi_1.default.date()
        .greater(joi_1.default.ref('start_date'))
        .optional()
        .messages({
        'date.greater': 'End date must be after start date'
    }),
    max_records: joi_1.default.number()
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
exports.securityEventResolutionSchema = joi_1.default.object({
    resolution_notes: joi_1.default.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
        'string.min': 'Resolution notes must be at least 10 characters',
        'string.max': 'Resolution notes cannot exceed 1000 characters',
        'any.required': 'Resolution notes are required'
    }),
    follow_up_required: joi_1.default.boolean()
        .default(false),
    follow_up_date: joi_1.default.date()
        .greater('now')
        .when('follow_up_required', {
        is: true,
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    })
        .messages({
        'date.greater': 'Follow-up date must be in the future',
        'any.required': 'Follow-up date is required when follow-up is needed'
    }),
    severity_adjustment: joi_1.default.string()
        .valid('low', 'medium', 'high', 'critical')
        .optional()
        .messages({
        'any.only': 'Severity adjustment must be one of: low, medium, high, critical'
    }),
    preventive_measures: joi_1.default.array()
        .items(joi_1.default.string().max(200))
        .max(10)
        .optional()
        .messages({
        'string.max': 'Each preventive measure cannot exceed 200 characters',
        'array.max': 'Cannot specify more than 10 preventive measures'
    })
});
// Audit log search schema
exports.auditLogSearchSchema = joi_1.default.object({
    page: joi_1.default.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
    }),
    limit: joi_1.default.number()
        .integer()
        .min(1)
        .max(1000)
        .default(50)
        .messages({
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 1000'
    }),
    event_type: joi_1.default.string()
        .valid('user_action', 'system_event', 'security_event', 'data_change')
        .optional()
        .messages({
        'any.only': 'Event type must be one of: user_action, system_event, security_event, data_change'
    }),
    event_category: joi_1.default.string()
        .valid('authentication', 'authorization', 'crud', 'configuration', 'maintenance')
        .optional()
        .messages({
        'any.only': 'Event category must be one of: authentication, authorization, crud, configuration, maintenance'
    }),
    actor_type: joi_1.default.string()
        .valid('admin', 'user', 'system')
        .optional()
        .messages({
        'any.only': 'Actor type must be one of: admin, user, system'
    }),
    actor_id: joi_1.default.string()
        .optional(),
    target_type: joi_1.default.string()
        .optional(),
    target_id: joi_1.default.string()
        .optional(),
    action: joi_1.default.string()
        .optional(),
    result: joi_1.default.string()
        .valid('success', 'failure', 'error')
        .optional()
        .messages({
        'any.only': 'Result must be one of: success, failure, error'
    }),
    start_date: joi_1.default.date()
        .optional()
        .messages({
        'date.base': 'Start date must be a valid date'
    }),
    end_date: joi_1.default.date()
        .greater(joi_1.default.ref('start_date'))
        .optional()
        .messages({
        'date.greater': 'End date must be after start date'
    }),
    search: joi_1.default.string()
        .min(1)
        .max(200)
        .optional()
        .messages({
        'string.min': 'Search term must be at least 1 character',
        'string.max': 'Search term cannot exceed 200 characters'
    })
});
// Security event creation schema (for manual security events)
exports.securityEventCreationSchema = joi_1.default.object({
    event_type: joi_1.default.string()
        .valid('failed_login', 'account_locked', 'privilege_escalation', 'suspicious_activity', 'data_breach', 'unauthorized_access')
        .required()
        .messages({
        'any.only': 'Event type must be a valid security event type',
        'any.required': 'Event type is required'
    }),
    severity: joi_1.default.string()
        .valid('low', 'medium', 'high', 'critical')
        .default('medium')
        .messages({
        'any.only': 'Severity must be one of: low, medium, high, critical'
    }),
    user_id: joi_1.default.string()
        .optional()
        .allow(null),
    description: joi_1.default.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 1000 characters',
        'any.required': 'Description is required'
    }),
    details: joi_1.default.object()
        .optional(),
    ip_address: joi_1.default.string()
        .ip()
        .optional()
        .messages({
        'string.ip': 'IP address must be valid'
    }),
    user_agent: joi_1.default.string()
        .max(500)
        .optional()
        .messages({
        'string.max': 'User agent cannot exceed 500 characters'
    }),
    geo_location: joi_1.default.object({
        country: joi_1.default.string().max(50).optional(),
        region: joi_1.default.string().max(50).optional(),
        city: joi_1.default.string().max(50).optional(),
        latitude: joi_1.default.number().min(-90).max(90).optional(),
        longitude: joi_1.default.number().min(-180).max(180).optional()
    }).optional(),
    threat_indicators: joi_1.default.object({
        threat_level: joi_1.default.string().valid('low', 'medium', 'high', 'critical').optional(),
        attack_vector: joi_1.default.string().max(100).optional(),
        indicators: joi_1.default.array().items(joi_1.default.string().max(200)).max(20).optional()
    }).optional()
});
// Compliance audit request schema
exports.complianceAuditSchema = joi_1.default.object({
    regulation_type: joi_1.default.string()
        .valid('GDPR', 'CCPA', 'SOX', 'HIPAA', 'PCI_DSS', 'ISO27001')
        .required()
        .messages({
        'any.only': 'Regulation type must be one of: GDPR, CCPA, SOX, HIPAA, PCI_DSS, ISO27001',
        'any.required': 'Regulation type is required'
    }),
    audit_scope: joi_1.default.string()
        .valid('full_system', 'user_data', 'access_controls', 'data_processing', 'security_measures')
        .default('full_system')
        .messages({
        'any.only': 'Audit scope must be a valid scope type'
    }),
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
    include_user_data: joi_1.default.boolean()
        .default(true),
    include_admin_actions: joi_1.default.boolean()
        .default(true),
    include_system_logs: joi_1.default.boolean()
        .default(true),
    anonymize_personal_data: joi_1.default.boolean()
        .default(true),
    requested_format: joi_1.default.string()
        .valid('json', 'csv', 'pdf', 'xml')
        .default('json')
        .messages({
        'any.only': 'Format must be one of: json, csv, pdf, xml'
    })
});
//# sourceMappingURL=audit.schema.js.map