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
  const v = (req.headers['x-user-id'] || req.headers['x-manager-user-id'] || '').toString();
  return String(v || '');
}

// GET /api/manager/centers?code=MGR-001
router.get('/centers', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || getUserId(req) || '').toUpperCase();
    if (!code) return res.status(400).json({ success: false, error: 'code required' });
    const rows = (await pool.query(
      `SELECT center_id AS id, center_name AS name FROM centers WHERE UPPER(cks_manager)=UPPER($1) ORDER BY center_name`,
      [code]
    )).rows;
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[manager] centers list error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// GET /api/manager/customers?code=MGR-001
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || getUserId(req) || '').toUpperCase();
    if (!code) return res.status(400).json({ success: false, error: 'code required' });
    const rows = (await pool.query(
      `SELECT customer_id AS id, company_name AS name FROM customers WHERE UPPER(cks_manager)=UPPER($1) ORDER BY company_name`,
      [code]
    )).rows;
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[manager] customers list error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// GET /api/manager/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sample = {
      manager_id: userId || 'MGR-000',
      name: 'Manager Demo',
      role: 'Territory Manager',
      email: 'manager@demo.com',
      phone: '(555) 123-4567',
      territory: 'Demo Territory',
      status: 'Active'
    };
    return res.json({ success: true, data: sample });
  } catch (error) {
    console.error('Manager profile endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch manager profile', error_code: 'server_error' });
  }
});

// GET /api/manager/news
router.get('/news', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit || 3);
    const data = [
      { id: 'mgr-news-001', title: 'Territory performance review scheduled for Q4', date: '2025-08-15' },
      { id: 'mgr-news-002', title: 'New contractor onboarding process updated', date: '2025-08-12' },
      { id: 'mgr-news-003', title: 'Center capacity reports now available', date: '2025-08-10' }
    ].slice(0, Math.max(1, Math.min(10, limit)));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Manager news endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch manager news', error_code: 'server_error' });
  }
});

// GET /api/manager/requests?bucket=needs_scheduling|in_progress|archive
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const bucket = String(req.query.bucket || 'needs_scheduling').toLowerCase();
    let statuses: string[] = [];
    if (bucket === 'needs_scheduling') statuses = ['contractor_approved', 'scheduling_pending'];
    else if (bucket === 'in_progress') statuses = ['scheduled', 'in_progress'];
    else statuses = ['completed', 'closed', 'cancelled'];

    const q = `
      SELECT o.order_id, o.customer_id, o.center_id, o.status, o.order_date,
             COUNT(oi.order_item_id) AS item_count,
             SUM(CASE WHEN oi.item_type='service' THEN 1 ELSE 0 END) AS service_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.status = ANY($1)
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
      LIMIT 100
    `;
    const rows = (await pool.query(q, [statuses])).rows;

    // Totals across all buckets for UI badges
    const needsStatuses = ['contractor_approved', 'scheduling_pending'];
    const progressStatuses = ['scheduled', 'in_progress'];
    const archiveStatuses = ['completed', 'closed', 'cancelled'];
    let totals = { needs_scheduling: 0, in_progress: 0, archive: 0 };
    try {
      const [n, p, a] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE o.status = ANY($1)`, [needsStatuses]),
        pool.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE o.status = ANY($1)`, [progressStatuses]),
        pool.query(`SELECT COUNT(*)::int AS c FROM orders o WHERE o.status = ANY($1)`, [archiveStatuses]),
      ]);
      totals = {
        needs_scheduling: Number(n.rows?.[0]?.c ?? 0),
        in_progress: Number(p.rows?.[0]?.c ?? 0),
        archive: Number(a.rows?.[0]?.c ?? 0),
      };
    } catch (e) {
      const approx = rows.length;
      if (bucket === 'needs_scheduling') totals.needs_scheduling = approx; else if (bucket === 'in_progress') totals.in_progress = approx; else totals.archive = approx;
    }

    return res.json({ success: true, data: rows, totals });
  } catch (error) {
    console.error('Manager requests endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch manager requests', error_code: 'server_error' });
  }
});

// POST /api/manager/requests/:id/schedule
// Body: { center_id, start, end }
const ScheduleSchema = z.object({
  center_id: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1)
});
router.post('/requests/:id/schedule', requirePermission('MANAGER_SCHEDULE'), async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const parsed = ScheduleSchema.safeParse(req.body || {});
  try {
    if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid request body', error_code: 'validation_error' });
    const { center_id, start, end } = parsed.data;
    const jobId = `JOB-${Date.now().toString().slice(-6)}`;
    await pool.query('BEGIN');
    await pool.query(
      `INSERT INTO service_jobs(job_id, order_id, center_id, scheduled_start, scheduled_end, status) VALUES ($1,$2,$3,$4,$5,'scheduled')`,
      [jobId, id, center_id, new Date(start), new Date(end)]
    );
    await pool.query(`UPDATE orders SET status='scheduled', updated_at=NOW() WHERE order_id=$1`, [id]);
    await pool.query('COMMIT');
    return res.json({ success: true, data: { job_id: jobId, order_id: id, status: 'scheduled' } });
  } catch (error) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('Manager schedule error:', error);
    return res.status(500).json({ success: false, error: 'Failed to schedule request', error_code: 'server_error' });
  }
});

// POST /api/manager/jobs/:id/assign
// Body: { crew_id, role?, hours_estimated? }
router.post('/jobs/:id/assign', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { crew_id, role, hours_estimated } = req.body || {};
  try {
    if (!crew_id) {
      return res.status(400).json({ success: false, error: 'crew_id is required', error_code: 'invalid_request' });
    }
    await pool.query(
      `INSERT INTO job_assignments(job_id, crew_id, role, hours_estimated) VALUES ($1,$2,$3,$4)`,
      [id, crew_id, role || null, hours_estimated || null]
    );
    return res.status(201).json({ success: true, data: { job_id: id, crew_id } });
  } catch (error) {
    console.error('Manager assign error:', error);
    return res.status(500).json({ success: false, error: 'Failed to assign crew', error_code: 'server_error' });
  }
});

export default router;
