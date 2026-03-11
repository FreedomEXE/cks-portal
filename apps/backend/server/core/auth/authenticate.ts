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
const IS_PROD = process.env.NODE_ENV === 'production';
const DEV_AUTH_ENABLED = String(process.env.CKS_ENABLE_DEV_AUTH ?? 'false') === 'true' && !IS_PROD;
// In dev override mode, do not hard-throw during module load if Clerk is not configured
if (!CLERK_SECRET_KEY && !DEV_AUTH_ENABLED) {
  // Keep a soft warning to help surface misconfiguration
  // eslint-disable-next-line no-console
  console.warn('[auth] CLERK_SECRET_KEY missing; token verification will fail. Set CKS_ENABLE_DEV_AUTH=true to use dev headers.');
}

export async function authenticate(req: FastifyRequest): Promise<AuthResult> {
  const authorization = req.headers.authorization ?? '';
  const [scheme, token] = authorization.split(' ');

  console.log('[auth] Header received:', token ? 'yes' : 'no', '| scheme:', scheme ?? 'none');

  if (scheme !== 'Bearer' || !token) {
    return { ok: false, reason: 'missing_header' };
  }

  try {
    if (!CLERK_SECRET_KEY) {
      console.log('[auth] No CLERK_SECRET_KEY - cannot verify token');
      return { ok: false, reason: 'verify_fail' };
    }
    const payload = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
      audience: process.env.CLERK_JWT_AUDIENCE || undefined,
    });

    const claims = payload as Record<string, unknown>;
    const userId = typeof claims.sub === 'string' ? (claims.sub as string) : null;

    if (!userId) {
      console.log('[auth] Token verified but no sub claim');
      return { ok: false, reason: 'no_userid' };
    }

    const email = typeof claims.email === 'string'
      ? (claims.email as string)
      : typeof claims['email_address'] === 'string'
        ? (claims['email_address'] as string)
        : null;

    console.log('[auth] Authenticated:', userId, email ?? 'no-email');

    return {
      ok: true,
      userId,
      email,
    };
  } catch (error) {
    console.error('[auth] Token verification failed:', (error as Error)?.message ?? 'unknown');
    req.log?.warn?.({ err: error }, 'Failed to verify Clerk token');
    return { ok: false, reason: 'verify_fail' };
  }
}
