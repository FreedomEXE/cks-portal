import { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';

export function requireRoleFastify(expectedRole: string): preHandlerHookHandler {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const role = ((req.params as any)?.role || (req as any).roleContext?.role || '').toLowerCase();
    if (role !== expectedRole.toLowerCase()) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'CONTEXT_ROLE_FORBIDDEN',
          message: `Role ${role || 'unknown'} not allowed for this endpoint`,
          details: { expected: expectedRole },
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}
