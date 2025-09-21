import { FastifyReply, FastifyRequest } from "fastify";
import { getAdminUserByClerkId } from "../../domains/adminUsers/store";
import type { AdminUserStatus } from "../../domains/adminUsers/types";

// Read secrets/config from environment. Never embed secrets in code.
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_URL = process.env.CLERK_API_URL || "https://api.clerk.com";

if (!CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is required to verify Clerk sessions.");
}

function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
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

  // Diagnostics: visibility into incoming auth signals (do NOT log secrets/tokens)
  try {
    const cookieKeys = Object.keys(request.cookies || {});
    request.log.info(
      {
        hasBearer: Boolean(bearer),
        hasCookieSession: Boolean(cookieSession),
        cookieKeys,
        clerkApiUrl: CLERK_API_URL,
      },
      "[auth] token presence"
    );
  } catch {}

  if (!sessionToken) {
    reply.code(401);
    return null;
  }

  // Verify the session with Clerk. Prefer the sessions/verify endpoint.
  const verifyResponse = await fetch(`${CLERK_API_URL}/v1/sessions/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CLERK_SECRET_KEY}`,
    },
    body: JSON.stringify({ token: sessionToken }),
  });

  if (!verifyResponse.ok) {
    // Try to capture some context without leaking sensitive data
    try {
      const bodyText = await verifyResponse.text();
      const snippet = bodyText.slice(0, 300);
      request.log.warn(
        { status: verifyResponse.status, bodySnippet: snippet },
        "[auth] Clerk sessions/verify failed"
      );
    } catch {}

    // Fallback A: If token looks like a JWT, try to extract the session id (sid)
    // and fetch it directly.
    let sessionIdCandidate: string | undefined;
    const payload = parseJwtPayload(sessionToken);
    if (payload && typeof payload.sid === "string" && payload.sid.startsWith("sess_")) {
      sessionIdCandidate = payload.sid;
    }

    // Fallback B: Some environments may set a cookie with the session id
    // (less common). If present and looks valid, try that.
    if (!sessionIdCandidate) {
      const cookieSid = request.cookies["__clerk_session"];
      if (cookieSid && /^sess_/.test(cookieSid)) {
        sessionIdCandidate = cookieSid;
      }
    }

    if (sessionIdCandidate) {
      try {
        const getResp = await fetch(`${CLERK_API_URL}/v1/sessions/${sessionIdCandidate}`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${CLERK_SECRET_KEY}` },
        });
        if (getResp.ok) {
          const fallback = (await getResp.json()) as { id: string; user_id: string; status: string };
          if (fallback.status === "active" && fallback.user_id) {
            // Proceed with DB lookup based on user_id
            const adminUser = await getAdminUserByClerkId(fallback.user_id);
            request.log.info({ status: adminUser?.status ?? "miss" }, "[auth] Fallback DB lookup result");
            if (!adminUser || adminUser.status !== "active") {
              reply.code(401);
              return null;
            }
            return {
              sessionId: fallback.id,
              userId: fallback.user_id,
              role: adminUser.role,
              cksCode: adminUser.cksCode,
              status: adminUser.status,
            };
          }
        } else {
          request.log.warn({ status: getResp.status }, "[auth] Fallback GET /sessions/{id} failed");
        }
      } catch (e) {
        request.log.warn({ err: e }, "[auth] Fallback session fetch errored");
      }
    }

    reply.code(401);
    return null;
  }

  const session = (await verifyResponse.json()) as ClerkSession;
  const user = session.user;

  const email = user?.email_addresses?.find((e) => e.id === user.primary_email_address_id)?.email_address
    || user?.email_addresses?.[0]?.email_address;
  const username = user?.username || undefined;

  const adminUser = await getAdminUserByClerkId(session.user_id);
  console.log('[auth] DB lookup for', session.user_id, "got", adminUser ? adminUser.status : 'miss');

  if (!adminUser || adminUser.status !== "active") {
    reply.code(401);
    return null;
  }

  return {
    sessionId: session.id,
    userId: session.user_id,
    email,
    username,
    role: adminUser.role,
    cksCode: adminUser.cksCode,
    status: adminUser.status,
  };
}
