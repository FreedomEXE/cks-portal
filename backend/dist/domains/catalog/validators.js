"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogValidation = exports.CatalogValidators = exports.CatalogSchemas = void 0;
/**
 * File: validators.ts
 *
 * Description: Catalog domain validation schemas
 * Function: Request validation for catalog endpoints
 * Importance: Type-safe validation with error handling
 * Connects to: Catalog routes, validation middleware
 */
const zod_1 = require("zod");
// Simple schema transforms and common schemas for Fastify build
const Transforms = {
    normalizeString: zod_1.z.string().trim().transform(s => s || undefined)
};
const CommonSchemas = {
    metadata: zod_1.z.record(zod_1.z.any()).default({})
};
/**
 * Catalog-specific schemas
 */
exports.CatalogSchemas = {
    /**
     * Catalog item query parameters
     */
    itemQuery: zod_1.z.object({
        q: Transforms.normalizeString.optional(),
        category: Transforms.normalizeString.optional(),
        type: zod_1.z.enum(['service', 'product']).optional(),
        active: zod_1.z.enum(['true', 'false']).transform(val => val === 'true').optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(200).default(50),
        offset: zod_1.z.coerce.number().int().min(0).default(0),
    }),
    /**
     * Search query parameters
     */
    searchQuery: zod_1.z.object({
        q: zod_1.z.string().min(1, 'Search term is required'),
        type: zod_1.z.enum(['service', 'product']).optional(),
        category: Transforms.normalizeString.optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(200).default(50),
    }),
    /**
     * Category by type query
     */
    categoryQuery: zod_1.z.object({
        type: zod_1.z.enum(['service', 'product']).optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(200).default(50),
    }),
    /**
     * Service ID parameter
     */
    serviceIdParam: zod_1.z.object({
        serviceId: zod_1.z.coerce.number().int().positive('Service ID must be a positive integer'),
    }),
    /**
     * Add contractor service request
     */
    addContractorService: zod_1.z.object({
        service_id: zod_1.z.coerce.number().int().positive('Service ID must be a positive integer'),
    }),
    /**
     * Update contractor service request
     */
    updateContractorService: zod_1.z.object({
        contractor_price: zod_1.z.coerce.number().min(0, 'Price must be non-negative').optional(),
        is_available: zod_1.z.boolean().optional(),
        lead_time_hours: zod_1.z.coerce.number().int().min(0, 'Lead time must be non-negative').optional(),
        notes: zod_1.z.string().max(500, 'Notes must be 500 characters or less').optional(),
    }).refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update'),
    /**
     * Catalog category schema
     */
    catalogCategory: zod_1.z.object({
        category_id: zod_1.z.number().int(),
        name: zod_1.z.string().min(1).max(100),
        description: zod_1.z.string().max(500).optional(),
        parent_id: zod_1.z.number().int().optional(),
        icon: zod_1.z.string().max(50).optional(),
        sort_order: zod_1.z.number().int().min(0).default(0),
        is_active: zod_1.z.boolean().default(true),
        created_at: zod_1.z.date(),
        updated_at: zod_1.z.date(),
    }),
    /**
     * Service schema
     */
    service: zod_1.z.object({
        service_id: zod_1.z.number().int(),
        service_name: zod_1.z.string().min(1).max(200),
        description: zod_1.z.string().max(1000).optional(),
        category_id: zod_1.z.number().int().optional(),
        unit: zod_1.z.string().max(50).optional(),
        price: zod_1.z.number().min(0).optional(),
        requires_quote: zod_1.z.boolean().default(false),
        is_emergency: zod_1.z.boolean().default(false),
        min_notice_hours: zod_1.z.number().int().min(0).default(24),
        status: zod_1.z.enum(['active', 'inactive', 'discontinued']).default('active'),
        tags: zod_1.z.array(zod_1.z.string()).default([]),
        metadata: CommonSchemas.metadata,
        created_at: zod_1.z.date(),
        updated_at: zod_1.z.date(),
        created_by: zod_1.z.string().optional(),
        archived: zod_1.z.boolean().default(false),
    }),
    /**
     * Product schema
     */
    product: zod_1.z.object({
        product_id: zod_1.z.number().int(),
        product_name: zod_1.z.string().min(1).max(200),
        description: zod_1.z.string().max(1000).optional(),
        category_id: zod_1.z.number().int().optional(),
        sku: zod_1.z.string().max(50).optional(),
        unit: zod_1.z.string().max(50).optional(),
        price: zod_1.z.number().min(0).optional(),
        weight_lbs: zod_1.z.number().min(0).optional(),
        dimensions: zod_1.z.record(zod_1.z.any()).optional(),
        hazmat: zod_1.z.boolean().default(false),
        track_inventory: zod_1.z.boolean().default(false),
        min_stock_level: zod_1.z.number().int().min(0).optional(),
        status: zod_1.z.enum(['active', 'inactive', 'discontinued']).default('active'),
        tags: zod_1.z.array(zod_1.z.string()).default([]),
        metadata: CommonSchemas.metadata,
        created_at: zod_1.z.date(),
        updated_at: zod_1.z.date(),
        created_by: zod_1.z.string().optional(),
        archived: zod_1.z.boolean().default(false),
    }),
    /**
     * Catalog item unified schema
     */
    catalogItem: zod_1.z.object({
        id: zod_1.z.string(),
        type: zod_1.z.enum(['service', 'product']),
        name: zod_1.z.string().min(1).max(200),
        description: zod_1.z.string().max(1000),
        category: zod_1.z.string().optional(),
        unit: zod_1.z.string().max(50).optional(),
        price_cents: zod_1.z.number().int().min(0).optional(),
        active: zod_1.z.boolean(),
        created_at: zod_1.z.date(),
        updated_at: zod_1.z.date(),
    }),
    /**
     * Org service (contractor service) schema
     */
    orgService: zod_1.z.object({
        contractor_id: zod_1.z.string().min(1),
        service_id: zod_1.z.number().int(),
        contractor_price: zod_1.z.number().min(0).optional(),
        is_available: zod_1.z.boolean().default(true),
        lead_time_hours: zod_1.z.number().int().min(0).default(24),
        notes: zod_1.z.string().max(500).optional(),
        created_at: zod_1.z.date(),
        updated_at: zod_1.z.date(),
    }),
};
/**
 * Custom catalog validators
 */
exports.CatalogValidators = {
    /**
     * Validate service type for contractor operations
     */
    contractorServiceType: zod_1.z.string().refine((type) => type === 'service', 'Contractors can only manage services, not products'),
    /**
     * Validate price format (in cents)
     */
    priceCents: zod_1.z.number().int().min(0).refine((cents) => cents % 1 === 0, 'Price must be in whole cents'),
    /**
     * Validate category hierarchy (no circular references)
     */
    categoryHierarchy: (categories) => zod_1.z.number().int().optional().refine((parentId) => {
        if (!parentId)
            return true;
        // Basic check - more complex validation would check full tree
        return !categories.some(cat => cat.category_id === parentId && cat.parent_id === parentId);
    }, 'Category cannot be its own parent'),
    /**
     * Validate SKU uniqueness format
     */
    skuFormat: zod_1.z.string().regex(/^[A-Z0-9-]{3,20}$/, 'SKU must be 3-20 characters, alphanumeric and dashes only').optional(),
    /**
     * Validate contractor context for operations
     */
    contractorContext: zod_1.z.string().min(1, 'Contractor context is required for this operation'),
    /**
     * Validate search term length and content
     */
    searchTerm: zod_1.z.string()
        .min(2, 'Search term must be at least 2 characters')
        .max(100, 'Search term must be 100 characters or less')
        .refine((term) => !/^\s+$/.test(term), 'Search term cannot be only whitespace'),
};
/**
 * Validation middleware configurations for catalog endpoints
 */
exports.CatalogValidation = {
    itemQuery: { query: exports.CatalogSchemas.itemQuery },
    searchQuery: { query: exports.CatalogSchemas.searchQuery },
    categoryQuery: { query: exports.CatalogSchemas.categoryQuery },
    serviceIdParam: { params: exports.CatalogSchemas.serviceIdParam },
    addContractorService: { body: exports.CatalogSchemas.addContractorService },
    updateContractorService: {
        params: exports.CatalogSchemas.serviceIdParam,
        body: exports.CatalogSchemas.updateContractorService
    },
};
//# sourceMappingURL=validators.js.map