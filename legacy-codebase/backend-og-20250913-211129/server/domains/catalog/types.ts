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
  service_id: string;
  service_name?: string;
  cks_cost?: string;
  min_charge?: string;
  min_crew?: number;
  min_expense?: number;
  min_job_charge?: number;
  min_profit_dollar?: number;
  min_profit_pct?: number;
  category?: string;
  description?: string;
  pricing_model?: string;
  requirements?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Product {
  product_id: string;
  product_name: string;
  category?: string;
  description?: string;
  price?: number;
  unit?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrgService {
  contractor_id: string;
  service_id: string;
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
  description?: string;
  category?: string;
  unit?: string;
  price?: number;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
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
  role: string;
  capabilities: string[];
  features: {
    browse: boolean;
    search: boolean;
    categories: boolean;
    myServices?: boolean; // contractor-specific
    admin?: boolean; // admin-specific CRUD
  };
}