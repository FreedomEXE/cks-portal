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
          service_id::TEXT AS id,
          'service' AS type,
          service_name AS name,
          COALESCE(description, '') AS description,
          COALESCE(cc.name, '') AS category,
          unit,
          ROUND((COALESCE(price, 0) * 100))::int AS price_cents,
          (status = 'active') AS active,
          s.created_at,
          s.updated_at
        FROM services s
        LEFT JOIN catalog_categories cc ON s.category_id = cc.category_id
        WHERE s.archived = false
      )
      UNION ALL
      (
        SELECT
          product_id::TEXT AS id,
          'product' AS type,
          product_name AS name,
          COALESCE(description, '') AS description,
          COALESCE(cc.name, '') AS category,
          unit,
          ROUND((COALESCE(price, 0) * 100))::int AS price_cents,
          (status = 'active') AS active,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN catalog_categories cc ON p.category_id = cc.category_id
        WHERE p.archived = false
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
      SELECT DISTINCT cc.name AS category
      FROM catalog_categories cc
      WHERE cc.is_active = true
        AND cc.name IS NOT NULL
        AND cc.name <> ''
      ORDER BY cc.name
    `;

    const result = await this.db.query(query);
    return result.rows.map(row => row.category);
  }

  async getCategoriesTree(): Promise<CatalogCategory[]> {
    const query = `
      SELECT
        category_id,
        name,
        description,
        parent_id,
        icon,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM catalog_categories
      WHERE is_active = true
      ORDER BY parent_id NULLS FIRST, sort_order, name
    `;

    const result = await this.db.query(query);
    return result.rows;
  }

  // Contractor-specific: Get services they offer
  async getContractorServices(contractorId: string): Promise<OrgService[]> {
    const query = `
      SELECT
        os.contractor_id,
        os.service_id,
        os.contractor_price,
        os.is_available,
        os.lead_time_hours,
        os.notes,
        os.created_at,
        os.updated_at,
        s.service_name,
        s.description AS service_description,
        s.unit,
        s.price AS catalog_price
      FROM org_services os
      JOIN services s ON os.service_id = s.service_id
      WHERE os.contractor_id = $1
        AND s.archived = false
      ORDER BY s.service_name
    `;

    const result = await this.db.query(query, [contractorId]);
    return result.rows;
  }

  // Contractor-specific: Add service to "My Services"
  async addContractorService(contractorId: string, serviceId: number): Promise<void> {
    const query = `
      INSERT INTO org_services (contractor_id, service_id, is_available, lead_time_hours)
      VALUES ($1, $2, true, 24)
      ON CONFLICT (contractor_id, service_id)
      DO UPDATE SET
        is_available = true,
        updated_at = NOW()
    `;

    await this.db.query(query, [contractorId, serviceId]);
  }

  // Contractor-specific: Update service pricing/availability
  async updateContractorService(
    contractorId: string,
    serviceId: number,
    updates: Partial<Pick<OrgService, 'contractor_price' | 'is_available' | 'lead_time_hours' | 'notes'>>
  ): Promise<void> {
    const setParts: string[] = [];
    const values: any[] = [contractorId, serviceId];

    if (updates.contractor_price !== undefined) {
      values.push(updates.contractor_price);
      setParts.push(`contractor_price = $${values.length}`);
    }
    if (updates.is_available !== undefined) {
      values.push(updates.is_available);
      setParts.push(`is_available = $${values.length}`);
    }
    if (updates.lead_time_hours !== undefined) {
      values.push(updates.lead_time_hours);
      setParts.push(`lead_time_hours = $${values.length}`);
    }
    if (updates.notes !== undefined) {
      values.push(updates.notes);
      setParts.push(`notes = $${values.length}`);
    }

    if (setParts.length === 0) return;

    setParts.push('updated_at = NOW()');

    const query = `
      UPDATE org_services
      SET ${setParts.join(', ')}
      WHERE contractor_id = $1 AND service_id = $2
    `;

    await this.db.query(query, values);
  }

  // Contractor-specific: Remove service from "My Services"
  async removeContractorService(contractorId: string, serviceId: number): Promise<void> {
    const query = `
      DELETE FROM org_services
      WHERE contractor_id = $1 AND service_id = $2
    `;

    await this.db.query(query, [contractorId, serviceId]);
  }
}