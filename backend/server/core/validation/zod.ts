/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * core/validation/zod.ts
 *
 * Description: Zod helpers for parsing inputs
 * Function: parseOrThrow with clean error formatting
 * Importance: Central validation helper
 */

import { ZodSchema } from "zod";

export function parseOrThrow<T>(schema: ZodSchema<T>, input: unknown): T {
  const res = schema.safeParse(input);
  if (!res.success) {
    const details = res.error.issues.map((i) => ({ path: i.path.join("."), code: i.code, message: i.message }));
    const err = new Error("Validation failed");
    (err as any).details = details;
    throw err;
  }
  return res.data;
}

