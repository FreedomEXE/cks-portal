import { FastifyPluginCallback } from 'fastify';

// Opt-in mock auth for development: set DEV_MOCK_AUTH=1
export const mockAuthPlugin: FastifyPluginCallback = (app, _opts, done) => {
  app.addHook('preHandler', async (req, reply) => {
    if (process.env.DEV_MOCK_AUTH !== '1') return;
    if (req.user) return; // already authenticated

    const userId = (req.headers['x-mock-user'] as string) || 'MGR-001';
    const roleCode = (req.headers['x-mock-role'] as string) || 'manager';
    const caps = (req.headers['x-mock-caps'] as string)?.split(',').map(s => s.trim()).filter(Boolean) || [
      'dashboard:view','profile:view','profile:update','directory:view','catalog:view'
    ];

    req.user = { userId, roleCode, capabilities: caps, sessionId: 'mock-session' };
    (req as any).roleContext = { role: roleCode };
  });
  done();
};

