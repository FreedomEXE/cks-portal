import pool from '../../db/connection';
import { OrderEntity, OrdersQuery, OrderStatus } from './types';

export async function listOrders(query: OrdersQuery): Promise<OrderEntity[]> {
  const where: string[] = [];
  const vals: any[] = [];

  if (query.status) {
    vals.push(query.status);
    where.push(`status = $${vals.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Math.min(Math.max(query.limit || 25, 1), 200);
  const offset = Math.max(((query.page || 1) - 1) * limit, 0);

  const sql = `
    SELECT order_id, status, customer_id, contractor_id, total_amount, created_at, updated_at
    FROM orders
    ${whereSql}
    ORDER BY created_at DESC NULLS LAST, order_id DESC
    LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}
  `;

  const res = await pool.query(sql, [...vals, limit, offset]);
  return res.rows as OrderEntity[];
}

export async function getOrder(orderId: number): Promise<OrderEntity | null> {
  const res = await pool.query(
    `SELECT order_id, status, customer_id, contractor_id, total_amount, created_at, updated_at
     FROM orders WHERE order_id = $1`,
    [orderId]
  );
  return (res.rows?.[0] as OrderEntity) || null;
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<OrderEntity | null> {
  const res = await pool.query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2
     RETURNING order_id, status, customer_id, contractor_id, total_amount, created_at, updated_at`,
    [status, orderId]
  );
  return (res.rows?.[0] as OrderEntity) || null;
}

