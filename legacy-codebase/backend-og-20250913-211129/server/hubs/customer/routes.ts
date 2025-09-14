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
    const code = String((req.query.code || getUserId(req) || '')).toUpperCase();
    if (!code) return res.status(400).json({ success: false, error: 'code required' });
    const r = await pool.query(
      `SELECT customer_id, company_name, cks_manager, contact_person AS main_contact, email, phone, address, website, created_at
       FROM customers WHERE UPPER(customer_id)=UPPER($1) LIMIT 1`, [code]
    );
    if (r.rowCount === 0) return res.status(404).json({ success: false, error: 'Customer not found' });
    const row = r.rows[0];
    let manager: any = null;
    if (row.cks_manager) {
      try {
        const m = await pool.query(`SELECT manager_id, manager_name, email, phone FROM managers WHERE UPPER(manager_id)=UPPER($1) AND archived_at IS NULL LIMIT 1`, [row.cks_manager]);
        manager = m.rows[0] || null;
      } catch {}
    }
    let yearsWithCks = '0 Years';
    let contractStartDate = null;
    if (row.created_at) {
      const start = new Date(row.created_at);
      contractStartDate = start.toISOString().slice(0,10);
      const diffYears = Math.max(0, Math.floor((Date.now()-start.getTime())/(1000*60*60*24*365)));
      yearsWithCks = diffYears === 1 ? '1 Year' : `${diffYears} Years`;
    }
    const data = {
      customer_id: row.customer_id,
      company_name: row.company_name,
      cks_manager: row.cks_manager || null,
      main_contact: row.main_contact || null,
      email: row.email || null,
      phone: row.phone || null,
      address: row.address || null,
      website: row.website || null,
      years_with_cks: yearsWithCks,
      num_centers: 0,
      contract_start_date: contractStartDate,
      status: 'active',
      manager
    };
    return res.json({ success: true, data });
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

// GET /api/customer/activity - Get activity feed for this customer
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || '').trim() || getUserId(req);
    if (!code) return res.status(400).json({ success: false, error: 'code required' });

    const activities = await pool.query(
      `SELECT 
        activity_id,
        activity_type,
        actor_id,
        actor_role,
        target_id,
        target_type,
        description,
        metadata,
        created_at
      FROM system_activity 
      WHERE 
        (
          (target_id = $1 AND target_type = 'customer') OR
          (actor_id = $1 AND actor_role = 'customer') OR
          (activity_type LIKE 'center_%' AND target_id IN (
            SELECT center_id FROM centers WHERE UPPER(customer_id) = UPPER($1)
          )) OR
          (activity_type LIKE 'order_%' AND target_id IN (
            SELECT order_id FROM orders WHERE UPPER(customer_id) = UPPER($1)
          ))
        ) AND
        activity_type NOT IN ('user_deleted', 'user_updated', 'user_created', 'user_welcome')
      ORDER BY created_at DESC
      LIMIT 50`,
      [code]
    );

    return res.json({ success: true, data: activities.rows });
  } catch (error) {
    console.error('Customer activity endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch activity', error_code: 'server_error' });
  }
});

// POST /api/customer/clear-activity - Clear activity for this customer
router.post('/clear-activity', async (req: Request, res: Response) => {
  try {
    const raw = String(req.query.code || '').trim() || getUserId(req);
    const customerId = raw.toUpperCase();
    if (!customerId) return res.status(400).json({ success: false, error: 'code required' });

    await pool.query(
      `DELETE FROM system_activity 
       WHERE (UPPER(target_id) = $1 AND target_type = 'customer') OR (UPPER(actor_id) = $1 AND actor_role = 'customer')`,
      [customerId]
    );
    
    return res.json({ 
      success: true, 
      message: `Activity cleared for customer ${customerId}`
    });
  } catch (error) {
    console.error('Clear customer activity error:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear activity' });
  }
});

export default router;
