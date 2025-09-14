"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckConfigSchema = exports.maintenanceOperationSchema = exports.backupRequestSchema = exports.notificationSchema = exports.systemConfigSchema = void 0;
/**
 * File: system.schema.ts
 *
 * Description: Validation schemas for admin system configuration and monitoring operations
 * Function: Provide input validation for system config, notifications, and maintenance
 * Importance: Security and data integrity for system administration operations
 * Connects to: System routes, middleware validation
 *
 * Notes: Validation schemas for system-wide configuration and monitoring
 */
const joi_1 = __importDefault(require("joi"));
// System configuration update schema
exports.systemConfigSchema = joi_1.default.object({
    config_value: joi_1.default.alternatives()
        .try(joi_1.default.string(), joi_1.default.number(), joi_1.default.boolean(), joi_1.default.object(), joi_1.default.array())
        .required()
        .messages({
        'any.required': 'Configuration value is required'
    }),
    description: joi_1.default.string()
        .max(500)
        .optional()
        .messages({
        'string.max': 'Description cannot exceed 500 characters'
    })
});
// System notification schema
exports.notificationSchema = joi_1.default.object({
    notification_type: joi_1.default.string()
        .valid('system', 'security', 'maintenance', 'user')
        .required()
        .messages({
        'any.only': 'Notification type must be one of: system, security, maintenance, user',
        'any.required': 'Notification type is required'
    }),
    title: joi_1.default.string()
        .min(1)
        .max(200)
        .required()
        .messages({
        'string.min': 'Title is required',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Title is required'
    }),
    message: joi_1.default.string()
        .max(1000)
        .optional()
        .allow(null, '')
        .messages({
        'string.max': 'Message cannot exceed 1000 characters'
    }),
    severity: joi_1.default.string()
        .valid('info', 'warning', 'error', 'critical')
        .default('info')
        .messages({
        'any.only': 'Severity must be one of: info, warning, error, critical'
    }),
    target_audience: joi_1.default.string()
        .valid('all_users', 'admins', 'role:manager', 'role:contractor', 'role:center', 'role:customer', 'role:crew', 'role:warehouse')
        .pattern(/^(all_users|admins|role:\w+|org:\w+)$/)
        .default('all_users')
        .messages({
        'any.only': 'Target audience must be a valid audience type',
        'string.pattern.base': 'Target audience format is invalid'
    }),
    start_date: joi_1.default.date()
        .default(() => new Date())
        .messages({
        'date.base': 'Start date must be a valid date'
    }),
    end_date: joi_1.default.date()
        .greater(joi_1.default.ref('start_date'))
        .optional()
        .allow(null)
        .messages({
        'date.greater': 'End date must be after start date'
    }),
    is_active: joi_1.default.boolean()
        .default(true)
});
// System backup request schema
exports.backupRequestSchema = joi_1.default.object({
    backup_type: joi_1.default.string()
        .valid('manual', 'scheduled', 'emergency')
        .default('manual')
        .messages({
        'any.only': 'Backup type must be one of: manual, scheduled, emergency'
    }),
    description: joi_1.default.string()
        .max(500)
        .optional()
        .messages({
        'string.max': 'Description cannot exceed 500 characters'
    }),
    include_logs: joi_1.default.boolean()
        .default(true),
    include_user_data: joi_1.default.boolean()
        .default(true),
    compression_level: joi_1.default.number()
        .integer()
        .min(0)
        .max(9)
        .default(6)
        .messages({
        'number.integer': 'Compression level must be an integer',
        'number.min': 'Compression level must be at least 0',
        'number.max': 'Compression level cannot exceed 9'
    })
});
// System maintenance operation schema
exports.maintenanceOperationSchema = joi_1.default.object({
    maintenance_type: joi_1.default.string()
        .valid('backup', 'cleanup', 'migration', 'update', 'restart')
        .required()
        .messages({
        'any.only': 'Maintenance type must be one of: backup, cleanup, migration, update, restart',
        'any.required': 'Maintenance type is required'
    }),
    description: joi_1.default.string()
        .min(10)
        .max(500)
        .required()
        .messages({
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 500 characters',
        'any.required': 'Description is required'
    }),
    scheduled_at: joi_1.default.date()
        .greater('now')
        .optional()
        .messages({
        'date.greater': 'Scheduled time must be in the future'
    }),
    estimated_duration_minutes: joi_1.default.number()
        .integer()
        .min(1)
        .max(1440) // Max 24 hours
        .optional()
        .messages({
        'number.integer': 'Duration must be an integer',
        'number.min': 'Duration must be at least 1 minute',
        'number.max': 'Duration cannot exceed 1440 minutes (24 hours)'
    }),
    requires_downtime: joi_1.default.boolean()
        .default(false),
    affected_services: joi_1.default.array()
        .items(joi_1.default.string())
        .optional()
});
// Health check configuration schema
exports.healthCheckConfigSchema = joi_1.default.object({
    service_name: joi_1.default.string()
        .min(1)
        .max(100)
        .required()
        .messages({
        'string.min': 'Service name is required',
        'string.max': 'Service name cannot exceed 100 characters',
        'any.required': 'Service name is required'
    }),
    check_interval_seconds: joi_1.default.number()
        .integer()
        .min(10)
        .max(3600)
        .default(60)
        .messages({
        'number.integer': 'Check interval must be an integer',
        'number.min': 'Check interval must be at least 10 seconds',
        'number.max': 'Check interval cannot exceed 3600 seconds (1 hour)'
    }),
    timeout_seconds: joi_1.default.number()
        .integer()
        .min(1)
        .max(300)
        .default(30)
        .messages({
        'number.integer': 'Timeout must be an integer',
        'number.min': 'Timeout must be at least 1 second',
        'number.max': 'Timeout cannot exceed 300 seconds'
    }),
    healthy_threshold: joi_1.default.number()
        .integer()
        .min(1)
        .max(10)
        .default(2)
        .messages({
        'number.integer': 'Healthy threshold must be an integer',
        'number.min': 'Healthy threshold must be at least 1',
        'number.max': 'Healthy threshold cannot exceed 10'
    }),
    unhealthy_threshold: joi_1.default.number()
        .integer()
        .min(1)
        .max(10)
        .default(3)
        .messages({
        'number.integer': 'Unhealthy threshold must be an integer',
        'number.min': 'Unhealthy threshold must be at least 1',
        'number.max': 'Unhealthy threshold cannot exceed 10'
    }),
    endpoint_url: joi_1.default.string()
        .uri()
        .optional()
        .messages({
        'string.uri': 'Endpoint URL must be a valid URI'
    }),
    expected_status_codes: joi_1.default.array()
        .items(joi_1.default.number().integer().min(100).max(599))
        .default([200])
        .messages({
        'number.integer': 'Status codes must be integers',
        'number.min': 'Status codes must be at least 100',
        'number.max': 'Status codes cannot exceed 599'
    })
});
//# sourceMappingURL=system.schema.js.map