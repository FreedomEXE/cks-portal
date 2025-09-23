import type { FastifyInstance, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { requireActiveAdmin } from '../adminUsers/guards';
import {
  createManager,
  createContractor,
  createCustomer,
  createCenter,
  createCrew,
  createWarehouse,
} from './store';

function mapAdminActor(admin: {
  cksCode: string | null;
  clerkUserId: string;
  role: string;
  fullName?: string | null;
}) {
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

export async function registerProvisioningRoutes(server: FastifyInstance) {
  server.post('/api/admin/provision/managers', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }
    try {
      const record = await createManager(request.body ?? {}, mapAdminActor(admin));
      reply.code(201).send({ data: record });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error }, 'manager provisioning failed');
      reply.code(500).send({ error: 'Failed to create manager' });
    }
  });

  server.post('/api/admin/provision/contractors', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }
    try {
      const record = await createContractor(request.body ?? {}, mapAdminActor(admin));
      reply.code(201).send({ data: record });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error }, 'contractor provisioning failed');
      reply.code(500).send({ error: 'Failed to create contractor' });
    }
  });

  server.post('/api/admin/provision/customers', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }
    try {
      const record = await createCustomer(request.body ?? {}, mapAdminActor(admin));
      reply.code(201).send({ data: record });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error }, 'customer provisioning failed');
      reply.code(500).send({ error: 'Failed to create customer' });
    }
  });

  server.post('/api/admin/provision/centers', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }
    try {
      const record = await createCenter(request.body ?? {}, mapAdminActor(admin));
      reply.code(201).send({ data: record });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error }, 'center provisioning failed');
      reply.code(500).send({ error: 'Failed to create center' });
    }
  });

  server.post('/api/admin/provision/crew', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }
    try {
      const record = await createCrew(request.body ?? {}, mapAdminActor(admin));
      reply.code(201).send({ data: record });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error }, 'crew provisioning failed');
      reply.code(500).send({ error: 'Failed to create crew member' });
    }
  });

  server.post('/api/admin/provision/warehouses', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }
    try {
      const record = await createWarehouse(request.body ?? {}, mapAdminActor(admin));
      reply.code(201).send({ data: record });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error }, 'warehouse provisioning failed');
      reply.code(500).send({ error: 'Failed to create warehouse' });
    }
  });
}
