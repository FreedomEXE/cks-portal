/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: service.ts
 *
 * Description: Catalog domain business logic layer
 * Function: Business operations and validation for catalog features
 * Importance: Centralized business logic with proper validation
 * Connects to: Repository layer, validation rules
 */

import { CatalogRepository } from './repository';
import { CatalogItem, CatalogListQuery } from './types';

export class CatalogService {
  constructor(private repository: CatalogRepository) {}

  async getCatalogItems(query: CatalogListQuery): Promise<CatalogItem[]> {
    // Validate and sanitize query parameters
    const sanitizedQuery: CatalogListQuery = {
      ...query,
      limit: Math.min(Math.max(query.limit || 50, 1), 200),
      offset: Math.max(query.offset || 0, 0),
      q: query.q?.trim() || undefined,
      category: query.category?.trim() || undefined,
    };

    return await this.repository.getCatalogItems(sanitizedQuery);
  }

  async getCategories(): Promise<string[]> {
    return await this.repository.getCategories();
  }


  // Search and filtering helpers
  async searchCatalog(searchTerm: string, options?: {
    type?: 'service' | 'product';
    category?: string;
    limit?: number;
  }): Promise<CatalogItem[]> {
    return await this.getCatalogItems({
      q: searchTerm,
      type: options?.type,
      category: options?.category,
      limit: options?.limit || 50,
      active: true, // Only show active items in search
    });
  }

  async getCatalogByCategory(category: string, options?: {
    type?: 'service' | 'product';
    limit?: number;
  }): Promise<CatalogItem[]> {
    return await this.getCatalogItems({
      category,
      type: options?.type,
      limit: options?.limit || 50,
      active: true, // Only show active items by default
    });
  }

  async getCatalogByType(type: 'service' | 'product', options?: {
    category?: string;
    limit?: number;
  }): Promise<CatalogItem[]> {
    return await this.getCatalogItems({
      type,
      category: options?.category,
      limit: options?.limit || 50,
      active: true, // Only show active items by default
    });
  }
}