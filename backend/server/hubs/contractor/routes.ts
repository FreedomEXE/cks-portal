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

    // Use the actual customer count from the database if available
    let numCustomers = Number(row.num_customers) || 0;
    
    // If num_customers is 0, try to get actual count from customers table
    if (numCustomers === 0) {
      try {
        const c = await pool.query(`SELECT COUNT(*)::int AS c FROM customers WHERE UPPER(contractor_id)=UPPER($1)`, [row.contractor_id]);
        numCustomers = Number(c.rows?.[0]?.c ?? 0);
      } catch {}
    }

    // Calculate years with CKS from created_at
    let yearsWithCks = '1 Year';
    let contractStartDate = null;
    if (row.created_at) {
      const startDate = new Date(row.created_at);
      contractStartDate = startDate.toISOString().slice(0, 10);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
      yearsWithCks = diffYears === 1 ? '1 Year' : `${diffYears} Years`;
    }

    // Load up to 3 favorite services for "Services Specialized In"
    let servicesSpecialized = 'Not Set';
    try {
      const fav = await pool.query(
        `SELECT s.service_name
         FROM contractor_services cs
         JOIN services s ON s.service_id = cs.service_id
         WHERE UPPER(cs.contractor_id)=UPPER($1) AND cs.is_favorite = TRUE
         ORDER BY s.service_name
         LIMIT 3`,
        [row.contractor_id]
      );
      const names = fav.rows.map((r:any) => r.service_name).filter(Boolean);
      if (names.length) servicesSpecialized = names.join(', ');
    } catch {}

    // Load manager details if assigned
    let accountManager: any = null;
    if (row.cks_manager) {
      try {
        const m = await pool.query(
          `SELECT manager_id, manager_name, email, phone, territory, assigned_center
           FROM managers
           WHERE UPPER(manager_id) = UPPER($1)
           LIMIT 1`,
          [row.cks_manager]
        );
        if (m.rowCount > 0) accountManager = m.rows[0];
      } catch {}
    }

    const data = {
      contractor_id: row.contractor_id,
      company_name: row.company_name,
      cks_manager: row.cks_manager || null,
      main_contact: row.main_contact || null,
      email: row.email || null,
      phone: row.phone || null,
      address: row.address || null,
      website: row.website || null,
      years_with_cks: yearsWithCks,
      num_customers: numCustomers,
      contract_start_date: contractStartDate,
      status: row.status || 'active',
      services_specialized: servicesSpecialized,
      payment_status: 'Not Set',
      account_manager: accountManager
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

// GET /api/contractor/my-services?code=CON-###
router.get('/my-services', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || '').trim() || getUserId(req);
    if (!code) return res.status(400).json({ success: false, error: 'code required', error_code: 'invalid_request' });

    const selected = await pool.query(
      `SELECT cs.service_id, cs.is_favorite, s.service_name, s.category, s.description
       FROM contractor_services cs
       JOIN services s ON s.service_id = cs.service_id
       WHERE UPPER(cs.contractor_id) = UPPER($1)
       ORDER BY s.service_name`,
      [code]
    );

    const catalog = await pool.query(
      `SELECT service_id, service_name, category, description
       FROM services
       WHERE status = 'active'
       ORDER BY service_name`
    );

    return res.json({ success: true, data: { selected: selected.rows, catalog: catalog.rows } });
  } catch (error) {
    console.error('Contractor my-services endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch services', error_code: 'server_error' });
  }
});

// POST /api/contractor/my-services  { code, services: string[] }
router.post('/my-services', async (req: Request, res: Response) => {
  try {
    const code = String(req.body.code || '').trim() || getUserId(req);
    const services: string[] = Array.isArray(req.body.services) ? req.body.services.map(String) : [];
    if (!code) return res.status(400).json({ success: false, error: 'code required' });

    await pool.query('BEGIN');
    // Remove deselected
    await pool.query(`DELETE FROM contractor_services WHERE UPPER(contractor_id)=UPPER($1) AND service_id <> ALL($2)`, [code, services.length ? services : ['#none#']]);
    // Upsert selected
    for (const sid of services) {
      await pool.query(
        `INSERT INTO contractor_services(contractor_id, service_id, is_favorite)
         VALUES ($1,$2,FALSE)
         ON CONFLICT (contractor_id, service_id) DO NOTHING`,
        [code, sid]
      );
    }
    await pool.query('COMMIT');
    return res.json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK').catch(()=>{});
    console.error('Contractor save my-services error:', error);
    return res.status(500).json({ success: false, error: 'Failed to save services' });
  }
});

// POST /api/contractor/my-services/add { code, service_id }
router.post('/my-services/add', async (req: Request, res: Response) => {
  try {
    const code = String(req.body.code || '').trim() || getUserId(req);
    const serviceId = String(req.body.service_id || '').trim();
    if (!code) return res.status(400).json({ success: false, error: 'code required' });
    if (!serviceId) return res.status(400).json({ success: false, error: 'service_id required' });
    await pool.query(
      `INSERT INTO contractor_services(contractor_id, service_id, is_favorite)
       VALUES ($1,$2,FALSE)
       ON CONFLICT (contractor_id, service_id) DO NOTHING`,
      [code, serviceId]
    );
    return res.json({ success: true });
  } catch (error) {
    console.error('Contractor add my-service error:', error);
    return res.status(500).json({ success: false, error: 'Failed to add service' });
  }
});

// PATCH /api/contractor/my-services/favorites { code, favorites: string[] } (max 3)
router.patch('/my-services/favorites', async (req: Request, res: Response) => {
  try {
    const code = String(req.body.code || '').trim() || getUserId(req);
    const favorites: string[] = Array.isArray(req.body.favorites) ? req.body.favorites.map(String) : [];
    if (!code) return res.status(400).json({ success: false, error: 'code required' });
    if (favorites.length > 3) return res.status(400).json({ success: false, error: 'Max 3 favorites' });

    await pool.query('BEGIN');
    // Ensure rows exist and set favorite flags
    for (const sid of favorites) {
      await pool.query(
        `INSERT INTO contractor_services(contractor_id, service_id, is_favorite)
         VALUES ($1,$2,TRUE)
         ON CONFLICT (contractor_id, service_id) DO UPDATE SET is_favorite = TRUE, updated_at = NOW()`,
        [code, sid]
      );
    }
    // Clear favorite for non-favorites among selected
    await pool.query(
      `UPDATE contractor_services
       SET is_favorite = FALSE, updated_at = NOW()
       WHERE UPPER(contractor_id) = UPPER($1) AND (ARRAY[$2]::varchar[] IS NULL OR service_id <> ALL($2))`,
      [code, favorites]
    );
    await pool.query('COMMIT');
    return res.json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK').catch(()=>{});
    console.error('Contractor favorites error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update favorites' });
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
