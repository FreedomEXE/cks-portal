import { FastifyReply, FastifyRequest } from 'fastify';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = process.env.CLERK_API_URL || 'https://api.clerk.com';
const ADMIN_IDENTIFIERS = (process.env.CLERK_ADMIN_IDENTIFIERS || 'freedom_exe|freedom_exe@cks.test')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

if (!CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required to verify Clerk sessions.');
}

interface ClerkSession {
  id: string;
  status: string;
  user_id: string;
  user?: {
    id: string;
    username: string | null;
    email_addresses: { id: string; email_address: string }[];
    primary_email_address_id: string | null;
  } | null;
}

export interface AuthContext {
  sessionId: string;
  userId: string;
  email?: string;
  username?: string;
  role: 'admin' | 'unknown';
}

function isAdmin(username?: string | null, email?: string | null): boolean {
  const normalizedUser = (username || '').toLowerCase();
  const normalizedEmail = (email || '').toLowerCase();
  return ADMIN_IDENTIFIERS.includes(normalizedUser) || ADMIN_IDENTIFIERS.includes(normalizedEmail);
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<AuthContext | null> {
  const bearer = request.headers['authorization']?.replace(/^Bearer\s+/i, '');
  const cookieSession = request.cookies['__session'] || request.cookies['__clerk_session'];
  const sessionToken = bearer || cookieSession;

  if (!sessionToken) {
    reply.code(401);
    return null;
  }

  const verifyResponse = await fetch(`${CLERK_API_URL}/v1/sessions/${sessionToken}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
    },
    body: JSON.stringify({ token: sessionToken }),
  });

  if (!verifyResponse.ok) {
    reply.code(401);
    return null;
  }

  const session = (await verifyResponse.json()) as ClerkSession;
  const user = session.user;

  const email = user?.email_addresses?.find((e) => e.id === user.primary_email_address_id)?.email_address
    || user?.email_addresses?.[0]?.email_address;
  const username = user?.username || undefined;
  const role: AuthContext['role'] = isAdmin(username, email) ? 'admin' : 'unknown';

  return {
    sessionId: session.id,
    userId: session.user_id,
    email,
    username,
    role,
  };
}
