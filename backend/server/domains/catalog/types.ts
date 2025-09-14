/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: types.ts
 *
 * Description: Catalog domain types and interfaces
 * Function: Type definitions for catalog entities and API responses
 * Importance: Type safety for catalog operations
 * Connects to: Database schema, API endpoints
 */

export interface CatalogCategory {
  category_id: number;
  name: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Service {
  service_id: number;
  service_name: string;
  description?: string;
  category_id?: number;
  unit?: string;
  price?: number;
  requires_quote: boolean;
  is_emergency: boolean;
  min_notice_hours: number;
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  archived: boolean;
}

export interface Product {
  product_id: number;
  product_name: string;
  description?: string;
  category_id?: number;
  sku?: string;
  unit?: string;
  price?: number;
  weight_lbs?: number;
  dimensions?: Record<string, any>;
  hazmat: boolean;
  track_inventory: boolean;
  min_stock_level?: number;
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
  archived: boolean;
}

export interface OrgService {
  contractor_id: string;
  service_id: number;
  contractor_price?: number;
  is_available: boolean;
  lead_time_hours: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CatalogItem {
  id: string;
  type: 'service' | 'product';
  name: string;
  description: string;
  category?: string;
  unit?: string;
  price_cents?: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CatalogListQuery {
  q?: string;
  category?: string;
  type?: 'service' | 'product';
  active?: boolean;
  limit?: number;
  offset?: number;
}

export interface CatalogRouteConfig {
  features: {
    browse: boolean;
    search: boolean;
    categories: boolean;
    myServices?: boolean; // contractor-specific
  };
  capabilities: {
    view: string;
    admin?: string;
  };
}