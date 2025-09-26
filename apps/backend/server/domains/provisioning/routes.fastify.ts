import type { FastifyInstance, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { requireActiveAdmin } from '../adminUsers/guards';
import {
  createCenter,
  createContractor,
  createCrew,
  createCustomer,
  createManager,
  createWarehouse,
} from './store';

type AdminActor = {
  cksCode: string | null;
  clerkUserId: string;
  role: string;
  fullName?: string | null;
};

function mapAdminActor(admin: AdminActor) {
  const actorCode = (admin.cksCode ?? "").trim();
  const actorId = actorCode.length ? actorCode : admin.clerkUserId;
  const actorRole = (admin.role ?? "admin").trim().toLowerCase() || "admin";
  return {
    actorId,
    actorRole,
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

interface ProvisioningConfig {
  path: string;
  createFn: (body: any, actor: any) => Promise<any>;
  entityName: string;
}

const provisioningConfigs: ProvisioningConfig[] = [
  { path: '/api/admin/provision/managers', createFn: createManager, entityName: 'manager' },
  { path: '/api/admin/provision/contractors', createFn: createContractor, entityName: 'contractor' },
  { path: '/api/admin/provision/customers', createFn: createCustomer, entityName: 'customer' },
  { path: '/api/admin/provision/centers', createFn: createCenter, entityName: 'center' },
  { path: '/api/admin/provision/crew', createFn: createCrew, entityName: 'crew member' },
  { path: '/api/admin/provision/warehouses', createFn: createWarehouse, entityName: 'warehouse' },
];

async function createProvisioningHandler(config: ProvisioningConfig) {
  return async (request: any, reply: any) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

    try {
      const record = await config.createFn(request.body ?? {}, mapAdminActor(admin));
      reply.code(201).send({ data: record });
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(reply, error);
        return;
      }
      request.log.error({ err: error }, `${config.entityName} provisioning failed`);
      reply.code(500).send({ error: `Failed to create ${config.entityName}` });
    }
  };
}

export async function registerProvisioningRoutes(server: FastifyInstance) {
  for (const config of provisioningConfigs) {
    server.post(config.path, await createProvisioningHandler(config));
  }
}
