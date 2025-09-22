import type { IncomingHttpHeaders } from 'node:http';
import { verifyToken } from '@clerk/backend';

export type AuthContext = {
  userId: string;
  email: string | null;
};

type HeaderSetter = ((name: string, value: string) => void) | { setHeader(name: string, value: string): void };

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required to verify Clerk tokens.');
}

export function extractBearerToken(headers: IncomingHttpHeaders): string | null {
  const raw = headers.authorization ?? headers.Authorization;
  if (typeof raw !== 'string') {
    return null;
  }

  const [scheme, token] = raw.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export async function authenticate(headers: IncomingHttpHeaders): Promise<AuthContext | null> {
  const token = extractBearerToken(headers);
  if (!token) {
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
  } catch {
    return null;
  }
}

export function forwardAuthorizationHeader(headers: IncomingHttpHeaders, target: HeaderSetter): void {
  const raw = headers.authorization ?? headers.Authorization;
  if (typeof raw !== 'string') {
    return;
  }

  const value = raw.trim();
  if (!value) {
    return;
  }

  if (typeof target === 'function') {
    target('authorization', value);
    return;
  }

  target.setHeader('authorization', value);
}
