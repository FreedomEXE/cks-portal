import { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';

export function requireCapsFastify(required: string | string[]): preHandlerHookHandler {
  const requiredList = Array.isArray(required) ? required : [required];
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const caps = req.user?.capabilities || [];
    const missing = requiredList.filter((r) => !caps.includes(r));
    if (missing.length > 0) {
      return reply.code(403).send({
        success: false,
        error: {
          code: 'AUTH_FORBIDDEN',
          message: 'Insufficient permissions',
          details: { missing },
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
}

