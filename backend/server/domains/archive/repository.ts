import pool from '../../db/connection';
import { ArchivedOrder } from './types';

export async function listArchivedOrders(limit: number = 25, page: number = 1): Promise<ArchivedOrder[]> {
  const lim = Math.min(Math.max(limit, 1), 200);
  const off = Math.max((page - 1) * lim, 0);
  const res = await pool.query(
    `SELECT order_id, status, customer_id, contractor_id, total_amount, created_at, updated_at
     FROM orders WHERE status = 'archived'
     ORDER BY updated_at DESC NULLS LAST, order_id DESC
     LIMIT $1 OFFSET $2`,
    [lim, off]
  );
  return res.rows as ArchivedOrder[];
}

export async function restoreOrder(orderId: number): Promise<boolean> {
  const res = await pool.query(
    `UPDATE orders SET status = 'pending', updated_at = NOW() WHERE order_id = $1 AND status = 'archived'`,
    [orderId]
  );
  return (res.rowCount || 0) > 0;
}

