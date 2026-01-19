import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { query } from '../../db/connection';

type MemoRole = 'crew' | 'manager';

function normalizeId(value: string) {
  return value.trim().toUpperCase();
}

function isMemoRole(role: string | null | undefined): role is MemoRole {
  return role === 'crew' || role === 'manager';
}

function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'administrator';
}

async function getCrewManagerId(crewId: string): Promise<string | null> {
  const result = await query<{ cks_manager: string | null }>(
    'SELECT cks_manager FROM crew WHERE UPPER(crew_id) = UPPER($1)',
    [crewId],
  );
  return result.rows[0]?.cks_manager ?? null;
}

async function crewExists(crewId: string): Promise<boolean> {
  const result = await query('SELECT 1 FROM crew WHERE UPPER(crew_id) = UPPER($1)', [crewId]);
  return result.rows.length > 0;
}

async function managerExists(managerId: string): Promise<boolean> {
  const result = await query('SELECT 1 FROM managers WHERE UPPER(manager_id) = UPPER($1)', [managerId]);
  return result.rows.length > 0;
}

function buildThreadKey(a: { id: string; role: MemoRole }, b: { id: string; role: MemoRole }) {
  const left = `${a.role}:${normalizeId(a.id)}`;
  const right = `${b.role}:${normalizeId(b.id)}`;
  return [left, right].sort().join('|');
}

function newThreadId() {
  const token = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MEM-${Date.now().toString(36).toUpperCase()}-${token}`;
}

async function assertParticipant(threadId: string, cksCode: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM memos_participants WHERE thread_id = $1 AND UPPER(participant_id) = UPPER($2)',
    [threadId, cksCode],
  );
  return result.rows.length > 0;
}

export async function registerMemosRoutes(fastify: FastifyInstance) {
  fastify.get('/api/admin/memos/ecosystems', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const role = account.role?.toLowerCase() ?? '';
    if (!isAdminRole(role)) {
      reply.code(403).send({ error: 'Admin access required.' });
      return;
    }

    const ecosystems = await query(
      `
      SELECT manager_id, name
      FROM managers
      WHERE status IS NULL OR status <> 'archived'
      ORDER BY manager_id ASC
      `
    );

    reply.send({
      data: ecosystems.rows.map((row) => ({
        id: row.manager_id,
        name: row.name,
      })),
    });
  });

  fastify.get('/api/admin/memos/threads', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const role = account.role?.toLowerCase() ?? '';
    if (!isAdminRole(role)) {
      reply.code(403).send({ error: 'Admin access required.' });
      return;
    }

    const querySchema = z.object({
      managerId: z.string().trim().min(1),
    });
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid ecosystem selection.' });
      return;
    }

    const managerId = normalizeId(parsed.data.managerId);

    const threads = await query(
      `
      SELECT
        t.thread_id,
        t.thread_type,
        t.last_message_at,
        t.ecosystem_manager_id,
        json_agg(
          json_build_object(
            'id', p.participant_id,
            'role', p.participant_role,
            'name', CASE
              WHEN p.participant_role = 'manager' THEN m.name
              ELSE c.name
            END
          )
          ORDER BY p.participant_role ASC, p.participant_id ASC
        ) AS participants,
        lm.body AS last_message,
        lm.created_at AS last_message_created_at
      FROM memos_threads t
      JOIN memos_participants p ON p.thread_id = t.thread_id
      LEFT JOIN crew c ON p.participant_role = 'crew' AND UPPER(c.crew_id) = UPPER(p.participant_id)
      LEFT JOIN managers m ON p.participant_role = 'manager' AND UPPER(m.manager_id) = UPPER(p.participant_id)
      LEFT JOIN LATERAL (
        SELECT body, created_at
        FROM memos_messages mm
        WHERE mm.thread_id = t.thread_id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON true
      WHERE UPPER(t.ecosystem_manager_id) = UPPER($1)
      GROUP BY t.thread_id, t.thread_type, t.last_message_at, t.ecosystem_manager_id, lm.body, lm.created_at, t.created_at
      ORDER BY COALESCE(t.last_message_at, lm.created_at, t.created_at) DESC
      `,
      [managerId],
    );

    reply.send({
      data: threads.rows.map((row) => ({
        threadId: row.thread_id,
        threadType: row.thread_type,
        lastMessageAt: row.last_message_at ?? row.last_message_created_at ?? null,
        lastMessage: row.last_message ?? null,
        ecosystemManagerId: row.ecosystem_manager_id,
        participants: row.participants ?? [],
      })),
    });
  });

  fastify.get('/api/admin/memos/threads/:threadId/messages', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const role = account.role?.toLowerCase() ?? '';
    if (!isAdminRole(role)) {
      reply.code(403).send({ error: 'Admin access required.' });
      return;
    }

    const paramsSchema = z.object({
      threadId: z.string().trim().min(1),
    });
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid thread id.' });
      return;
    }

    const querySchema = z.object({
      limit: z.string().optional(),
      before: z.string().optional(),
    });
    const queryParams = querySchema.safeParse(request.query);
    if (!queryParams.success) {
      reply.code(400).send({ error: 'Invalid query params.' });
      return;
    }

    const limit = Math.min(100, Math.max(1, Number(queryParams.data.limit ?? 50)));
    const before = queryParams.data.before ? new Date(queryParams.data.before) : null;

    const messages = await query(
      `
      SELECT message_id, sender_id, sender_role, body, created_at
      FROM memos_messages
      WHERE thread_id = $1
      ${before ? 'AND created_at < $2' : ''}
      ORDER BY created_at DESC
      LIMIT $3
      `,
      before ? [params.data.threadId, before.toISOString(), limit] : [params.data.threadId, limit],
    );

    reply.send({
      data: messages.rows.map((row) => ({
        messageId: row.message_id,
        senderId: row.sender_id,
        senderRole: row.sender_role,
        body: row.body,
        createdAt: row.created_at,
      })),
    });
  });

  fastify.get('/api/memos/threads', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const role = account.role?.toLowerCase() ?? '';
    if (!isMemoRole(role)) {
      reply.code(403).send({ error: 'Memo access is limited to crew and managers.' });
      return;
    }

    const cksCode = normalizeId(account.cksCode ?? '');

    const threads = await query(
      `
      SELECT
        t.thread_id,
        t.thread_type,
        t.last_message_at,
        p.participant_id,
        p.participant_role,
        c.name AS crew_name,
        m.name AS manager_name,
        lm.body AS last_message,
        lm.created_at AS last_message_created_at
      FROM memos_threads t
      JOIN memos_participants me ON me.thread_id = t.thread_id AND UPPER(me.participant_id) = UPPER($1)
      JOIN memos_participants p ON p.thread_id = t.thread_id AND UPPER(p.participant_id) <> UPPER($1)
      LEFT JOIN crew c ON p.participant_role = 'crew' AND UPPER(c.crew_id) = UPPER(p.participant_id)
      LEFT JOIN managers m ON p.participant_role = 'manager' AND UPPER(m.manager_id) = UPPER(p.participant_id)
      LEFT JOIN LATERAL (
        SELECT body, created_at
        FROM memos_messages mm
        WHERE mm.thread_id = t.thread_id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON true
      ORDER BY COALESCE(t.last_message_at, lm.created_at, t.created_at) DESC
      `,
      [cksCode],
    );

    const data = threads.rows.map((row) => ({
      threadId: row.thread_id,
      threadType: row.thread_type,
      lastMessageAt: row.last_message_at ?? row.last_message_created_at ?? null,
      lastMessage: row.last_message ?? null,
      participant: {
        id: row.participant_id,
        role: row.participant_role,
        name: row.participant_role === 'manager' ? row.manager_name : row.crew_name,
      },
    }));

    reply.send({ data });
  });

  fastify.get('/api/memos/threads/:threadId/messages', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const role = account.role?.toLowerCase() ?? '';
    if (!isMemoRole(role)) {
      reply.code(403).send({ error: 'Memo access is limited to crew and managers.' });
      return;
    }

    const paramsSchema = z.object({
      threadId: z.string().trim().min(1),
    });
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid thread id.' });
      return;
    }

    const threadId = params.data.threadId;
    const isParticipant = await assertParticipant(threadId, account.cksCode ?? '');
    if (!isParticipant) {
      reply.code(403).send({ error: 'You do not have access to this thread.' });
      return;
    }

    const querySchema = z.object({
      limit: z.string().optional(),
      before: z.string().optional(),
    });
    const queryParams = querySchema.safeParse(request.query);
    if (!queryParams.success) {
      reply.code(400).send({ error: 'Invalid query params.' });
      return;
    }

    const limit = Math.min(100, Math.max(1, Number(queryParams.data.limit ?? 50)));
    const before = queryParams.data.before ? new Date(queryParams.data.before) : null;

    const messages = await query(
      `
      SELECT message_id, sender_id, sender_role, body, created_at
      FROM memos_messages
      WHERE thread_id = $1
      ${before ? 'AND created_at < $2' : ''}
      ORDER BY created_at DESC
      LIMIT $3
      `,
      before ? [threadId, before.toISOString(), limit] : [threadId, limit],
    );

    reply.send({
      data: messages.rows.map((row) => ({
        messageId: row.message_id,
        senderId: row.sender_id,
        senderRole: row.sender_role,
        body: row.body,
        createdAt: row.created_at,
      })),
    });
  });

  fastify.post('/api/memos/threads', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const role = account.role?.toLowerCase() ?? '';
    if (!isMemoRole(role)) {
      reply.code(403).send({ error: 'Memo access is limited to crew and managers.' });
      return;
    }

    const schema = z.object({
      targetId: z.string().trim().min(1),
      targetRole: z.enum(['crew', 'manager']),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid thread payload', details: body.error.flatten() });
      return;
    }

    const senderId = normalizeId(account.cksCode ?? '');
    const targetId = normalizeId(body.data.targetId);
    const targetRole = body.data.targetRole;

    if (senderId === targetId && role === targetRole) {
      reply.code(400).send({ error: 'Cannot create a thread with yourself.' });
      return;
    }

    let managerId: string | null = null;

    if (role === 'crew') {
      managerId = await getCrewManagerId(senderId);
      if (!managerId) {
        reply.code(400).send({ error: 'Crew manager not found.' });
        return;
      }

      if (targetRole === 'crew') {
        if (!(await crewExists(targetId))) {
          reply.code(404).send({ error: 'Target crew not found.' });
          return;
        }
        const targetManager = await getCrewManagerId(targetId);
        if (!targetManager || normalizeId(targetManager) !== normalizeId(managerId)) {
          reply.code(403).send({ error: 'Crew members must be in the same ecosystem.' });
          return;
        }
      } else if (targetRole === 'manager') {
        if (normalizeId(managerId) !== targetId) {
          reply.code(403).send({ error: 'Crew can only message their manager.' });
          return;
        }
        if (!(await managerExists(targetId))) {
          reply.code(404).send({ error: 'Manager not found.' });
          return;
        }
      }
    } else if (role === 'manager') {
      managerId = senderId;
      if (targetRole !== 'crew') {
        reply.code(403).send({ error: 'Managers can only message crew in their ecosystem.' });
        return;
      }
      if (!(await crewExists(targetId))) {
        reply.code(404).send({ error: 'Target crew not found.' });
        return;
      }
      const targetManager = await getCrewManagerId(targetId);
      if (!targetManager || normalizeId(targetManager) !== senderId) {
        reply.code(403).send({ error: 'Crew members must be in the manager ecosystem.' });
        return;
      }
    }

    const threadKey = buildThreadKey({ id: senderId, role }, { id: targetId, role: targetRole });
    const existing = await query(
      'SELECT thread_id FROM memos_threads WHERE thread_key = $1',
      [threadKey],
    );

    if (existing.rows.length > 0) {
      reply.send({ data: { threadId: existing.rows[0].thread_id } });
      return;
    }

    const threadId = newThreadId();

    await query(
      `
      INSERT INTO memos_threads (thread_id, thread_key, thread_type, ecosystem_manager_id, created_by_id, created_by_role)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [threadId, threadKey, 'direct', managerId, senderId, role],
    );

    await query(
      `
      INSERT INTO memos_participants (thread_id, participant_id, participant_role)
      VALUES ($1, $2, $3), ($1, $4, $5)
      `,
      [threadId, senderId, role, targetId, targetRole],
    );

    reply.code(201).send({ data: { threadId } });
  });

  fastify.post('/api/memos/messages', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const role = account.role?.toLowerCase() ?? '';
    if (!isMemoRole(role)) {
      reply.code(403).send({ error: 'Memo access is limited to crew and managers.' });
      return;
    }

    const schema = z.object({
      threadId: z.string().trim().min(1),
      body: z.string().trim().min(1).max(2000),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) {
      reply.code(400).send({ error: 'Invalid message payload', details: body.error.flatten() });
      return;
    }

    const threadId = body.data.threadId;
    const isParticipant = await assertParticipant(threadId, account.cksCode ?? '');
    if (!isParticipant) {
      reply.code(403).send({ error: 'You do not have access to this thread.' });
      return;
    }

    const senderId = normalizeId(account.cksCode ?? '');

    const result = await query(
      `
      INSERT INTO memos_messages (thread_id, sender_id, sender_role, body)
      VALUES ($1, $2, $3, $4)
      RETURNING message_id, created_at
      `,
      [threadId, senderId, role, body.data.body],
    );

    await query(
      'UPDATE memos_threads SET last_message_at = $1, updated_at = $1 WHERE thread_id = $2',
      [result.rows[0].created_at, threadId],
    );

    reply.code(201).send({
      data: {
        messageId: result.rows[0].message_id,
        createdAt: result.rows[0].created_at,
      },
    });
  });
}
