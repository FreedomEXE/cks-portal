import { FastifyReply, FastifyRequest } from "fastify";
import { findAdminUserByClerkIdentifier } from "../../domains/adminUsers/store";
import type { AdminUserStatus } from "../../domains/adminUsers/types";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = process.env.CLERK_API_URL || "https://api.clerk.com";

if (!CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is required to verify Clerk sessions.");
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
  role: "admin" | "unknown";
  cksCode?: string;
  status: AdminUserStatus | "unknown";
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<AuthContext | null> {
  const bearer = request.headers["authorization"]?.replace(/^Bearer\s+/i, "");
  const cookieSession = request.cookies["__session"] || request.cookies["__clerk_session"];
  const sessionToken = bearer || cookieSession;

  if (!sessionToken) {
    reply.code(401);
    return null;
  }

  const verifyResponse = await fetch(`${CLERK_API_URL}/v1/sessions/${sessionToken}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
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

  const adminUser = await findAdminUserByClerkIdentifier({
    clerkUserId: session.user_id,
    email,
    username,
  });

  let role: AuthContext["role"] = "unknown";
  let cksCode: string | undefined;
  let status: AuthContext["status"] = "unknown";

  if (adminUser) {
    status = adminUser.status;
    if (adminUser.status === "active") {
      role = adminUser.role;
      cksCode = adminUser.cksCode;
    }
  }

  return {
    sessionId: session.id,
    userId: session.user_id,
    email,
    username,
    role,
    cksCode,
    status,
  };
}
