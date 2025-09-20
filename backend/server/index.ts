import 'dotenv/config';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { authenticate } from './core/auth/clerk';

type BootstrapResponse = {
  role: string;
  code: string;
  email?: string;
};

export async function buildServer() {
  const server = Fastify({ logger: true });

  await server.register(cors, {
    origin: (origin, cb) => {
      // allow same-origin or undefined (for curl/postman)
      cb(null, true);
    },
    credentials: true,
  });

  await server.register(cookie);

  server.get('/api/health', async () => ({ status: 'ok' }));

  server.get('/api/me/bootstrap', async (request, reply) => {
    const authContext = await authenticate(request, reply);
    if (!authContext) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    if (authContext.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const response: BootstrapResponse = {
      role: 'admin',
      code: authContext.username || authContext.email?.split('@')[0] || 'admin',
      email: authContext.email,
    };

    return reply.send(response);
  });

  return server;
}

async function start() {
  const server = await buildServer();
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await server.listen({ port, host });
    server.log.info(`Backend listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
