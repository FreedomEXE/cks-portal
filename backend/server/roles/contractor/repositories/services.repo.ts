/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: services.repo.ts
 * 
 * Description: DB access for contractor service catalog entities
 * Function: Handle contractor service offerings data operations
 * Importance: Core data layer for contractor service portfolio management
 * Connects to: services.service.ts.
 * 
 * Notes: Contractor service catalog data management
 */

import { query } from '../../../db/connection';

// Get services offered by contractor
export async function getServices(contractorId: string): Promise<any[]> {
  const sql = `
    SELECT 
      s.service_id,
      s.name,
      s.category,
      s.description,
      s.pricing,
      s.availability,
      s.requirements,
      s.tags,
      s.active,
      s.created_date,
      s.updated_date,
      -- Service statistics
      COALESCE(
        (SELECT COUNT(*) FROM orders o 
         JOIN order_services os ON os.order_id = o.order_id
         WHERE os.service_id = s.service_id 
         AND o.status = 'completed'),
        0
      ) as completed_orders,
      COALESCE(
        (SELECT AVG(r.rating) FROM ratings r
         JOIN orders o ON o.order_id = r.order_id
         JOIN order_services os ON os.order_id = o.order_id
         WHERE os.service_id = s.service_id 
         AND r.contractor_id = $1),
        0
      ) as avg_rating
    FROM contractor_services s
    WHERE s.contractor_id = $1
    ORDER BY s.name
  `;

  return await query(sql, [contractorId]);
}

// Get specific service by ID
export async function getServiceById(contractorId: string, serviceId: string): Promise<any> {
  const sql = `
    SELECT 
      s.*,
      -- Service performance metrics
      COALESCE(
        (SELECT COUNT(*) FROM orders o 
         JOIN order_services os ON os.order_id = o.order_id
         WHERE os.service_id = s.service_id),
        0
      ) as total_orders,
      COALESCE(
        (SELECT COUNT(*) FROM orders o 
         JOIN order_services os ON os.order_id = o.order_id
         WHERE os.service_id = s.service_id 
         AND o.status = 'completed'),
        0
      ) as completed_orders,
      COALESCE(
        (SELECT AVG(r.rating) FROM ratings r
         JOIN orders o ON o.order_id = r.order_id
         JOIN order_services os ON os.order_id = o.order_id
         WHERE os.service_id = s.service_id 
         AND r.contractor_id = $1),
        0
      ) as avg_rating,
      COALESCE(
        (SELECT SUM(o.total_amount) FROM orders o 
         JOIN order_services os ON os.order_id = o.order_id
         WHERE os.service_id = s.service_id 
         AND o.status = 'completed'),
        0
      ) as total_revenue
    FROM contractor_services s
    WHERE s.contractor_id = $1 AND s.service_id = $2
  `;

  const result = await query(sql, [contractorId, serviceId]);
  return result[0] || null;
}

// Create new service
export async function createService(contractorId: string, serviceData: any): Promise<any> {
  const sql = `
    INSERT INTO contractor_services (
      contractor_id,
      name,
      category,
      description,
      pricing,
      availability,
      requirements,
      tags,
      active,
      created_date,
      updated_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *
  `;

  const result = await query(sql, [
    contractorId,
    serviceData.name,
    serviceData.category,
    serviceData.description,
    JSON.stringify(serviceData.pricing || {}),
    JSON.stringify(serviceData.availability || {}),
    JSON.stringify(serviceData.requirements || []),
    JSON.stringify(serviceData.tags || []),
    serviceData.active !== false // Default to true unless explicitly false
  ]);

  return result[0] || null;
}

// Update existing service
export async function updateService(contractorId: string, serviceId: string, updateData: any): Promise<any> {
  const allowedFields = [
    'name', 'category', 'description', 'pricing', 
    'availability', 'requirements', 'tags', 'active'
  ];
  
  const setClause = [];
  const params = [];
  let paramIndex = 1;

  // Build SET clause dynamically
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key)) {
      // Handle JSON fields
      if (['pricing', 'availability', 'requirements', 'tags'].includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        params.push(JSON.stringify(value));
      } else {
        setClause.push(`${key} = $${paramIndex}`);
        params.push(value);
      }
      paramIndex++;
    }
  }

  if (setClause.length === 0) {
    throw new Error('No valid fields to update');
  }

  // Add updated_date
  setClause.push(`updated_date = NOW()`);

  const sql = `
    UPDATE contractor_services 
    SET ${setClause.join(', ')}
    WHERE contractor_id = $${paramIndex} AND service_id = $${paramIndex + 1}
    RETURNING *
  `;

  params.push(contractorId, serviceId);
  const result = await query(sql, params);
  return result[0] || null;
}

// Delete service
export async function deleteService(contractorId: string, serviceId: string): Promise<void> {
  const sql = `
    DELETE FROM contractor_services 
    WHERE contractor_id = $1 AND service_id = $2
  `;

  await query(sql, [contractorId, serviceId]);
}

// Get service categories
export async function getServiceCategories(): Promise<string[]> {
  const sql = `
    SELECT DISTINCT category 
    FROM contractor_services 
    WHERE category IS NOT NULL 
    AND active = true
    ORDER BY category
  `;

  const result = await query(sql, []);
  return result.map(row => row.category);
}

// Get popular services (for recommendations)
export async function getPopularServices(contractorId: string, limit = 10): Promise<any[]> {
  const sql = `
    SELECT 
      cs.name,
      cs.category,
      COUNT(os.service_id) as order_count,
      AVG(r.rating) as avg_rating
    FROM contractor_services cs
    LEFT JOIN order_services os ON os.service_id = cs.service_id
    LEFT JOIN orders o ON o.order_id = os.order_id
    LEFT JOIN ratings r ON r.order_id = o.order_id
    WHERE cs.active = true
    AND cs.contractor_id != $1  -- Exclude current contractor's services
    GROUP BY cs.service_id, cs.name, cs.category
    HAVING COUNT(os.service_id) > 0
    ORDER BY COUNT(os.service_id) DESC, AVG(r.rating) DESC NULLS LAST
    LIMIT $2
  `;

  return await query(sql, [contractorId, limit]);
}