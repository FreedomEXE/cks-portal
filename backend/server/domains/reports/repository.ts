import pool from '../../db/connection';
import { OrderStatusCount, RevenuePoint, Timeframe } from './types';

export async function getOrderStatusCounts(): Promise<OrderStatusCount[]> {
  const sql = `
    SELECT status::text AS status, COUNT(*)::int AS count
    FROM orders
    GROUP BY status
    ORDER BY status
  `;
  const res = await pool.query(sql);
  return res.rows as OrderStatusCount[];
}

export async function getRevenueTrend(timeframe: Timeframe = 'month', periods: number = 6): Promise<RevenuePoint[]> {
  // Map timeframe -> PostgreSQL date_trunc unit and interval step
  const unit = timeframe === 'week' ? 'week'
    : timeframe === 'quarter' ? 'quarter'
    : timeframe === 'year' ? 'year'
    : 'month';

  const intervalExpr = timeframe === 'week' ? `interval '1 week'`
    : timeframe === 'quarter' ? `interval '3 month'`
    : timeframe === 'year' ? `interval '1 year'`
    : `interval '1 month'`;

  const sql = `
    WITH series AS (
      SELECT generate_series(0, $1::int - 1) AS n
    )
    SELECT to_char(date_trunc('${unit}', (now() - n * ${intervalExpr}))::date, 'YYYY-MM') AS period,
           COALESCE((
             SELECT SUM(total_amount)
             FROM orders o
             WHERE date_trunc('${unit}', o.created_at) = date_trunc('${unit}', (now() - n * ${intervalExpr}))
           ), 0) AS revenue
    FROM series
    ORDER BY period ASC
  `;
  const res = await pool.query(sql, [periods]);
  return res.rows.map(r => ({ period: r.period, revenue: Number(r.revenue || 0) }));
}

