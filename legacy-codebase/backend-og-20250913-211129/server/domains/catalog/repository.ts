/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: repository.ts
 *
 * Description: Catalog domain data access layer
 * Function: Database operations for catalog entities
 * Importance: Centralized data access with proper error handling
 * Connects to: Database connection pool, catalog tables
 */

import { Pool } from 'pg';
import { CatalogItem, CatalogListQuery, CatalogCategory, OrgService } from './types';

export class CatalogRepository {
  constructor(private db: Pool) {}

  async getCatalogItems(query: CatalogListQuery): Promise<CatalogItem[]> {
    const clauses: string[] = [];
    const values: any[] = [];

    // Build WHERE filters for both services and products
    if (query.q) {
      values.push(`%${query.q}%`);
      clauses.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }

    if (query.category) {
      values.push(query.category);
      clauses.push(`category = $${values.length}`);
    }

    if (query.active === true || query.active === false) {
      values.push(query.active ? 'active' : 'inactive');
      clauses.push(`status = $${values.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    // Union query to get both services and products in unified format
    const baseQuery = `
      (
        SELECT
          service_id AS id,
          'service' AS type,
          COALESCE(service_name, '') AS name,
          COALESCE(description, '') AS description,
          COALESCE(category, '') AS category,
          '' AS unit,
          NULL::numeric AS price,
          COALESCE(status, 'active') AS status,
          created_at,
          updated_at
        FROM services
      )
      UNION ALL
      (
        SELECT
          product_id AS id,
          'product' AS type,
          product_name AS name,
          COALESCE(description, '') AS description,
          COALESCE(category, '') AS category,
          COALESCE(unit, '') AS unit,
          price,
          COALESCE(status, 'active') AS status,
          created_at,
          updated_at
        FROM products
      )
    `;

    // Apply filters to unified result
    const fullQuery = `
      SELECT * FROM (${baseQuery}) AS catalog
      ${where}
      ORDER BY type, name
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const limit = Math.min(query.limit || 50, 200);
    const offset = Math.max(query.offset || 0, 0);

    const result = await this.db.query(fullQuery, [...values, limit, offset]);

    // Apply type filter if specified (post-processing for performance)
    let items = result.rows;
    if (query.type === 'service' || query.type === 'product') {
      items = items.filter(item => item.type === query.type);
    }

    return items;
  }

  async getCategories(): Promise<string[]> {
    const query = `
      SELECT DISTINCT category
      FROM (
        SELECT category FROM services WHERE category IS NOT NULL
        UNION
        SELECT category FROM products WHERE category IS NOT NULL
      ) AS categories
      WHERE category <> ''
      ORDER BY category
    `;

    const result = await this.db.query(query);
    return result.rows.map(row => row.category);
  }

}