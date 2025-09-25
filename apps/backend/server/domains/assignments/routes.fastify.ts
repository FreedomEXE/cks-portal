import type { FastifyInstance, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { requireActiveAdmin } from '../adminUsers/guards';
import type { AuditContext } from '../provisioning';
import {
  listUnassignedContractors,
  listUnassignedCustomers,
  listUnassignedCenters,
  listUnassignedCrew,
  assignContractorToManager,
  assignCustomerToContractor,
  assignCenterToCustomer,
  assignCrewToCenter,
  unassignContractorFromManager,
  unassignCustomerFromContractor,
  unassignCenterFromCustomer,
  unassignCrewFromCenter,
} from './store';
import {
  contractorAssignmentSchema,
  customerAssignmentSchema,
  centerAssignmentSchema,
  crewAssignmentSchema,
} from './validators';

function mapAdminActor(admin: {
  cksCode: string | null;
  clerkUserId: string;
  role: string;
  fullName?: string | null;
}): AuditContext {
  return {
    actorId: admin.cksCode ?? admin.clerkUserId,
    actorRole: admin.role ?? 'admin',
    actorName: admin.fullName ?? null,
  };
}

function sendValidationError(reply: FastifyReply, error: ZodError) {
  reply.code(400).send({
    error: 'Validation failed',
    message: error.issues.map((issue) => issue.message).join(', '),
    details: error.issues,
  });
}

export async function registerAssignmentRoutes(server: FastifyInstance) {
  server.get('/api/admin/assignments/:resource/unassigned', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const resource = String((request.params as { resource?: string }).resource ?? '').toLowerCase();

    try {
      if (resource === 'contractors') {
        const data = await listUnassignedContractors();
        reply.send({ data });
        return;
      }
      if (resource === 'customers') {
        const data = await listUnassignedCustomers();
        reply.send({ data });
        return;
      }
      if (resource === 'centers') {
        const data = await listUnassignedCenters();
        reply.send({ data });
        return;
      }
      if (resource === 'crew') {
        const data = await listUnassignedCrew();
        reply.send({ data });
        return;
      }
      reply.code(404).send({ error: 'Unsupported assignment resource' });
    } catch (error) {
      request.log.error({ err: error, resource }, 'failed to load unassigned list');
      reply.code(500).send({ error: 'Failed to load unassigned records' });
    }
  });

  server.post('/api/admin/assignments/contractors/:id/manager', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const contractorId = String((request.params as { id?: string }).id ?? '');

    try {
      const payload = contractorAssignmentSchema.parse(request.body ?? {});
      const result = await assignContractorToManager(contractorId, payload.managerId, mapAdminActor(admin));
      reply.send({ data: result });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error, contractorId }, 'contractor assignment failed');
      reply.code(500).send({ error: (error as Error).message ?? 'Failed to assign contractor' });
    }
  });

  server.post('/api/admin/assignments/customers/:id/contractor', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const customerId = String((request.params as { id?: string }).id ?? '');

    try {
      const payload = customerAssignmentSchema.parse(request.body ?? {});
      const result = await assignCustomerToContractor(customerId, payload.contractorId, mapAdminActor(admin));
      reply.send({ data: result });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error, customerId }, 'customer assignment failed');
      reply.code(500).send({ error: (error as Error).message ?? 'Failed to assign customer' });
    }
  });

  server.post('/api/admin/assignments/centers/:id/customer', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const centerId = String((request.params as { id?: string }).id ?? '');

    try {
      const payload = centerAssignmentSchema.parse(request.body ?? {});
      const result = await assignCenterToCustomer(centerId, payload.customerId, mapAdminActor(admin));
      reply.send({ data: result });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error, centerId }, 'center assignment failed');
      reply.code(500).send({ error: (error as Error).message ?? 'Failed to assign center' });
    }
  });

  server.post('/api/admin/assignments/crew/:id/center', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const crewId = String((request.params as { id?: string }).id ?? '');

    try {
      const payload = crewAssignmentSchema.parse(request.body ?? {});
      const result = await assignCrewToCenter(crewId, payload.centerId, mapAdminActor(admin));
      reply.send({ data: result });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error, crewId }, 'crew assignment failed');
      reply.code(500).send({ error: (error as Error).message ?? 'Failed to assign crew member' });
    }
  });

  // Unassignment endpoints
  server.delete('/api/admin/assignments/contractors/:id/manager', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const contractorId = String((request.params as { id?: string }).id ?? '');

    try {
      const result = await unassignContractorFromManager(contractorId, mapAdminActor(admin));
      reply.send({ data: result });
    } catch (error) {
      request.log.error({ err: error, contractorId }, 'contractor unassignment failed');
      reply.code(500).send({ error: (error as Error).message ?? 'Failed to unassign contractor' });
    }
  });

  server.delete('/api/admin/assignments/customers/:id/contractor', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const customerId = String((request.params as { id?: string }).id ?? '');

    try {
      const result = await unassignCustomerFromContractor(customerId, mapAdminActor(admin));
      reply.send({ data: result });
    } catch (error) {
      request.log.error({ err: error, customerId }, 'customer unassignment failed');
      reply.code(500).send({ error: (error as Error).message ?? 'Failed to unassign customer' });
    }
  });

  server.delete('/api/admin/assignments/centers/:id/customer', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const centerId = String((request.params as { id?: string }).id ?? '');

    try {
      const result = await unassignCenterFromCustomer(centerId, mapAdminActor(admin));
      reply.send({ data: result });
    } catch (error) {
      request.log.error({ err: error, centerId }, 'center unassignment failed');
      reply.code(500).send({ error: (error as Error).message ?? 'Failed to unassign center' });
    }
  });

  server.delete('/api/admin/assignments/crew/:id/center', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const crewId = String((request.params as { id?: string }).id ?? '');

    try {
      const result = await unassignCrewFromCenter(crewId, mapAdminActor(admin));
      reply.send({ data: result });
    } catch (error) {
      request.log.error({ err: error, crewId }, 'crew unassignment failed');
      reply.code(500).send({ error: (error as Error).message ?? 'Failed to unassign crew member' });
    }
  });
}
