/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

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

import Joi from 'joi';

// System configuration update schema
export const systemConfigSchema = Joi.object({
  config_value: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.object(),
      Joi.array()
    )
    .required()
    .messages({
      'any.required': 'Configuration value is required'
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    })
});

// System notification schema
export const notificationSchema = Joi.object({
  notification_type: Joi.string()
    .valid('system', 'security', 'maintenance', 'user')
    .required()
    .messages({
      'any.only': 'Notification type must be one of: system, security, maintenance, user',
      'any.required': 'Notification type is required'
    }),

  title: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title is required',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),

  message: Joi.string()
    .max(1000)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Message cannot exceed 1000 characters'
    }),

  severity: Joi.string()
    .valid('info', 'warning', 'error', 'critical')
    .default('info')
    .messages({
      'any.only': 'Severity must be one of: info, warning, error, critical'
    }),

  target_audience: Joi.string()
    .valid('all_users', 'admins', 'role:manager', 'role:contractor', 'role:center', 'role:customer', 'role:crew', 'role:warehouse')
    .pattern(/^(all_users|admins|role:\w+|org:\w+)$/)
    .default('all_users')
    .messages({
      'any.only': 'Target audience must be a valid audience type',
      'string.pattern.base': 'Target audience format is invalid'
    }),

  start_date: Joi.date()
    .default(() => new Date())
    .messages({
      'date.base': 'Start date must be a valid date'
    }),

  end_date: Joi.date()
    .greater(Joi.ref('start_date'))
    .optional()
    .allow(null)
    .messages({
      'date.greater': 'End date must be after start date'
    }),

  is_active: Joi.boolean()
    .default(true)
});

// System backup request schema
export const backupRequestSchema = Joi.object({
  backup_type: Joi.string()
    .valid('manual', 'scheduled', 'emergency')
    .default('manual')
    .messages({
      'any.only': 'Backup type must be one of: manual, scheduled, emergency'
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  include_logs: Joi.boolean()
    .default(true),

  include_user_data: Joi.boolean()
    .default(true),

  compression_level: Joi.number()
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
export const maintenanceOperationSchema = Joi.object({
  maintenance_type: Joi.string()
    .valid('backup', 'cleanup', 'migration', 'update', 'restart')
    .required()
    .messages({
      'any.only': 'Maintenance type must be one of: backup, cleanup, migration, update, restart',
      'any.required': 'Maintenance type is required'
    }),

  description: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 500 characters',
      'any.required': 'Description is required'
    }),

  scheduled_at: Joi.date()
    .greater('now')
    .optional()
    .messages({
      'date.greater': 'Scheduled time must be in the future'
    }),

  estimated_duration_minutes: Joi.number()
    .integer()
    .min(1)
    .max(1440) // Max 24 hours
    .optional()
    .messages({
      'number.integer': 'Duration must be an integer',
      'number.min': 'Duration must be at least 1 minute',
      'number.max': 'Duration cannot exceed 1440 minutes (24 hours)'
    }),

  requires_downtime: Joi.boolean()
    .default(false),

  affected_services: Joi.array()
    .items(Joi.string())
    .optional()
});

// Health check configuration schema
export const healthCheckConfigSchema = Joi.object({
  service_name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Service name is required',
      'string.max': 'Service name cannot exceed 100 characters',
      'any.required': 'Service name is required'
    }),

  check_interval_seconds: Joi.number()
    .integer()
    .min(10)
    .max(3600)
    .default(60)
    .messages({
      'number.integer': 'Check interval must be an integer',
      'number.min': 'Check interval must be at least 10 seconds',
      'number.max': 'Check interval cannot exceed 3600 seconds (1 hour)'
    }),

  timeout_seconds: Joi.number()
    .integer()
    .min(1)
    .max(300)
    .default(30)
    .messages({
      'number.integer': 'Timeout must be an integer',
      'number.min': 'Timeout must be at least 1 second',
      'number.max': 'Timeout cannot exceed 300 seconds'
    }),

  healthy_threshold: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(2)
    .messages({
      'number.integer': 'Healthy threshold must be an integer',
      'number.min': 'Healthy threshold must be at least 1',
      'number.max': 'Healthy threshold cannot exceed 10'
    }),

  unhealthy_threshold: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(3)
    .messages({
      'number.integer': 'Unhealthy threshold must be an integer',
      'number.min': 'Unhealthy threshold must be at least 1',
      'number.max': 'Unhealthy threshold cannot exceed 10'
    }),

  endpoint_url: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Endpoint URL must be a valid URI'
    }),

  expected_status_codes: Joi.array()
    .items(Joi.number().integer().min(100).max(599))
    .default([200])
    .messages({
      'number.integer': 'Status codes must be integers',
      'number.min': 'Status codes must be at least 100',
      'number.max': 'Status codes cannot exceed 599'
    })
});