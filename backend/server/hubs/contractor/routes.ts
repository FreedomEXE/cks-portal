/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';
import pool from '../../../../Database/db/pool';
import { z } from 'zod';
import { requirePermission } from '../../src/auth/rbac';

const router = express.Router();

function getUserId(req: Request): string {
  const v = (req.headers['x-user-id'] || req.headers['x-contractor-user-id'] || '').toString();
  return String(v || '');
}

// GET /api/contractor/profile?code=CON-001
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || '').trim() || getUserId(req);
    if (!code) return res.status(400).json({ success: false, error: 'code required', error_code: 'invalid_request' });

    const q = `
      SELECT 
        contractor_id,
        company_name,
        cks_manager,
        contact_person AS main_contact,
        email,
        phone,
        address,
        website,
        status,
        created_at
      FROM contractors
      WHERE UPPER(contractor_id) = UPPER($1)
      LIMIT 1
    `;
    const r = await pool.query(q, [code]);
    if (r.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Contractor not found', error_code: 'not_found' });
    }

    const row = r.rows[0];

    // Compute derived fields
    const start = row.created_at ? new Date(row.created_at) : null;
    const now = new Date();
    let years = 1;
    if (start) {
      const diff = now.getTime() - start.getTime();
      const y = Math.floor(diff / (365 * 24 * 60 * 60 * 1000));
      years = Math.max(1, y + 1);
    }
    const yearsLabel = years === 1 ? '1 Year' : `${years} Years`;

    // Count customers for this contractor
    let numCustomers = 0;
    try {
      const c = await pool.query(`SELECT COUNT(*)::int AS c FROM customers WHERE UPPER(contractor_id)=UPPER($1)`, [row.contractor_id]);
      numCustomers = Number(c.rows?.[0]?.c ?? 0);
    } catch {}

    const data = {
      contractor_id: row.contractor_id,
      company_name: row.company_name,
      cks_manager: row.cks_manager || null,
      main_contact: row.main_contact || null,
      email: row.email || null,
      phone: row.phone || null,
      address: row.address || null,
      website: row.website || null,
      years_with_cks: yearsLabel,
      num_customers: numCustomers,
      contract_start_date: start ? start.toISOString().slice(0, 10) : null,
      status: row.status || 'active',
      services_specialized: 'Not Set',
      payment_status: 'Not Set'
    };

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Contractor profile endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor profile', error_code: 'server_error' });
  }
});

// GET /api/contractor/dashboard
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    // Empty template data - will be populated through admin assignment system
    const data = [
      { label: 'Active Customers', value: 0, trend: 'No activity', color: '#3b7af7' },
      { label: 'Active Centers', value: 0, trend: 'No activity', color: '#8b5cf6' },
      { label: 'Account Status', value: 'Not Set', color: '#6b7280' },
      { label: 'Services Used', value: 0, color: '#f59e0b' },
      { label: 'Active Crew', value: 0, trend: 'No activity', color: '#ef4444' },
      { label: 'Pending Orders', value: 0, color: '#f97316' }
    ];
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Contractor dashboard endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor dashboard', error_code: 'server_error' });
  }
});

// GET /api/contractor/customers
router.get('/customers', async (req: Request, res: Response) => {
  try {
    // Empty template data - customers will be assigned through admin system
    const data = [];
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Contractor customers endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor customers', error_code: 'server_error' });
  }
});

// GET /api/contractor/centers?code=CON-001
router.get('/centers', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || getUserId(req) || '').toUpperCase();
    if (!code) return res.status(400).json({ success: false, error: 'code required', error_code: 'invalid_request' });
    const rows = (await pool.query(
      `SELECT center_id AS id, center_name AS name FROM centers WHERE UPPER(contractor_id)=UPPER($1) ORDER BY center_name`,
      [code]
    )).rows;
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Contractor centers endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor centers', error_code: 'server_error' });
  }
});

// GET /api/contractor/requests (pending)
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const bucket = String(req.query.bucket || 'pending').toLowerCase();
    let statuses: string[] = [];
    if (bucket === 'pending') statuses = ['submitted', 'contractor_pending'];
    else if (bucket === 'approved') statuses = ['contractor_approved', 'scheduling_pending', 'scheduled', 'in_progress', 'picking', 'shipped'];
    else statuses = ['completed', 'delivered', 'closed', 'contractor_denied', 'cancelled'];

    const q = `
      SELECT o.order_id, o.customer_id, o.center_id, o.status, o.order_date,
             COUNT(oi.order_item_id) AS item_count,
             SUM(CASE WHEN oi.item_type='service' THEN 1 ELSE 0 END) AS service_count,
             SUM(CASE WHEN oi.item_type='product' THEN 1 ELSE 0 END) AS product_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.status = ANY($1)
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
      LIMIT 100
    `;
    const rows = (await pool.query(q, [statuses])).rows;

    // Totals across all buckets for UI badges
    const pendingStatuses = ['submitted', 'contractor_pending'];
    const approvedStatuses = ['contractor_approved', 'scheduling_pending', 'scheduled', 'in_progress', 'picking', 'shipped'];
    const archiveStatuses = ['completed', 'delivered', 'closed', 'contractor_denied', 'cancelled'];
    let totals = { pending: 0, approved: 0, archive: 0 };
    try {
      const [p, a, r] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE o.status = ANY($1)`, [pendingStatuses]),
        pool.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE o.status = ANY($1)`, [approvedStatuses]),
        pool.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE o.status = ANY($1)`, [archiveStatuses]),
      ]);
      totals = {
        pending: Number(p.rows?.[0]?.c ?? 0),
        approved: Number(a.rows?.[0]?.c ?? 0),
        archive: Number(r.rows?.[0]?.c ?? 0),
      };
    } catch (e) {
      const approx = rows.length;
      if (bucket === 'pending') totals.pending = approx; else if (bucket === 'approved') totals.approved = approx; else totals.archive = approx;
    }

    return res.json({ success: true, data: rows, totals });
  } catch (error) {
    console.error('Contractor requests endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor requests', error_code: 'server_error' });
  }
});

// POST /api/contractor/requests/:id/approve
const ApproveDenySchema = z.object({ note: z.string().max(2000).optional() });
router.post('/requests/:id/approve', requirePermission('CONTRACTOR_APPROVE'), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const parsed = ApproveDenySchema.safeParse(req.body || {});
  const note = parsed.success ? (parsed.data.note || '') : '';
  try {
    await pool.query('BEGIN');
    await pool.query(`UPDATE orders SET status='contractor_approved', updated_at=NOW() WHERE order_id=$1`, [id]);
    await pool.query(`INSERT INTO approvals(order_id, approver_type, status, note, decided_at) VALUES ($1,'contractor','approved',$2,NOW())`, [id, note || null]);
    await pool.query('COMMIT');
    return res.json({ success: true, data: { order_id: id, status: 'contractor_approved' } });
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Contractor approve error:', error);
    return res.status(500).json({ success: false, error: 'Failed to approve request', error_code: 'server_error' });
  }
});

// POST /api/contractor/requests/:id/deny
router.post('/requests/:id/deny', requirePermission('CONTRACTOR_APPROVE'), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const parsed = ApproveDenySchema.safeParse(req.body || {});
  const note = parsed.success ? (parsed.data.note || '') : '';
  try {
    await pool.query('BEGIN');
    await pool.query(`UPDATE orders SET status='contractor_denied', updated_at=NOW() WHERE order_id=$1`, [id]);
    await pool.query(`INSERT INTO approvals(order_id, approver_type, status, note, decided_at) VALUES ($1,'contractor','denied',$2,NOW())`, [id, note || null]);
    await pool.query('COMMIT');
    return res.json({ success: true, data: { order_id: id, status: 'contractor_denied' } });
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Contractor deny error:', error);
    return res.status(500).json({ success: false, error: 'Failed to deny request', error_code: 'server_error' });
  }
});

export default router;
