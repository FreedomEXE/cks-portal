import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type AuthStatus = 'idle' | 'loading' | 'ready' | 'error';

type AuthState = {
  status: AuthStatus;
  role: string | null;
  code: string | null;
  error: Error | null;
  refresh: () => Promise<void>;
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
  const lastRequestRef = useRef(0);
  const lastResolvedRef = useRef<{ role: string; code: string | null } | null>(null);

  const [state, setState] = useState<Omit<AuthState, 'refresh'>>({
    status: 'idle',
    role: null,
    code: null,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!authLoaded || !userLoaded) {
      return;
    }

    if (!isSignedIn) {
      abortRef.current?.abort();
      fetchingRef.current = false;
      lastResolvedRef.current = null;
      lastRequestRef.current = 0;
      setState({ status: 'idle', role: null, code: null, error: null });
      return;
    }

    if (fetchingRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastRequestRef.current < 1000) {
      return;
    }
    lastRequestRef.current = now;

    fetchingRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((current) => ({
      status: 'loading',
      role: current.role,
      code: current.code,
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

      const response = await fetch(`${API_BASE}/me/bootstrap`, {
        credentials: 'include',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          lastResolvedRef.current = null;
          setState({ status: 'ready', role: null, code: null, error: null });
          return;
        }
        throw new Error(`Bootstrap failed with status ${response.status}`);
      }

      const data = await response.json();
      const rawRole = sanitize(data?.role) ?? sanitize(data?.kind);
      const rawCode = sanitize(data?.code) ?? sanitize(data?.internal_code);
      if (!rawRole) {
        throw new Error('Bootstrap response missing role');
      }

      const resolvedCode = fallbackCode(rawCode, email, username);

      if (abortRef.current !== controller || controller.signal.aborted) {
        return;
      }

      lastResolvedRef.current = { role: rawRole, code: resolvedCode };
      setState({ status: 'ready', role: rawRole, code: resolvedCode, error: null });
    } catch (err) {
      if (abortRef.current !== controller) {
        return;
      }

      const cached = lastResolvedRef.current;
      if (isAbortError(err)) {
        // Retryable
        setState({
          status: 'idle',
          role: cached?.role ?? null,
          code: cached?.code ?? null,
          error: null,
        });
      } else {
        const error = err instanceof Error ? err : new Error('Failed to bootstrap user role');
        if (cached) {
          setState({ status: 'ready', role: cached.role, code: cached.code, error: null });
        } else {
          setState({ status: 'error', role: null, code: null, error });
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
    if (!authLoaded || !userLoaded) {
      return;
    }

    if (!isSignedIn) {
      abortRef.current?.abort();
      fetchingRef.current = false;
      lastResolvedRef.current = null;
      lastRequestRef.current = 0;
      setState({ status: 'idle', role: null, code: null, error: null });
      return;
    }

    if (!state.role && !fetchingRef.current && state.status !== 'error') {
      void refresh();
    }
  }, [authLoaded, isSignedIn, refresh, state.role, state.status, userLoaded]);

  useEffect(() => {
    if (state.status !== 'ready' || !state.role) {
      return;
    }
    if (location.pathname.startsWith('/hub')) {
      return;
    }
    navigate('/hub', { replace: true });
  }, [state.status, state.role, location.pathname, navigate]);

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  return useMemo<AuthState>(() => ({
    ...state,
    refresh,
  }), [state, refresh]);
}
