import React, { createContext, useContext } from 'react';

// Minimal mock of Clerk React API to satisfy Login UI rendering without network/auth
export function ClerkProvider({ children }: { children: React.ReactNode; publishableKey?: string }) {
  return <>{children}</>;
}

const AuthContext = createContext({ isSignedIn: false });
export function useAuth() {
  return useContext(AuthContext) as any;
}

export function useSignIn() {
  return {
    isLoaded: true,
    signIn: {
      create: async () => ({ status: 'needs_first_factor' }),
      attemptFirstFactor: async () => ({ status: 'complete', createdSessionId: 'mock' }),
      authenticateWithRedirect: async (_opts?: any) => ({ status: 'redirected' })
    },
    setActive: async () => {}
  } as any;
}

export function useUser() {
  return { user: { id: 'mock-user', username: 'mock', primaryEmailAddress: { emailAddress: 'mock@example.com' } } } as any;
}
