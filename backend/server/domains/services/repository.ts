import pool from '../../db/connection';
import { ServiceEntity, ServicesQuery } from './types';

export async function listServices(query: ServicesQuery): Promise<ServiceEntity[]> {
  const where: string[] = ['archived = false'];
  const vals: any[] = [];

  if (query.q) {
    vals.push(`%${query.q}%`);
    where.push(`(service_name ILIKE $${vals.length} OR description ILIKE $${vals.length})`);
  }
  if (query.status) {
    vals.push(query.status);
    where.push(`status = $${vals.length}`);
  }

  const sql = `
    SELECT service_id, service_name, description, category_id, unit, price, status, archived, created_at, updated_at
    FROM services
    WHERE ${where.join(' AND ')}
    ORDER BY service_name
    LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}
  `;

  const limit = Math.min(query.limit || 50, 200);
  const offset = Math.max(query.offset || 0, 0);
  const res = await pool.query(sql, [...vals, limit, offset]);
  return res.rows;
}

export async function getService(serviceId: number): Promise<ServiceEntity | null> {
  const res = await pool.query(
    `SELECT service_id, service_name, description, category_id, unit, price, status, archived, created_at, updated_at
     FROM services WHERE service_id = $1`,
    [serviceId]
  );
  return res.rows?.[0] || null;
}

export async function updateService(
  serviceId: number,
  updates: Partial<Pick<ServiceEntity, 'service_name' | 'description' | 'price' | 'status' | 'unit' | 'category_id'>>
): Promise<ServiceEntity | null> {
  const sets: string[] = [];
  const vals: any[] = [];

  const map: Array<[keyof ServiceEntity, string]> = [
    ['service_name', 'service_name'],
    ['description', 'description'],
    ['price', 'price'],
    ['status', 'status'],
    ['unit', 'unit'],
    ['category_id', 'category_id']
  ];

  for (const [k, col] of map) {
    if (updates[k] !== undefined) {
      vals.push((updates as any)[k]);
      sets.push(`${col} = $${vals.length}`);
    }
  }

  if (!sets.length) return await getService(serviceId);

  vals.push(serviceId);
  const sql = `UPDATE services SET ${sets.join(', ')}, updated_at = NOW() WHERE service_id = $${vals.length} RETURNING service_id, service_name, description, category_id, unit, price, status, archived, created_at, updated_at`;
  const res = await pool.query(sql, vals);
  return res.rows?.[0] || null;
}

