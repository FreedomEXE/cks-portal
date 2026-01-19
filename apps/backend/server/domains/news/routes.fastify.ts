import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { query } from '../../db/connection';

type NewsScope = 'global' | 'ecosystem' | 'user';

function normalizeId(value: string) {
  return value.trim().toUpperCase();
}

function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'administrator';
}

function isManagerRole(role: string | null | undefined): boolean {
  return role === 'manager';
}

async function getManagerIdForAccount(role: string, cksCode: string): Promise<string | null> {
  if (!cksCode) {
    return null;
  }
  if (role === 'manager') {
    return cksCode;
  }
  if (role === 'crew') {
    const crew = await query<{ cks_manager: string | null }>(
      'SELECT cks_manager FROM crew WHERE UPPER(crew_id) = UPPER($1)',
      [cksCode],
    );
    return crew.rows[0]?.cks_manager ?? null;
  }
  if (role === 'contractor') {
    const contractors = await query<{ cks_manager: string | null }>(
      'SELECT cks_manager FROM contractors WHERE UPPER(contractor_id) = UPPER($1)',
      [cksCode],
    );
    return contractors.rows[0]?.cks_manager ?? null;
  }
  if (role === 'customer') {
    const customers = await query<{ cks_manager: string | null }>(
      'SELECT cks_manager FROM customers WHERE UPPER(customer_id) = UPPER($1)',
      [cksCode],
    );
    return customers.rows[0]?.cks_manager ?? null;
  }
  if (role === 'center') {
    const centers = await query<{ cks_manager: string | null }>(
      'SELECT cks_manager FROM centers WHERE UPPER(center_id) = UPPER($1)',
      [cksCode],
    );
    return centers.rows[0]?.cks_manager ?? null;
  }
  if (role === 'warehouse') {
    const warehouses = await query<{ manager_id: string | null }>(
      'SELECT manager_id FROM warehouses WHERE UPPER(warehouse_id) = UPPER($1)',
      [cksCode],
    );
    return warehouses.rows[0]?.manager_id ?? null;
  }
  return null;
}

async function getManagerIdForTarget(cksCode: string): Promise<string | null> {
  const normalized = normalizeId(cksCode);
  const tables = [
    { table: 'managers', column: 'manager_id', managerColumn: 'manager_id' },
    { table: 'crew', column: 'crew_id', managerColumn: 'cks_manager' },
    { table: 'contractors', column: 'contractor_id', managerColumn: 'cks_manager' },
    { table: 'customers', column: 'customer_id', managerColumn: 'cks_manager' },
    { table: 'centers', column: 'center_id', managerColumn: 'cks_manager' },
    { table: 'warehouses', column: 'warehouse_id', managerColumn: 'manager_id' },
  ] as const;

  for (const entry of tables) {
    const result = await query<{ manager_id: string | null }>(
      `SELECT ${entry.managerColumn} AS manager_id FROM ${entry.table} WHERE UPPER(${entry.column}) = UPPER($1)`,
      [normalized],
    );
    if (result.rows.length > 0) {
      return result.rows[0]?.manager_id ?? null;
    }
  }
  return null;
}

function newAnnouncementId() {
  const token = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ANN-${Date.now().toString(36).toUpperCase()}-${token}`;
}

export async function registerNewsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/news', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const role = (account.role ?? '').trim().toLowerCase();
    const cksCode = normalizeId(account.cksCode ?? '');
    const admin = isAdminRole(role);
    const managerId = admin ? null : await getManagerIdForAccount(role, cksCode);

    const querySchema = z.object({
      managerId: z.string().trim().optional(),
    });
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid query parameters.' });
      return;
    }

    const scopedManagerId = parsed.data.managerId ? normalizeId(parsed.data.managerId) : null;

    let sql = `
      SELECT
        a.announcement_id,
        a.title,
        a.body,
        a.summary,
        a.scope_type,
        a.scope_id,
        a.target_roles,
        a.created_by_role,
        a.created_by_id,
        a.created_at,
        a.starts_at,
        a.expires_at
      FROM announcements a
    `;
    const params: string[] = [];

    if (!admin) {
      sql += ' LEFT JOIN announcement_reads ar ON ar.announcement_id = a.announcement_id AND UPPER(ar.reader_id) = UPPER($1)';
      params.push(cksCode);
    }

    sql += `
      WHERE a.status = 'active'
        AND (a.starts_at IS NULL OR a.starts_at <= NOW())
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
    `;

    if (!admin) {
      sql += `
        AND ar.announcement_id IS NULL
        AND (
          a.scope_type = 'global'
          OR (a.scope_type = 'ecosystem' AND UPPER(a.scope_id) = UPPER($2))
          OR (a.scope_type = 'user' AND UPPER(a.scope_id) = UPPER($1))
        )
        AND (a.target_roles IS NULL OR LOWER($3) = ANY(a.target_roles))
      `;
      params.push(managerId ?? '', role);
    } else if (scopedManagerId) {
      params.push(scopedManagerId);
      sql += `
        AND (a.scope_type = 'global' OR UPPER(a.scope_id) = UPPER($1))
      `;
    }

    sql += `
      ORDER BY a.created_at DESC
      LIMIT 50
    `;

    const rows = await query(sql, params);

    reply.send({
      data: rows.rows.map((row) => ({
        id: row.announcement_id,
        title: row.title,
        body: row.body,
        summary: row.summary,
        scopeType: row.scope_type,
        scopeId: row.scope_id,
        targetRoles: row.target_roles,
        createdByRole: row.created_by_role,
        createdById: row.created_by_id,
        createdAt: row.created_at,
        startsAt: row.starts_at,
        expiresAt: row.expires_at,
      })),
    });
  });

  fastify.post('/api/news', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const role = (account.role ?? '').trim().toLowerCase();
    const cksCode = normalizeId(account.cksCode ?? '');
    const admin = isAdminRole(role);
    const manager = isManagerRole(role);

    if (!admin && !manager) {
      reply.code(403).send({ error: 'Only admins and managers can create announcements.' });
      return;
    }

    const schema = z.object({
      title: z.string().trim().min(3).max(120),
      body: z.string().trim().min(10).max(2000),
      summary: z.string().trim().max(240).optional(),
      scopeType: z.enum(['global', 'ecosystem', 'user']),
      scopeId: z.string().trim().optional(),
      targetRoles: z.array(z.string().trim().min(1)).optional(),
      startsAt: z.string().datetime().optional(),
      expiresAt: z.string().datetime().optional(),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid announcement payload.', details: parsed.error.flatten() });
      return;
    }

    const data = parsed.data;
    const scopeType = data.scopeType as NewsScope;
    let scopeId = data.scopeId?.trim() || null;

    if (scopeType === 'global' && !admin) {
      reply.code(403).send({ error: 'Only admins can publish global announcements.' });
      return;
    }

    if (scopeType === 'ecosystem') {
      if (manager) {
        scopeId = cksCode;
      } else if (!scopeId) {
        reply.code(400).send({ error: 'Ecosystem scope requires a manager ID.' });
        return;
      }
    }

    if (scopeType === 'user') {
      if (!scopeId) {
        reply.code(400).send({ error: 'User scope requires a target ID.' });
        return;
      }
      if (manager) {
        const targetManager = await getManagerIdForTarget(scopeId);
        if (!targetManager || normalizeId(targetManager) !== cksCode) {
          reply.code(403).send({ error: 'Managers can only target users in their ecosystem.' });
          return;
        }
      }
    }

    const targetRoles = data.targetRoles?.length
      ? data.targetRoles.map((value) => value.toLowerCase())
      : null;

    const announcementId = newAnnouncementId();
    const summary = data.summary?.trim() || data.body.trim().slice(0, 160);

    await query(
      `
      INSERT INTO announcements (
        announcement_id, title, body, summary, scope_type, scope_id, target_roles,
        starts_at, expires_at, created_by_role, created_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        announcementId,
        data.title.trim(),
        data.body.trim(),
        summary,
        scopeType,
        scopeId,
        targetRoles,
        data.startsAt ?? null,
        data.expiresAt ?? null,
        role,
        cksCode,
      ],
    );

    reply.code(201).send({ data: { id: announcementId } });
  });

  fastify.post('/api/news/:announcementId/dismiss', async (request, reply) => {
    const account = await requireActiveRole(request, reply);
    if (!account) {
      return;
    }

    const paramsSchema = z.object({
      announcementId: z.string().trim().min(1),
    });
    const params = paramsSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'Invalid announcement id.' });
      return;
    }

    const role = (account.role ?? '').trim().toLowerCase();
    const cksCode = normalizeId(account.cksCode ?? '');

    await query(
      `
      INSERT INTO announcement_reads (announcement_id, reader_id, reader_role)
      VALUES ($1, $2, $3)
      ON CONFLICT (announcement_id, reader_id) DO NOTHING
      `,
      [params.data.announcementId, cksCode, role],
    );

    reply.send({ success: true });
  });
}
