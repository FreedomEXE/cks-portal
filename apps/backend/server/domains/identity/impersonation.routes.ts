import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { query } from '../../db/connection';
import { authenticate } from '../../core/auth/authenticate';
import { findAdminUserByClerkIdentifier, getAdminUserByClerkId } from '../adminUsers/store';

const impersonationRequestSchema = z.object({
  code: z.string().min(3),
});

async function logImpersonationAttempt({ actorId, targetCode, resolvedRole, outcome, reason }: {
  actorId: string;
  targetCode: string;
  resolvedRole: string | null;
  outcome: 'success' | 'failure';
  reason?: string;
}) {
  // TODO: Write to audit log table or external log system
  console.log('[audit] Impersonation', { actorId, targetCode, resolvedRole, outcome, reason });
}

// Helper function to find a user by code across all user tables
export async function findUserByCode(code: string): Promise<{
  code: string;
  role: string;
  displayName: string;
  firstName: string | null;
} | null> {
  const normalizedCode = code.trim().toUpperCase();

  // Check admin_users table
  const adminResult = await query(
    'SELECT cks_code, role, full_name FROM admin_users WHERE UPPER(cks_code) = $1 LIMIT 1',
    [normalizedCode]
  );
  if (adminResult.rows.length > 0) {
    const admin = adminResult.rows[0];
    return {
      code: admin.cks_code,
      role: admin.role || 'admin',
      displayName: admin.full_name || admin.cks_code,
      firstName: admin.full_name?.split(' ')[0] ?? null,
    };
  }

  // Check managers table
  const managerResult = await query(
    'SELECT manager_id, name FROM managers WHERE UPPER(manager_id) = $1 LIMIT 1',
    [normalizedCode]
  );
  if (managerResult.rows.length > 0) {
    const manager = managerResult.rows[0];
    return {
      code: manager.manager_id,
      role: 'manager',
      displayName: manager.name || manager.manager_id,
      firstName: manager.name?.split(' ')[0] ?? null,
    };
  }

  // Check contractors table
  const contractorResult = await query(
    'SELECT contractor_id, name, contact_person FROM contractors WHERE UPPER(contractor_id) = $1 LIMIT 1',
    [normalizedCode]
  );
  if (contractorResult.rows.length > 0) {
    const contractor = contractorResult.rows[0];
    return {
      code: contractor.contractor_id,
      role: 'contractor',
      displayName: contractor.contact_person || contractor.name || contractor.contractor_id,
      firstName: contractor.contact_person?.split(' ')[0] ?? null,
    };
  }

  // Check customers table
  const customerResult = await query(
    'SELECT customer_id, name, main_contact FROM customers WHERE UPPER(customer_id) = $1 LIMIT 1',
    [normalizedCode]
  );
  if (customerResult.rows.length > 0) {
    const customer = customerResult.rows[0];
    return {
      code: customer.customer_id,
      role: 'customer',
      displayName: customer.main_contact || customer.name || customer.customer_id,
      firstName: customer.main_contact?.split(' ')[0] ?? null,
    };
  }

  // Check crew table
  const crewResult = await query(
    'SELECT crew_id, name FROM crew WHERE UPPER(crew_id) = $1 LIMIT 1',
    [normalizedCode]
  );
  if (crewResult.rows.length > 0) {
    const crew = crewResult.rows[0];
    return {
      code: crew.crew_id,
      role: 'crew',
      displayName: crew.name || crew.crew_id,
      firstName: crew.name?.split(' ')[0] ?? null,
    };
  }

  // Check warehouses table
  const warehouseResult = await query(
    'SELECT warehouse_id, name, manager FROM warehouses WHERE UPPER(warehouse_id) = $1 LIMIT 1',
    [normalizedCode]
  );
  if (warehouseResult.rows.length > 0) {
    const warehouse = warehouseResult.rows[0];
    return {
      code: warehouse.warehouse_id,
      role: 'warehouse',
      displayName: warehouse.manager || warehouse.name || warehouse.warehouse_id,
      firstName: warehouse.manager?.split(' ')[0] ?? null,
    };
  }

  // Check centers table
  const centerResult = await query(
    'SELECT center_id, name, main_contact FROM centers WHERE UPPER(center_id) = $1 LIMIT 1',
    [normalizedCode]
  );
  if (centerResult.rows.length > 0) {
    const center = centerResult.rows[0];
    return {
      code: center.center_id,
      role: 'center',
      displayName: center.main_contact || center.name || center.center_id,
      firstName: center.main_contact?.split(' ')[0] ?? null,
    };
  }

  return null;
}

export async function registerImpersonationRoutes(server: FastifyInstance) {
  server.post('/api/admin/impersonate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = impersonationRequestSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: 'Invalid request', details: body.error.issues });
      }
      const code = body.data.code.trim().toUpperCase();
      // Authenticate requester
      const auth = await authenticate(request);
      if (!auth.ok) {
        await logImpersonationAttempt({ actorId: 'unknown', targetCode: code, resolvedRole: null, outcome: 'failure', reason: auth.reason ?? 'unauthenticated' });
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      const requesterId = auth.userId;
      // Look up target user by code across all user tables
      const targetUser = await findUserByCode(code);
      if (!targetUser) {
        await logImpersonationAttempt({ actorId: requesterId, targetCode: code, resolvedRole: null, outcome: 'failure', reason: 'not found' });
        return reply.code(404).send({ error: 'Target user not found' });
      }
      // Use the role from the found user
      const resolvedRole = targetUser.role;
      // Check permission: only admin can impersonate others
      const requester = await getAdminUserByClerkId(requesterId);
      if (!requester || requester.role !== 'admin') {
        await logImpersonationAttempt({ actorId: requesterId, targetCode: code, resolvedRole, outcome: 'failure', reason: 'forbidden' });
        return reply.code(403).send({ error: 'Forbidden' });
      }
      // Audit success
      await logImpersonationAttempt({ actorId: requesterId, targetCode: code, resolvedRole, outcome: 'success' });
      // Respond with impersonation context
      return reply.send({
        code: targetUser.code,
        role: resolvedRole,
        displayName: targetUser.displayName,
        firstName: targetUser.firstName,
      });
    } catch (error) {
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
