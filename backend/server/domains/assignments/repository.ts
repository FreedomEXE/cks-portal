import pool from '../../db/connection';
import { AssignmentEntity, AssignmentsQuery, AssignmentStatus } from './types';

export async function listAssignments(query: AssignmentsQuery): Promise<AssignmentEntity[]> {
  const where: string[] = [];
  const vals: any[] = [];
  if (query.status) { vals.push(query.status); where.push(`status = $${vals.length}`); }
  if (query.assignee_id) { vals.push(query.assignee_id); where.push(`assignee_id = $${vals.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Math.min(Math.max(query.limit || 25, 1), 200);
  const offset = Math.max(((query.page || 1) - 1) * limit, 0);
  const res = await pool.query(
    `SELECT assignment_id, type, subject, assignee_id, status, priority, created_at, updated_at
     FROM assignments
     ${whereSql}
     ORDER BY updated_at DESC NULLS LAST, assignment_id DESC
     LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
    [...vals, limit, offset]
  );
  return res.rows as AssignmentEntity[];
}

export async function createAssignment(input: Pick<AssignmentEntity,'type'|'subject'|'assignee_id'|'priority'>): Promise<AssignmentEntity> {
  const res = await pool.query(
    `INSERT INTO assignments (type, subject, assignee_id, status, priority)
     VALUES ($1, $2, $3, 'pending', $4)
     RETURNING assignment_id, type, subject, assignee_id, status, priority, created_at, updated_at`,
    [input.type, input.subject, input.assignee_id, input.priority]
  );
  return res.rows[0] as AssignmentEntity;
}

export async function updateAssignmentStatus(assignmentId: number, status: AssignmentStatus): Promise<AssignmentEntity | null> {
  const res = await pool.query(
    `UPDATE assignments SET status = $1, updated_at = NOW() WHERE assignment_id = $2
     RETURNING assignment_id, type, subject, assignee_id, status, priority, created_at, updated_at`,
    [status, assignmentId]
  );
  return (res.rows?.[0] as AssignmentEntity) || null;
}

