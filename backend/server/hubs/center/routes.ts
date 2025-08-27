/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';
import pool from '../../../../Database/db/pool';

const router = express.Router();

function getUserId(req: Request): string {
  const v = (req.headers['x-user-id'] || req.headers['x-center-user-id'] || '').toString();
  return String(v || '');
}

// GET /api/center/requests (recent)
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '10'), 10), 50);
    // Demo data until DB wiring is fully in place
    const data = [
      { id: 'REQ-1001', center: 'CEN-001', type: 'service', label: 'Daily Cleaning', status: 'contractor_pending', date: '2025-08-25' },
      { id: 'REQ-1002', center: 'CEN-001', type: 'product', label: 'Floor Cleaner (5L)', status: 'submitted', date: '2025-08-24' }
    ].slice(0, limit);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[center] get requests error', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch center requests', error_code: 'server_error' });
  }
});

// POST /api/center/requests
// Body: { center_id, customer_id?, items:[{type:'service'|'product', id, qty?, notes?}], notes? }
router.post('/requests', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  try {
    const { center_id, customer_id, items, notes } = req.body || {};
    if (!center_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'center_id and items are required', error_code: 'invalid_request' });
    }

    // Generate order id (simple for MVP)
    const orderId = `REQ-${Date.now().toString().slice(-6)}`;
    const status = 'contractor_pending';

    // Try DB insert, fallback to mock if unavailable
    try {
      await pool.query('BEGIN');
      await pool.query(
        `INSERT INTO orders(order_id, customer_id, center_id, status, notes) VALUES ($1,$2,$3,$4,$5)`,
        [orderId, customer_id || null, center_id, status, notes || null]
      );
      for (const it of items) {
        const typ = String(it.type || '').toLowerCase();
        if (typ !== 'service' && typ !== 'product') continue;
        const qty = Number(it.qty || 1);
        await pool.query(
          `INSERT INTO order_items(order_id, item_type, item_id, quantity, notes) VALUES ($1,$2,$3,$4,$5)`,
          [orderId, typ, String(it.id), qty, it.notes || null]
        );
      }
      await pool.query('COMMIT');
    } catch (dbErr) {
      await pool.query('ROLLBACK').catch(() => {});
      console.warn('[center] DB unavailable, returning mock create response', dbErr);
    }

    return res.status(201).json({ success: true, data: { order_id: orderId, status } });
  } catch (error) {
    console.error('[center] create request error', error);
    return res.status(500).json({ success: false, error: 'Failed to create request', error_code: 'server_error' });
  }
});

// GET /api/center/orders?code=CEN-001&bucket=pending|approved|archive
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || '').toUpperCase();
    const bucket = String(req.query.bucket || 'pending').toLowerCase();
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    if (!code) return res.status(400).json({ success: false, error: 'code is required', error_code: 'invalid_request' });

    let statuses: string[] = [];
    if (bucket === 'pending') statuses = ['submitted', 'contractor_pending'];
    else if (bucket === 'approved') statuses = ['contractor_approved', 'scheduling_pending', 'scheduled', 'in_progress', 'picking', 'shipped'];
    else statuses = ['completed', 'delivered', 'closed', 'contractor_denied', 'cancelled'];

    const rows = (
      await pool.query(
        `SELECT o.order_id, o.customer_id, o.center_id, o.status, o.order_date,
                COUNT(oi.order_item_id) AS item_count,
                SUM(CASE WHEN oi.item_type='service' THEN 1 ELSE 0 END) AS service_count,
                SUM(CASE WHEN oi.item_type='product' THEN 1 ELSE 0 END) AS product_count
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.order_id
         WHERE UPPER(o.center_id) = UPPER($1) AND o.status = ANY($2)
         GROUP BY o.order_id
         ORDER BY o.order_date DESC
         LIMIT $3 OFFSET $4`,
        [code, statuses, limit, offset]
      )
    ).rows;

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[center] orders endpoint error', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch center orders', error_code: 'server_error' });
  }
});

export default router;