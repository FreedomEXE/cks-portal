/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: validators.ts
 *
 * Description: Catalog domain validation schemas
 * Function: Request validation for catalog endpoints
 * Importance: Type-safe validation with error handling
 * Connects to: Catalog routes, validation middleware
 */

import { z } from 'zod';

// Simple schema transforms and common schemas for Fastify build
const Transforms = {
  normalizeString: z.string().trim().transform(s => s || undefined)
};

const CommonSchemas = {
  metadata: z.record(z.any()).default({})
};

/**
 * Catalog-specific schemas
 */
export const CatalogSchemas = {
  /**
   * Catalog item query parameters
   */
  itemQuery: z.object({
    q: Transforms.normalizeString.optional(),
    category: Transforms.normalizeString.optional(),
    type: z.enum(['service', 'product']).optional(),
    active: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),

  /**
   * Search query parameters
   */
  searchQuery: z.object({
    q: z.string().min(1, 'Search term is required'),
    type: z.enum(['service', 'product']).optional(),
    category: Transforms.normalizeString.optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),

  /**
   * Category by type query
   */
  categoryQuery: z.object({
    type: z.enum(['service', 'product']).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),

  /**
   * Service ID parameter
   */
  serviceIdParam: z.object({
    serviceId: z.coerce.number().int().positive('Service ID must be a positive integer'),
  }),

  /**
   * Add contractor service request
   */
  addContractorService: z.object({
    service_id: z.coerce.number().int().positive('Service ID must be a positive integer'),
  }),

  /**
   * Update contractor service request
   */
  updateContractorService: z.object({
    contractor_price: z.coerce.number().min(0, 'Price must be non-negative').optional(),
    is_available: z.boolean().optional(),
    lead_time_hours: z.coerce.number().int().min(0, 'Lead time must be non-negative').optional(),
    notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  ),

  /**
   * Catalog category schema
   */
  catalogCategory: z.object({
    category_id: z.number().int(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    parent_id: z.number().int().optional(),
    icon: z.string().max(50).optional(),
    sort_order: z.number().int().min(0).default(0),
    is_active: z.boolean().default(true),
    created_at: z.date(),
    updated_at: z.date(),
  }),

  /**
   * Service schema
   */
  service: z.object({
    service_id: z.number().int(),
    service_name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    category_id: z.number().int().optional(),
    unit: z.string().max(50).optional(),
    price: z.number().min(0).optional(),
    requires_quote: z.boolean().default(false),
    is_emergency: z.boolean().default(false),
    min_notice_hours: z.number().int().min(0).default(24),
    status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
    tags: z.array(z.string()).default([]),
    metadata: CommonSchemas.metadata,
    created_at: z.date(),
    updated_at: z.date(),
    created_by: z.string().optional(),
    archived: z.boolean().default(false),
  }),

  /**
   * Product schema
   */
  product: z.object({
    product_id: z.number().int(),
    product_name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    category_id: z.number().int().optional(),
    sku: z.string().max(50).optional(),
    unit: z.string().max(50).optional(),
    price: z.number().min(0).optional(),
    weight_lbs: z.number().min(0).optional(),
    dimensions: z.record(z.any()).optional(),
    hazmat: z.boolean().default(false),
    track_inventory: z.boolean().default(false),
    min_stock_level: z.number().int().min(0).optional(),
    status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
    tags: z.array(z.string()).default([]),
    metadata: CommonSchemas.metadata,
    created_at: z.date(),
    updated_at: z.date(),
    created_by: z.string().optional(),
    archived: z.boolean().default(false),
  }),

  /**
   * Catalog item unified schema
   */
  catalogItem: z.object({
    id: z.string(),
    type: z.enum(['service', 'product']),
    name: z.string().min(1).max(200),
    description: z.string().max(1000),
    category: z.string().optional(),
    unit: z.string().max(50).optional(),
    price_cents: z.number().int().min(0).optional(),
    active: z.boolean(),
    created_at: z.date(),
    updated_at: z.date(),
  }),

  /**
   * Org service (contractor service) schema
   */
  orgService: z.object({
    contractor_id: z.string().min(1),
    service_id: z.number().int(),
    contractor_price: z.number().min(0).optional(),
    is_available: z.boolean().default(true),
    lead_time_hours: z.number().int().min(0).default(24),
    notes: z.string().max(500).optional(),
    created_at: z.date(),
    updated_at: z.date(),
  }),
};

/**
 * Custom catalog validators
 */
export const CatalogValidators = {
  /**
   * Validate service type for contractor operations
   */
  contractorServiceType: z.string().refine(
    (type) => type === 'service',
    'Contractors can only manage services, not products'
  ),

  /**
   * Validate price format (in cents)
   */
  priceCents: z.number().int().min(0).refine(
    (cents) => cents % 1 === 0,
    'Price must be in whole cents'
  ),

  /**
   * Validate category hierarchy (no circular references)
   */
  categoryHierarchy: (categories: any[]) =>
    z.number().int().optional().refine(
      (parentId) => {
        if (!parentId) return true;
        // Basic check - more complex validation would check full tree
        return !categories.some(cat => cat.category_id === parentId && cat.parent_id === parentId);
      },
      'Category cannot be its own parent'
    ),

  /**
   * Validate SKU uniqueness format
   */
  skuFormat: z.string().regex(
    /^[A-Z0-9-]{3,20}$/,
    'SKU must be 3-20 characters, alphanumeric and dashes only'
  ).optional(),

  /**
   * Validate contractor context for operations
   */
  contractorContext: z.string().min(1, 'Contractor context is required for this operation'),

  /**
   * Validate search term length and content
   */
  searchTerm: z.string()
    .min(2, 'Search term must be at least 2 characters')
    .max(100, 'Search term must be 100 characters or less')
    .refine(
      (term) => !/^\s+$/.test(term),
      'Search term cannot be only whitespace'
    ),
};

/**
 * Validation middleware configurations for catalog endpoints
 */
export const CatalogValidation = {
  itemQuery: { query: CatalogSchemas.itemQuery },
  searchQuery: { query: CatalogSchemas.searchQuery },
  categoryQuery: { query: CatalogSchemas.categoryQuery },
  serviceIdParam: { params: CatalogSchemas.serviceIdParam },
  addContractorService: { body: CatalogSchemas.addContractorService },
  updateContractorService: {
    params: CatalogSchemas.serviceIdParam,
    body: CatalogSchemas.updateContractorService
  },
};