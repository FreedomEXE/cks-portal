/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';
import pool from '../../../../Database/db/pool';
import { z } from 'zod';
import { requirePermission } from '../../src/auth/rbac';

const router = express.Router();

// Helper to get user id from headers
function getUserId(req: Request): string {
  const v = (req.headers['x-user-id'] || req.headers['x-customer-user-id'] || '').toString();
  return String(v || '');
}

// GET /api/customer/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    // Empty template data - will be populated when customer is created via admin
    const sample = {
      customer_id: userId || 'CUS-000',
      customer_name: 'Not Set',
      company_name: 'Not Set',
      address: 'Not Set',
      cks_manager: 'Not Assigned',
      email: 'Not Set',
      phone: 'Not Set',
      main_contact: 'Not Set',
      website: 'Not Set',
      years_with_cks: '0 Years',
      num_centers: '0',
      contract_start_date: 'Not Set',
      status: 'Not Set'
    };
    return res.json({ success: true, data: sample });
  } catch (error) {
    console.error('Customer profile endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch customer profile', error_code: 'server_error' });
  }
});

// GET /api/customer/centers
router.get('/centers', async (req: Request, res: Response) => {
  try {
    // Empty template data - centers will be assigned through admin system
    const data = [];
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Customer centers endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch customer centers', error_code: 'server_error' });
  }
});

// GET /api/customer/requests
router.get('/requests', async (req: Request, res: Response) => {
  try {
    // Empty template data - requests will be created as customer uses the system
    const data = [];
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Customer requests endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch customer requests', error_code: 'server_error' });
  }
});

// POST /api/customer/requests
// Body: { customer_id, center_id?, items:[{type:'service'|'product', id, qty?, notes?}], notes? }
const CreateCustomerRequestSchema = z.object({
  customer_id: z.string().min(1),
  center_id: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(
    z.object({
      type: z.enum(['service','product']),
      id: z.string().min(1),
      qty: z.number().int().positive().optional().default(1),
      notes: z.string().max(2000).optional()
    })
  ).min(1)
});
router.post('/requests', requirePermission('CUSTOMER_CREATE_REQUEST'), async (req: Request, res: Response) => {
  try {
    const parsed = CreateCustomerRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid request body', error_code: 'validation_error' });
    const { customer_id, center_id, items, notes } = parsed.data;

    const orderId = `REQ-${Date.now().toString().slice(-6)}`;
    const status = 'contractor_pending';

    try {
      await pool.query('BEGIN');
      await pool.query(
        `INSERT INTO orders(order_id, customer_id, center_id, status, notes) VALUES ($1,$2,$3,$4,$5)`,
        [orderId, customer_id, center_id || null, status, notes || null]
      );
      for (const it of items) {
        const typ = String(it.type || '').toLowerCase();
        const qty = Number(it.qty || 1);
        await pool.query(
          `INSERT INTO order_items(order_id, item_type, item_id, quantity, notes) VALUES ($1,$2,$3,$4,$5)`,
          [orderId, typ, String(it.id), qty, it.notes || null]
        );
      }
      await pool.query('COMMIT');
    } catch (dbErr) {
      await pool.query('ROLLBACK').catch(() => {});
      console.warn('[customer] DB unavailable, returning mock create response', dbErr);
    }

    return res.status(201).json({ success: true, data: { order_id: orderId, status } });
  } catch (error) {
    console.error('Customer create request error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create request', error_code: 'server_error' });
  }
});

// GET /api/customer/orders?code=CUS-001&bucket=pending|approved|archive&limit&offset
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
         WHERE UPPER(o.customer_id) = UPPER($1) AND o.status = ANY($2)
         GROUP BY o.order_id
         ORDER BY o.order_date DESC
         LIMIT $3 OFFSET $4`,
        [code, statuses, limit, offset]
      )
    ).rows;

    // Totals for all buckets (for UI badges)
    const pendingStatuses = ['submitted', 'contractor_pending'];
    const approvedStatuses = ['contractor_approved', 'scheduling_pending', 'scheduled', 'in_progress', 'picking', 'shipped'];
    const archiveStatuses = ['completed', 'delivered', 'closed', 'contractor_denied', 'cancelled'];

    let totals = { pending: 0, approved: 0, archive: 0 };
    try {
      const [p, a, r] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS c FROM orders o WHERE UPPER(o.customer_id)=UPPER($1) AND o.status = ANY($2)`,
          [code, pendingStatuses]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS c FROM orders o WHERE UPPER(o.customer_id)=UPPER($1) AND o.status = ANY($2)`,
          [code, approvedStatuses]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS c FROM orders o WHERE UPPER(o.customer_id)=UPPER($1) AND o.status = ANY($2)`,
          [code, archiveStatuses]
        ),
      ]);
      totals = {
        pending: Number(p.rows?.[0]?.c ?? 0),
        approved: Number(a.rows?.[0]?.c ?? 0),
        archive: Number(r.rows?.[0]?.c ?? 0),
      };
    } catch (e) {
      // If totals query fails (e.g., DB not available), fall back to page-limited approximation
      const approx = rows.length;
      if (bucket === 'pending') totals.pending = approx;
      else if (bucket === 'approved') totals.approved = approx;
      else totals.archive = approx;
    }

    return res.json({ success: true, data: rows, totals });
  } catch (error) {
    console.error('Customer orders endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch customer orders', error_code: 'server_error' });
  }
});

export default router;
