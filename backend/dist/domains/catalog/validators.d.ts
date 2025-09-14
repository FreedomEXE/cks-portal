/**
 * File: validators.ts
 *
 * Description: Catalog domain validation schemas
 * Function: Request validation for catalog endpoints
 * Importance: Type-safe validation with error handling
 * Connects to: Catalog routes, validation middleware
 */
import { z } from 'zod';
/**
 * Catalog-specific schemas
 */
export declare const CatalogSchemas: {
    /**
     * Catalog item query parameters
     */
    itemQuery: z.ZodObject<{
        q: z.ZodOptional<z.ZodEffects<z.ZodString, string | undefined, string>>;
        category: z.ZodOptional<z.ZodEffects<z.ZodString, string | undefined, string>>;
        type: z.ZodOptional<z.ZodEnum<["service", "product"]>>;
        active: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
        limit: z.ZodDefault<z.ZodNumber>;
        offset: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        category?: string | undefined;
        active?: boolean | undefined;
        type?: "service" | "product" | undefined;
        q?: string | undefined;
    }, {
        limit?: number | undefined;
        category?: string | undefined;
        active?: "true" | "false" | undefined;
        type?: "service" | "product" | undefined;
        q?: string | undefined;
        offset?: number | undefined;
    }>;
    /**
     * Search query parameters
     */
    searchQuery: z.ZodObject<{
        q: z.ZodString;
        type: z.ZodOptional<z.ZodEnum<["service", "product"]>>;
        category: z.ZodOptional<z.ZodEffects<z.ZodString, string | undefined, string>>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        q: string;
        category?: string | undefined;
        type?: "service" | "product" | undefined;
    }, {
        q: string;
        limit?: number | undefined;
        category?: string | undefined;
        type?: "service" | "product" | undefined;
    }>;
    /**
     * Category by type query
     */
    categoryQuery: z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["service", "product"]>>;
        limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        type?: "service" | "product" | undefined;
    }, {
        limit?: number | undefined;
        type?: "service" | "product" | undefined;
    }>;
    /**
     * Service ID parameter
     */
    serviceIdParam: z.ZodObject<{
        serviceId: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        serviceId: number;
    }, {
        serviceId: number;
    }>;
    /**
     * Add contractor service request
     */
    addContractorService: z.ZodObject<{
        service_id: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        service_id: number;
    }, {
        service_id: number;
    }>;
    /**
     * Update contractor service request
     */
    updateContractorService: z.ZodEffects<z.ZodObject<{
        contractor_price: z.ZodOptional<z.ZodNumber>;
        is_available: z.ZodOptional<z.ZodBoolean>;
        lead_time_hours: z.ZodOptional<z.ZodNumber>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        contractor_price?: number | undefined;
        is_available?: boolean | undefined;
        lead_time_hours?: number | undefined;
        notes?: string | undefined;
    }, {
        contractor_price?: number | undefined;
        is_available?: boolean | undefined;
        lead_time_hours?: number | undefined;
        notes?: string | undefined;
    }>, {
        contractor_price?: number | undefined;
        is_available?: boolean | undefined;
        lead_time_hours?: number | undefined;
        notes?: string | undefined;
    }, {
        contractor_price?: number | undefined;
        is_available?: boolean | undefined;
        lead_time_hours?: number | undefined;
        notes?: string | undefined;
    }>;
    /**
     * Catalog category schema
     */
    catalogCategory: z.ZodObject<{
        category_id: z.ZodNumber;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        parent_id: z.ZodOptional<z.ZodNumber>;
        icon: z.ZodOptional<z.ZodString>;
        sort_order: z.ZodDefault<z.ZodNumber>;
        is_active: z.ZodDefault<z.ZodBoolean>;
        created_at: z.ZodDate;
        updated_at: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        created_at: Date;
        updated_at: Date;
        category_id: number;
        name: string;
        sort_order: number;
        is_active: boolean;
        description?: string | undefined;
        parent_id?: number | undefined;
        icon?: string | undefined;
    }, {
        created_at: Date;
        updated_at: Date;
        category_id: number;
        name: string;
        description?: string | undefined;
        parent_id?: number | undefined;
        icon?: string | undefined;
        sort_order?: number | undefined;
        is_active?: boolean | undefined;
    }>;
    /**
     * Service schema
     */
    service: z.ZodObject<{
        service_id: z.ZodNumber;
        service_name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        category_id: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        requires_quote: z.ZodDefault<z.ZodBoolean>;
        is_emergency: z.ZodDefault<z.ZodBoolean>;
        min_notice_hours: z.ZodDefault<z.ZodNumber>;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "discontinued"]>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        created_at: z.ZodDate;
        updated_at: z.ZodDate;
        created_by: z.ZodOptional<z.ZodString>;
        archived: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "inactive" | "discontinued";
        tags: string[];
        service_id: number;
        created_at: Date;
        updated_at: Date;
        archived: boolean;
        service_name: string;
        requires_quote: boolean;
        is_emergency: boolean;
        min_notice_hours: number;
        metadata: Record<string, any>;
        description?: string | undefined;
        price?: number | undefined;
        unit?: string | undefined;
        category_id?: number | undefined;
        created_by?: string | undefined;
    }, {
        service_id: number;
        created_at: Date;
        updated_at: Date;
        service_name: string;
        status?: "active" | "inactive" | "discontinued" | undefined;
        tags?: string[] | undefined;
        description?: string | undefined;
        archived?: boolean | undefined;
        price?: number | undefined;
        unit?: string | undefined;
        category_id?: number | undefined;
        created_by?: string | undefined;
        requires_quote?: boolean | undefined;
        is_emergency?: boolean | undefined;
        min_notice_hours?: number | undefined;
        metadata?: Record<string, any> | undefined;
    }>;
    /**
     * Product schema
     */
    product: z.ZodObject<{
        product_id: z.ZodNumber;
        product_name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        category_id: z.ZodOptional<z.ZodNumber>;
        sku: z.ZodOptional<z.ZodString>;
        unit: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        weight_lbs: z.ZodOptional<z.ZodNumber>;
        dimensions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        hazmat: z.ZodDefault<z.ZodBoolean>;
        track_inventory: z.ZodDefault<z.ZodBoolean>;
        min_stock_level: z.ZodOptional<z.ZodNumber>;
        status: z.ZodDefault<z.ZodEnum<["active", "inactive", "discontinued"]>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        created_at: z.ZodDate;
        updated_at: z.ZodDate;
        created_by: z.ZodOptional<z.ZodString>;
        archived: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "inactive" | "discontinued";
        tags: string[];
        created_at: Date;
        updated_at: Date;
        archived: boolean;
        metadata: Record<string, any>;
        product_id: number;
        product_name: string;
        hazmat: boolean;
        track_inventory: boolean;
        description?: string | undefined;
        price?: number | undefined;
        unit?: string | undefined;
        category_id?: number | undefined;
        created_by?: string | undefined;
        sku?: string | undefined;
        weight_lbs?: number | undefined;
        dimensions?: Record<string, any> | undefined;
        min_stock_level?: number | undefined;
    }, {
        created_at: Date;
        updated_at: Date;
        product_id: number;
        product_name: string;
        status?: "active" | "inactive" | "discontinued" | undefined;
        tags?: string[] | undefined;
        description?: string | undefined;
        archived?: boolean | undefined;
        price?: number | undefined;
        unit?: string | undefined;
        category_id?: number | undefined;
        created_by?: string | undefined;
        metadata?: Record<string, any> | undefined;
        sku?: string | undefined;
        weight_lbs?: number | undefined;
        dimensions?: Record<string, any> | undefined;
        hazmat?: boolean | undefined;
        track_inventory?: boolean | undefined;
        min_stock_level?: number | undefined;
    }>;
    /**
     * Catalog item unified schema
     */
    catalogItem: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["service", "product"]>;
        name: z.ZodString;
        description: z.ZodString;
        category: z.ZodOptional<z.ZodString>;
        unit: z.ZodOptional<z.ZodString>;
        price_cents: z.ZodOptional<z.ZodNumber>;
        active: z.ZodBoolean;
        created_at: z.ZodDate;
        updated_at: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        active: boolean;
        type: "service" | "product";
        description: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        id: string;
        category?: string | undefined;
        unit?: string | undefined;
        price_cents?: number | undefined;
    }, {
        active: boolean;
        type: "service" | "product";
        description: string;
        created_at: Date;
        updated_at: Date;
        name: string;
        id: string;
        category?: string | undefined;
        unit?: string | undefined;
        price_cents?: number | undefined;
    }>;
    /**
     * Org service (contractor service) schema
     */
    orgService: z.ZodObject<{
        contractor_id: z.ZodString;
        service_id: z.ZodNumber;
        contractor_price: z.ZodOptional<z.ZodNumber>;
        is_available: z.ZodDefault<z.ZodBoolean>;
        lead_time_hours: z.ZodDefault<z.ZodNumber>;
        notes: z.ZodOptional<z.ZodString>;
        created_at: z.ZodDate;
        updated_at: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        is_available: boolean;
        lead_time_hours: number;
        contractor_id: string;
        service_id: number;
        created_at: Date;
        updated_at: Date;
        contractor_price?: number | undefined;
        notes?: string | undefined;
    }, {
        contractor_id: string;
        service_id: number;
        created_at: Date;
        updated_at: Date;
        contractor_price?: number | undefined;
        is_available?: boolean | undefined;
        lead_time_hours?: number | undefined;
        notes?: string | undefined;
    }>;
};
/**
 * Custom catalog validators
 */
export declare const CatalogValidators: {
    /**
     * Validate service type for contractor operations
     */
    contractorServiceType: z.ZodEffects<z.ZodString, "service", string>;
    /**
     * Validate price format (in cents)
     */
    priceCents: z.ZodEffects<z.ZodNumber, number, number>;
    /**
     * Validate category hierarchy (no circular references)
     */
    categoryHierarchy: (categories: any[]) => z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, number | undefined>;
    /**
     * Validate SKU uniqueness format
     */
    skuFormat: z.ZodOptional<z.ZodString>;
    /**
     * Validate contractor context for operations
     */
    contractorContext: z.ZodString;
    /**
     * Validate search term length and content
     */
    searchTerm: z.ZodEffects<z.ZodString, string, string>;
};
/**
 * Validation middleware configurations for catalog endpoints
 */
export declare const CatalogValidation: {
    itemQuery: {
        query: z.ZodObject<{
            q: z.ZodOptional<z.ZodEffects<z.ZodString, string | undefined, string>>;
            category: z.ZodOptional<z.ZodEffects<z.ZodString, string | undefined, string>>;
            type: z.ZodOptional<z.ZodEnum<["service", "product"]>>;
            active: z.ZodOptional<z.ZodEffects<z.ZodEnum<["true", "false"]>, boolean, "true" | "false">>;
            limit: z.ZodDefault<z.ZodNumber>;
            offset: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            limit: number;
            offset: number;
            category?: string | undefined;
            active?: boolean | undefined;
            type?: "service" | "product" | undefined;
            q?: string | undefined;
        }, {
            limit?: number | undefined;
            category?: string | undefined;
            active?: "true" | "false" | undefined;
            type?: "service" | "product" | undefined;
            q?: string | undefined;
            offset?: number | undefined;
        }>;
    };
    searchQuery: {
        query: z.ZodObject<{
            q: z.ZodString;
            type: z.ZodOptional<z.ZodEnum<["service", "product"]>>;
            category: z.ZodOptional<z.ZodEffects<z.ZodString, string | undefined, string>>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            limit: number;
            q: string;
            category?: string | undefined;
            type?: "service" | "product" | undefined;
        }, {
            q: string;
            limit?: number | undefined;
            category?: string | undefined;
            type?: "service" | "product" | undefined;
        }>;
    };
    categoryQuery: {
        query: z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<["service", "product"]>>;
            limit: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            limit: number;
            type?: "service" | "product" | undefined;
        }, {
            limit?: number | undefined;
            type?: "service" | "product" | undefined;
        }>;
    };
    serviceIdParam: {
        params: z.ZodObject<{
            serviceId: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            serviceId: number;
        }, {
            serviceId: number;
        }>;
    };
    addContractorService: {
        body: z.ZodObject<{
            service_id: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            service_id: number;
        }, {
            service_id: number;
        }>;
    };
    updateContractorService: {
        params: z.ZodObject<{
            serviceId: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            serviceId: number;
        }, {
            serviceId: number;
        }>;
        body: z.ZodEffects<z.ZodObject<{
            contractor_price: z.ZodOptional<z.ZodNumber>;
            is_available: z.ZodOptional<z.ZodBoolean>;
            lead_time_hours: z.ZodOptional<z.ZodNumber>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            contractor_price?: number | undefined;
            is_available?: boolean | undefined;
            lead_time_hours?: number | undefined;
            notes?: string | undefined;
        }, {
            contractor_price?: number | undefined;
            is_available?: boolean | undefined;
            lead_time_hours?: number | undefined;
            notes?: string | undefined;
        }>, {
            contractor_price?: number | undefined;
            is_available?: boolean | undefined;
            lead_time_hours?: number | undefined;
            notes?: string | undefined;
        }, {
            contractor_price?: number | undefined;
            is_available?: boolean | undefined;
            lead_time_hours?: number | undefined;
            notes?: string | undefined;
        }>;
    };
};
//# sourceMappingURL=validators.d.ts.map