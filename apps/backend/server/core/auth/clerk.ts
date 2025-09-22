import type { FastifyRequest } from "fastify";
import { verifyToken } from "@clerk/backend";

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  throw new Error("CLERK_SECRET_KEY is required to verify Clerk tokens.");
}

export interface AuthContext {
  userId: string;
  email: string | null;
}

export async function authenticate(request: FastifyRequest): Promise<AuthContext | null> {
  const authorization = request.headers.authorization ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  try {
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    const email = (payload.email as string | undefined)
      ?? (payload["email_address"] as string | undefined)
      ?? null;

    return {
      userId: payload.sub,
      email,
    };
  } catch {
    return null;
  }
}
