/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: roleConfig.ts
 * 
 * Description: Zod validation schemas and TypeScript types for role configuration system
 * Function: Validate and type role config JSON files consumed by RoleHub
 * Importance: Ensures robust dynamic loading of role UIs with type safety
 * Connects to: hub/roleConfigLoader.ts, hub/RoleHub.tsx, role config.v1.json files
 * 
 * Notes: Complete schema validation for config-driven role rendering system
 */

import { z } from 'zod';

// Theme configuration schema
const ThemeConfigSchema = z.object({
  primaryColor: z.string().default('#3B82F6'),
  headerClass: z.string().default('bg-blue-600'),
  textColor: z.string().optional(),
  backgroundColor: z.string().optional(),
});

// Tab configuration schema
const TabConfigSchema = z.object({
  id: z.string().min(1, 'Tab ID is required'),
  label: z.string().min(1, 'Tab label is required'),
  component: z.string().min(1, 'Component name is required'),
  icon: z.string().optional(),
  requires: z.array(z.string()).default([]),
  default: z.boolean().default(false),
  hidden: z.boolean().default(false),
  order: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

// Widget configuration schema (for dashboard widgets)
const WidgetConfigSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  component: z.string().min(1),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  position: z.object({
    row: z.number(),
    col: z.number(),
    width: z.number().default(1),
    height: z.number().default(1),
  }),
  requires: z.array(z.string()).default([]),
  refreshInterval: z.number().optional(),
  settings: z.record(z.any()).optional(),
});

// Features configuration schema
const FeaturesConfigSchema = z.object({
  showRecentActions: z.boolean().default(true),
  showDashboardMetrics: z.boolean().default(true),
  allowContractorAssignment: z.boolean().default(false),
  allowOrderCreation: z.boolean().default(false),
  allowReportGeneration: z.boolean().default(false),
  enableNotifications: z.boolean().default(true),
  maxItemsPerPage: z.number().min(1).max(200).default(50),
  viewHierarchy: z.array(z.string()).default([]),
});

// API configuration schema
const ApiConfigSchema = z.object({
  baseUrl: z.string().min(1),
  timeout: z.number().min(1000).max(30000).default(10000),
  retryAttempts: z.number().min(0).max(5).default(3),
  endpoints: z.record(z.string()),
  authentication: z.object({
    required: z.boolean().default(true),
    type: z.enum(['bearer', 'api-key', 'session']).default('bearer'),
  }).optional(),
});

// Permissions configuration schema
const PermissionsConfigSchema = z.object({
  required: z.array(z.string()).default([]),
  features: z.record(z.string()).default({}),
  fallbackBehavior: z.enum(['hide', 'disable', 'redirect']).default('hide'),
});

// Main role configuration schema
export const RoleConfigSchema = z.object({
  // Basic role information
  role: z.string().min(1, 'Role name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  version: z.string().regex(/^v\d+(\.\d+)*$/, 'Version must be in format v1, v1.0, etc.').default('v1'),
  
  // UI Configuration
  theme: ThemeConfigSchema,
  tabs: z.array(TabConfigSchema).min(1, 'At least one tab is required'),
  widgets: z.array(WidgetConfigSchema).optional(),
  
  // Functionality configuration
  features: FeaturesConfigSchema,
  api: ApiConfigSchema,
  permissions: PermissionsConfigSchema.optional(),
  
  // Metadata
  description: z.string().optional(),
  author: z.string().optional(),
  lastModified: z.string().datetime().optional(),
  
  // Validation rules
  validation: z.object({
    strictMode: z.boolean().default(false),
    allowUnknownTabs: z.boolean().default(false),
    allowUnknownFeatures: z.boolean().default(true),
  }).optional(),
});

// Type definitions exported from schemas
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;
export type TabConfig = z.infer<typeof TabConfigSchema>;
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type FeaturesConfig = z.infer<typeof FeaturesConfigSchema>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export type PermissionsConfig = z.infer<typeof PermissionsConfigSchema>;
export type RoleConfig = z.infer<typeof RoleConfigSchema>;

// Validation helper functions
export function validateRoleConfig(config: unknown): RoleConfig {
  try {
    return RoleConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Role config validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

export function validateTabConfig(tab: unknown): TabConfig {
  return TabConfigSchema.parse(tab);
}

export function validateApiConfig(api: unknown): ApiConfig {
  return ApiConfigSchema.parse(api);
}

// Schema for role registry (component mappings)
export const RoleRegistrySchema = z.object({
  components: z.record(z.function()),
  api: z.record(z.function()).optional(),
  hooks: z.record(z.function()).optional(),
  utils: z.record(z.function()).optional(),
});

export type RoleRegistry = z.infer<typeof RoleRegistrySchema>;

// Utility types for component props
export interface BaseTabProps {
  userId: string;
  config: RoleConfig;
  features: FeaturesConfig;
  api: ApiConfig;
}

export interface BaseWidgetProps extends BaseTabProps {
  widget: WidgetConfig;
  onRefresh?: () => void;
}

// Config loading result type
export interface RoleConfigBundle {
  config: RoleConfig;
  registry: RoleRegistry;
  isValid: boolean;
  errors?: string[];
}

// Default configs for common roles
export const DefaultManagerConfig: Partial<RoleConfig> = {
  role: 'manager',
  displayName: 'Manager Hub',
  theme: {
    primaryColor: '#3B82F6',
    headerClass: 'bg-blue-600',
  },
  features: {
    showRecentActions: true,
    showDashboardMetrics: true,
    allowContractorAssignment: true,
    allowOrderCreation: true,
    allowReportGeneration: true,
  },
  api: {
    baseUrl: '/api/manager',
    endpoints: {
      profile: '/profile',
      dashboard: '/dashboard/kpis',
      orders: '/orders',
      contractors: '/contractors',
      activity: '/activity',
    },
  },
};

export const DefaultContractorConfig: Partial<RoleConfig> = {
  role: 'contractor',
  displayName: 'Contractor Hub',
  theme: {
    primaryColor: '#059669',
    headerClass: 'bg-green-600',
  },
  features: {
    showRecentActions: true,
    showDashboardMetrics: true,
    allowContractorAssignment: false,
    allowOrderCreation: false,
    allowReportGeneration: false,
  },
  api: {
    baseUrl: '/api/contractor',
    endpoints: {
      profile: '/profile',
      dashboard: '/dashboard/kpis',
      jobs: '/jobs',
      customers: '/customers',
      activity: '/activity',
    },
  },
};

// Export schemas for external validation
export {
  ThemeConfigSchema,
  TabConfigSchema,
  WidgetConfigSchema,
  FeaturesConfigSchema,
  ApiConfigSchema,
  PermissionsConfigSchema,
};