/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../../../Database/db/pool';
import { getRoleFromHeaders, requirePermission } from '../src/auth/rbac';

const router = express.Router();

const ListQuery = z.object({
  center_id: z.string().min(1).optional(),
  customer_id: z.string().min(1).optional(),
  kind: z.enum(['praise','request','issue']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(25),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// GET /api/feedback
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = ListQuery.safeParse(req.query);
    if (!q.success) return res.status(400).json({ success: false, error: 'validation_error' });
    const { center_id, customer_id, kind, from, to, limit, offset } = q.data;

    const where: string[] = [];
    const params: any[] = [];
    if (center_id) { params.push(center_id); where.push(`center_id = $${params.length}`); }
    if (customer_id) { params.push(customer_id); where.push(`customer_id = $${params.length}`); }
    if (kind) { params.push(kind); where.push(`kind = $${params.length}`); }
    if (from) { params.push(new Date(from)); where.push(`created_at >= $${params.length}`); }
    if (to) { params.push(new Date(to)); where.push(`created_at <= $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = (
      await pool.query(
        `SELECT feedback_id, kind, title, center_id, customer_id, created_by_role, created_by_id, created_at
         FROM feedback ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${params.length+1} OFFSET $${params.length+2}`,
        [...params, limit, offset]
      )
    ).rows;

    // Totals by kind for small badges
    const totalsRow = (
      await pool.query(
        `SELECT 
           SUM(CASE WHEN kind='praise' THEN 1 ELSE 0 END)::int AS praise,
           SUM(CASE WHEN kind='request' THEN 1 ELSE 0 END)::int AS request,
           SUM(CASE WHEN kind='issue' THEN 1 ELSE 0 END)::int AS issue
         FROM feedback ${whereSql}`,
        params
      )
    ).rows[0] || { praise: 0, request: 0, issue: 0 };

    return res.json({ success: true, data: rows, totals: totalsRow });
  } catch (error) {
    console.error('[feedback] list error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// POST /api/feedback
const CreateFeedback = z.object({
  center_id: z.string().min(1).optional(),
  customer_id: z.string().min(1).optional(),
  kind: z.enum(['praise','request','issue']),
  title: z.string().min(1).max(200),
  message: z.string().max(5000).optional(),
});
router.post('/', requirePermission('FEEDBACK_CREATE'), async (req: Request, res: Response) => {
  try {
    const body = CreateFeedback.safeParse(req.body);
    if (!body.success) return res.status(400).json({ success: false, error: 'validation_error' });
    const { center_id, customer_id, kind, title, message } = body.data;
    const feedbackId = `FDB-${Date.now().toString().slice(-8)}`;
    const role = getRoleFromHeaders(req);
    const uid = String(req.headers['x-user-id'] || '').toString() || `${role.toUpperCase()}-000`;
    await pool.query(
      `INSERT INTO feedback(feedback_id, kind, title, message, center_id, customer_id, created_by_role, created_by_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [feedbackId, kind, title, message || null, center_id || null, customer_id || null, role, uid]
    );
    return res.status(201).json({ success: true, data: { feedback_id: feedbackId } });
  } catch (error) {
    console.error('[feedback] create error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

// GET /api/feedback/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const row = (await pool.query(`SELECT * FROM feedback WHERE feedback_id=$1`, [id])).rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'not_found' });
    return res.json({ success: true, data: row });
  } catch (error) {
    console.error('[feedback] detail error', error);
    return res.status(500).json({ success: false, error: 'server_error' });
  }
});

export default router;

