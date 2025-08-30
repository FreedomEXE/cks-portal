/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../../../Database/db/pool';
import { getRoleFromHeaders, requirePermission } from '../src/auth/rbac';

const router = express.Router();

// Helpers
const ListQuery = z.object({
  center_id: z.string().min(1).optional(),
  customer_id: z.string().min(1).optional(),
  status: z.enum(['open','in_progress','resolved','closed']).optional(),
  type: z.string().min(1).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(25),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// GET /api/reports
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = ListQuery.safeParse(req.query);
    if (!q.success) return res.status(400).json({ success: false, error: 'invalid_query', error_code: 'validation_error' });
    const { center_id, customer_id, status, type, from, to, limit, offset } = q.data;

    // For MVP, allow read for all roles; scope by provided center/customer.
    const where: string[] = [];
    const params: any[] = [];
    if (center_id) { params.push(center_id); where.push(`center_id = $${params.length}`); }
    if (customer_id) { params.push(customer_id); where.push(`customer_id = $${params.length}`); }
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (type) { params.push(type); where.push(`type = $${params.length}`); }
    if (from) { params.push(new Date(from)); where.push(`created_at >= $${params.length}`); }
    if (to) { params.push(new Date(to)); where.push(`created_at <= $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = (
      await pool.query(
        `SELECT report_id, type, severity, title, status, center_id, customer_id, created_by_role, created_by_id, created_at
         FROM reports ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, limit, offset]
      )
    ).rows;

    // Totals by status for badges
    const totalsRow = (
      await pool.query(
        `SELECT 
           SUM(CASE WHEN status='open' THEN 1 ELSE 0 END)::int AS open,
           SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END)::int AS in_progress,
           SUM(CASE WHEN status='resolved' THEN 1 ELSE 0 END)::int AS resolved,
           SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END)::int AS closed
         FROM reports ${whereSql}`,
        params
      )
    ).rows[0] || { open: 0, in_progress: 0, resolved: 0, closed: 0 };

    return res.json({ success: true, data: rows, totals: totalsRow });
  } catch (error) {
    console.error('[reports] list error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// POST /api/reports
const CreateReport = z.object({
  center_id: z.string().min(1).optional(),
  customer_id: z.string().min(1).optional(),
  type: z.enum(['incident','quality','service_issue','general']),
  severity: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
});
router.post('/', requirePermission('REPORT_CREATE'), async (req: Request, res: Response) => {
  try {
    const body = CreateReport.safeParse(req.body);
    if (!body.success) return res.status(400).json({ success: false, error: 'validation_error' });
    const { center_id, customer_id, type, severity, title, description } = body.data;
    // Generate id
    const reportId = `RPT-${Date.now().toString().slice(-8)}`;
    const role = getRoleFromHeaders(req);
    const uid = String(req.headers['x-user-id'] || '').toString() || `${role.toUpperCase()}-000`;
    await pool.query(
      `INSERT INTO reports(report_id, type, severity, title, description, center_id, customer_id, status, created_by_role, created_by_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,$9)`,
      [reportId, type, severity || null, title, description || null, center_id || null, customer_id || null, role, uid]
    );
    return res.status(201).json({ success: true, data: { report_id: reportId, status: 'open' } });
  } catch (error) {
    console.error('[reports] create error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// GET /api/reports/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const report = (
      await pool.query(`SELECT * FROM reports WHERE report_id=$1`, [id])
    ).rows[0];
    if (!report) return res.status(404).json({ success: false, error: 'not_found' });
    const comments = (
      await pool.query(`SELECT comment_id, author_role, author_id, body, created_at FROM report_comments WHERE report_id=$1 ORDER BY comment_id`, [id])
    ).rows;
    return res.json({ success: true, data: { report, comments } });
  } catch (error) {
    console.error('[reports] detail error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// POST /api/reports/:id/comments
const CreateComment = z.object({ body: z.string().min(1).max(5000) });
router.post('/:id/comments', requirePermission('REPORT_COMMENT'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const body = CreateComment.safeParse(req.body);
    if (!body.success) return res.status(400).json({ success: false, error: 'validation_error' });
    const role = getRoleFromHeaders(req);
    const uid = String(req.headers['x-user-id'] || '').toString() || `${role.toUpperCase()}-000`;
    await pool.query(`INSERT INTO report_comments(report_id, author_role, author_id, body) VALUES ($1,$2,$3,$4)`, [id, role, uid, body.data.body]);
    return res.status(201).json({ success: true, data: { report_id: id } });
  } catch (error) {
    console.error('[reports] comment error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// PATCH /api/reports/:id/status
const UpdateStatus = z.object({ status: z.enum(['open','in_progress','resolved','closed']) });
router.patch('/:id/status', requirePermission('REPORT_STATUS'), async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const body = UpdateStatus.safeParse(req.body);
    if (!body.success) return res.status(400).json({ success: false, error: 'validation_error' });
    await pool.query(`UPDATE reports SET status=$1, updated_at=NOW() WHERE report_id=$2`, [body.data.status, id]);
    return res.json({ success: true, data: { report_id: id, status: body.data.status } });
  } catch (error) {
    console.error('[reports] status error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

export default router;

