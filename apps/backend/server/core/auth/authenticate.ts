import type { FastifyRequest } from 'fastify';
import { verifyToken } from '@clerk/backend';

export type AuthContext = {
  userId: string;
  email: string | null;
};

export type AuthFailureReason = 'missing_header' | 'verify_fail' | 'no_userid';

export type AuthResult =
  | ({ ok: true } & AuthContext)
  | { ok: false; reason: AuthFailureReason };

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required to verify Clerk tokens.');
}

export async function authenticate(req: FastifyRequest): Promise<AuthResult> {
  const authorization = req.headers.authorization ?? '';
  const [scheme, token] = authorization.split(' ');

  console.log('[auth] Header received:', token ? `yes (preview: ${token.slice(0, 10)}...)` : 'no');

  if (scheme !== 'Bearer' || !token) {
    return { ok: false, reason: 'missing_header' };
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
      issuer: process.env.CLERK_JWT_ISSUER,
      audience: process.env.CLERK_JWT_AUDIENCE || undefined,
    });

    const claims = payload as Record<string, unknown>;
    const userId = typeof claims.sub === 'string' ? (claims.sub as string) : null;

    if (!userId) {
      return { ok: false, reason: 'no_userid' };
    }

    const email = typeof claims.email === 'string'
      ? (claims.email as string)
      : typeof claims['email_address'] === 'string'
        ? (claims['email_address'] as string)
        : null;

    console.log('[auth] Verified userId:', userId);

    return {
      ok: true,
      userId,
      email,
    };
  } catch (error) {
    console.error('[auth] Verify fail:', (error as Error)?.message ?? error);
    req.log?.warn?.({ err: error }, 'Failed to verify Clerk token');
    return { ok: false, reason: 'verify_fail' };
  }
}
