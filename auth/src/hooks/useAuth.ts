import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type AuthStatus = 'idle' | 'loading' | 'ready' | 'error';

type AuthState = {
  status: AuthStatus;
  role: string | null;
  code: string | null;
  fullName: string | null;
  firstName: string | null;
  ownerFirstName: string | null;
  error: Error | null;
  refresh: () => Promise<void>;
};

type InternalAuthState = Omit<AuthState, 'refresh'>;

type AuthSnapshot = {
  role: string;
  code: string | null;
  fullName: string | null;
  firstName: string | null;
  ownerFirstName: string | null;
};

const INITIAL_STATE: InternalAuthState = {
  status: 'idle',
  role: null,
  code: null,
  fullName: null,
  firstName: null,
  ownerFirstName: null,
  error: null,
};

const SIGNED_OUT_STATE: InternalAuthState = {
  ...INITIAL_STATE,
  status: 'ready',
};

const DEV_PROXY_BASE = '/api';
const RAW_API_BASE = import.meta.env.VITE_API_URL || DEV_PROXY_BASE;
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

function sanitize(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

function sanitizePreservingCase(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function firstFromFullName(fullName: string | null): string | null {
  if (!fullName) {
    return null;
  }
  const [first] = fullName.split(/\s+/);
  return first || null;
}

function emailPrefix(email: string | null): string | null {
  if (!email) {
    return null;
  }
  const [prefix] = email.split('@');
  const trimmed = prefix?.trim();
  return trimmed ? trimmed : null;
}

function resolveFirstName({
  firstName,
  fullName,
  email,
  username,
  code,
}: {
  firstName?: string | null;
  fullName?: string | null;
  email?: string | null;
  username?: string | null;
  code?: string | null;
}): string | null {
  return (
    sanitizePreservingCase(firstName) ??
    firstFromFullName(sanitizePreservingCase(fullName)) ??
    sanitizePreservingCase(username) ??
    emailPrefix(email ?? null) ??
    sanitizePreservingCase(code)
  );
}

function fallbackCode(existing: string | null, userEmail: string | null, username: string | null): string | null {
  if (existing) {
    return existing;
  }
  if (username) {
    return username.toLowerCase();
  }
  if (userEmail) {
    const prefix = userEmail.split('@')[0] || '';
    const safe = prefix.toLowerCase();
    return safe || null;
  }
  return null;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const name = (error as { name?: string }).name;
  return name === 'AbortError';
}

export function useAuth(): AuthState {
  const { isLoaded: authLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const abortRef = useRef<AbortController | null>(null);
  const fetchingRef = useRef(false);
  const requestIdRef = useRef(0);
  const lastResolvedRef = useRef<AuthSnapshot | null>(null);

  const [state, setState] = useState<InternalAuthState>({ ...INITIAL_STATE });

  // Debug logging
  console.log('[useAuth] Current state:', {
    status: state.status,
    authLoaded,
    userLoaded,
    isSignedIn,
    userId: user?.id,
    API_BASE,
  });

  const refresh = useCallback(async () => {
    console.log('[useAuth] refresh() called:', { authLoaded, userLoaded, isSignedIn });

    if (!authLoaded || !userLoaded) {
      console.log('[useAuth] Waiting for Clerk to load');
      return;
    }

    if (!isSignedIn) {
      console.log('[useAuth] User not signed in, resetting state');
      abortRef.current?.abort();
      fetchingRef.current = false;
      lastResolvedRef.current = null;
      requestIdRef.current = 0;
      setState({ ...SIGNED_OUT_STATE });
      return;
    }

    // Throttle: only allow one refresh per 1000ms
    const id = ++requestIdRef.current;
    fetchingRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((current) => ({
      ...current,
      status: 'loading',
      error: null,
    }));

    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      null;
    const username = user?.username ?? null;

    const headers = new Headers();
    let timeout: ReturnType<typeof setTimeout> | null = null;

    try {
      const token = await getToken().catch(() => null);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (user?.id) {
        headers.set('x-user-id', user.id);
      }
      if (email) {
        headers.set('x-user-email', email);
      }

      timeout = setTimeout(() => controller.abort(), 15_000);

      const bootstrapUrl = `${API_BASE}/me/bootstrap`;
      console.log('[useAuth] Calling bootstrap:', bootstrapUrl, { hasToken: !!token });

      const response = await fetch(bootstrapUrl, {
        credentials: 'include',
        headers,
        signal: controller.signal,
      });

      console.log('[useAuth] Bootstrap response:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[useAuth] 401 Unauthorized - clearing auth state');
          lastResolvedRef.current = null;
          // Trigger re-authentication or show user notification
          // Consider calling Clerk's signOut() or redirecting to login
          setState({
            status: 'ready',
            role: null,
            code: null,
            fullName: null,
            firstName: null,
            ownerFirstName: null,
            error: null,
          });
          return;
        }        throw new Error(`Bootstrap failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('[useAuth] Bootstrap data received:', data);
      const rawRole = sanitize(data?.role) ?? sanitize(data?.kind);
      const rawCode = sanitizePreservingCase(data?.code) ?? sanitizePreservingCase(data?.internal_code);
      if (!rawRole) {
        throw new Error('Bootstrap response missing role');
      }

      const resolvedCode = fallbackCode(rawCode, email, username);
      const fullName = sanitizePreservingCase(data?.fullName);
      const serverFirstName = sanitizePreservingCase(data?.firstName);
      const serverOwnerFirstName = sanitizePreservingCase(data?.ownerFirstName);
      const resolvedFirstName = resolveFirstName({
        firstName: serverFirstName,
        fullName,
        email: (typeof data?.email === 'string' ? data.email : null) ?? email,
        username,
        code: resolvedCode,
      });
      const resolvedOwnerFirstName =
        resolveFirstName({
          firstName: serverOwnerFirstName,
          fullName,
          email: (typeof data?.email === 'string' ? data.email : null) ?? email,
          username,
          code: resolvedCode,
        }) ?? resolvedFirstName;

      // Only update state if this is the latest request
      if (requestIdRef.current !== id || controller.signal.aborted) {
        return;
      }

      const snapshot: AuthSnapshot = {
        role: rawRole,
        code: resolvedCode,
        fullName,
        firstName: resolvedFirstName,
        ownerFirstName: resolvedOwnerFirstName,
      };
      lastResolvedRef.current = snapshot;
      setState({
        status: 'ready',
        role: snapshot.role,
        code: snapshot.code,
        fullName: snapshot.fullName,
        firstName: snapshot.firstName,
        ownerFirstName: snapshot.ownerFirstName,
        error: null,
      });
    } catch (err) {
      const aborted = isAbortError(err);
      if (!aborted) {
        console.error('[useAuth] Bootstrap error:', err);
      }
      if (requestIdRef.current !== id) {
        return;
      }

      const cached = lastResolvedRef.current;
      if (aborted) {
        requestIdRef.current = 0;
        setState({
          status: 'idle',
          role: cached?.role ?? null,
          code: cached?.code ?? null,
          fullName: cached?.fullName ?? null,
          firstName: cached?.firstName ?? null,
          ownerFirstName: cached?.ownerFirstName ?? null,
          error: null,
        });
      } else {
        const error = err instanceof Error ? err : new Error('Failed to bootstrap user role');
        if (cached) {
          setState({
            status: 'ready',
            role: cached.role,
            code: cached.code,
            fullName: cached.fullName,
            firstName: cached.firstName,
            ownerFirstName: cached.ownerFirstName,
            error: null,
          });
        } else {
          setState({
            status: 'error',
            role: null,
            code: null,
            fullName: null,
            firstName: null,
            ownerFirstName: null,
            error,
          });
        }
      }
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
      fetchingRef.current = false;
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [authLoaded, getToken, isSignedIn, user, userLoaded]);

  useEffect(() => {
    console.log('[useAuth] useEffect triggered:', {
      authLoaded,
      userLoaded,
      isSignedIn,
      stateRole: state.role,
      stateStatus: state.status,
      fetchingRef: fetchingRef.current,
    });

    if (!authLoaded || !userLoaded) {
      console.log('[useAuth] Clerk not fully loaded yet');
      return;
    }

    if (!isSignedIn) {
      console.log('[useAuth] Not signed in - resetting');
      abortRef.current?.abort();
      fetchingRef.current = false;
      lastResolvedRef.current = null;
      requestIdRef.current = 0;
      setState({ ...SIGNED_OUT_STATE });
      return;
    }

    if (!state.role && !fetchingRef.current && state.status !== 'error') {
      console.log('[useAuth] Triggering refresh()');
      void refresh();
    }
  }, [authLoaded, isSignedIn, refresh, state.role, state.status, userLoaded]);

  useEffect(() => {
    if (state.status !== 'ready' || !state.role) {
      return;
    }
    // Do not force-redirect away from allowed standalone pages like catalog
    const allowedPaths = new Set(['/hub', '/catalog']);
    if (allowedPaths.has(location.pathname)) {
      return;
    }
    // Only redirect when landing on root or unknown paths, not when user is
    // navigating to a known top-level page.
    if (location.pathname === '/' || location.pathname === '/login') {
      navigate('/hub', { replace: true });
    }
  }, [state.status, state.role, location.pathname, navigate]);

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  return useMemo<AuthState>(() => ({
    ...state,
    refresh,
  }), [state, refresh]);
}



