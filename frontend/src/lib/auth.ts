/**
 * auth.ts
 * Lightweight auth shim for local dev. When VITE_AUTH_ENABLED !== 'true',
 * useUser() returns { user: null } so pages fall back to dev-bypass (code/localStorage).
 *
 * To re-enable Clerk later, set VITE_AUTH_ENABLED=true and wire ClerkProvider in main.tsx.
 */
export type UserLike = {
  id?: string;
  primaryEmailAddress?: { emailAddress?: string };
};

const AUTH_ENABLED = import.meta.env?.VITE_AUTH_ENABLED === 'true';

// Import Clerk hook only so TypeScript knows the shape; we'll call it only if enabled.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useUser as clerkUseUser } from '@clerk/clerk-react';

export function useUser(): { user: UserLike | null } {
  if (AUTH_ENABLED) {
    try {
      return clerkUseUser();
    } catch {
      // If ClerkProvider not mounted, still return null user.
      return { user: null };
    }
  }
  return { user: null };
}
