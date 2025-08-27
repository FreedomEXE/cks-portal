/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';
import pool from '../../../../Database/db/pool';

const router = express.Router();

function getUserId(req: Request): string {
  const v = (req.headers['x-user-id'] || req.headers['x-contractor-user-id'] || '').toString();
  return String(v || '');
}

// GET /api/contractor/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sample = {
      contractor_id: userId || 'CON-000',
      company_name: 'Contractor Demo LLC',
      account_manager: 'MGR-001',
      email: 'contact@contractor-demo.com',
      phone: '(555) 987-6543',
      address: '123 Business Ave, Suite 100',
      payment_status: 'Current',
      services_purchased: ['Cleaning', 'Maintenance']
    };
    return res.json({ success: true, data: sample });
  } catch (error) {
    console.error('Contractor profile endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor profile', error_code: 'server_error' });
  }
});

// GET /api/contractor/dashboard
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const data = [
      { label: 'Active Customers', value: 15, trend: '+3', color: '#3b7af7' },
      { label: 'Active Centers', value: 8, trend: '+2', color: '#8b5cf6' },
      { label: 'Account Status', value: 'Current', color: '#10b981' },
      { label: 'Services Used', value: 3, color: '#f59e0b' },
      { label: 'Active Crew', value: 12, trend: '+1', color: '#ef4444' },
      { label: 'Pending Orders', value: 4, color: '#f97316' }
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
    const limit = Number(req.query.limit || 5);
    const data = [
      { id: 'CUS-001', name: 'Metro Office Plaza', centers: 3, status: 'Active', last_service: '2025-08-22' },
      { id: 'CUS-002', name: 'Riverside Shopping Center', centers: 2, status: 'Active', last_service: '2025-08-21' },
      { id: 'CUS-003', name: 'Downtown Business Tower', centers: 4, status: 'Active', last_service: '2025-08-20' },
      { id: 'CUS-004', name: 'Suburban Medical Complex', centers: 1, status: 'Pending', last_service: '2025-08-15' },
      { id: 'CUS-005', name: 'Industrial Park West', centers: 2, status: 'Active', last_service: '2025-08-18' }
    ].slice(0, Math.max(1, Math.min(10, limit)));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Contractor customers endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor customers', error_code: 'server_error' });
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
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Contractor requests endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor requests', error_code: 'server_error' });
  }
});

// POST /api/contractor/requests/:id/approve
router.post('/requests/:id/approve', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const note = String((req.body?.note ?? '') || '');
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
router.post('/requests/:id/deny', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const note = String((req.body?.note ?? '') || '');
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