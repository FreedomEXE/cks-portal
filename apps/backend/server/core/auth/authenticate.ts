import type { FastifyRequest } from 'fastify';
import { verifyToken } from '@clerk/backend';

export type AuthContext = {
  userId: string;
  email: string | null;
};

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required to verify Clerk tokens.');
}

export async function authenticate(req: FastifyRequest): Promise<AuthContext | null> {
  const authorization = req.headers.authorization ?? '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  try {
    const payload: Record<string, unknown> = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    const userId = typeof payload.sub === 'string' ? (payload.sub as string) : null;

    if (!userId) {
      return null;
    }

    const email = typeof payload.email === 'string'
      ? (payload.email as string)
      : typeof payload['email_address'] === 'string'
        ? (payload['email_address'] as string)
        : null;

    return {
      userId,
      email,
    };
  } catch (error) {
    req.log?.warn?.({ err: error }, 'Failed to verify Clerk token');
    return null;
  }
}
