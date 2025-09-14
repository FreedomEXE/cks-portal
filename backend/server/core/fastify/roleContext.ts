import { FastifyReply, FastifyRequest } from 'fastify';

export async function roleContextFastify(req: FastifyRequest, reply: FastifyReply) {
  const params: any = req.params || {};
  let role = String(params.role || '').toLowerCase();

  // Fallback: infer role from internal mount prefix /api/_{role}/...
  if (!role && typeof req.url === 'string') {
    const m = req.url.match(/^\/api\/_([a-zA-Z]+)(?:\/|$)/);
    if (m) role = m[1].toLowerCase();
  }

  if (!role) {
    return reply.code(400).send({ success: false, error: { code: 'CONTEXT_MISSING_ROLE', message: 'Role parameter required', timestamp: new Date().toISOString() } });
  }

  const validRoles = ['admin', 'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'];
  if (!validRoles.includes(role)) {
    return reply.code(400).send({ success: false, error: { code: 'CONTEXT_INVALID_ROLE', message: 'Invalid role', details: { validRoles }, timestamp: new Date().toISOString() } });
  }

  // Use a custom property instead of the protected req.context
  (req as any).roleContext = { role };
}
