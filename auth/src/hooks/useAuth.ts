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
const ROLE_KEY = 'role';
const CODE_KEY = 'code';

function sanitize(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

function readStorage(key: string): string | null {
  try {
    const stored = sessionStorage.getItem(key);
    return stored ? stored : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (!value) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
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

  const [state, setState] = useState<Omit<AuthState, 'refresh'>>(() => {
    const storedRole = readStorage(ROLE_KEY);
    const storedCode = readStorage(CODE_KEY);
    return {
      status: storedRole ? 'ready' : 'idle',
      role: storedRole,
      code: storedCode,
      error: null,
    };
  });

  const refresh = useCallback(async () => {
    if (!authLoaded || !userLoaded || !isSignedIn) {
      return;
    }
    if (fetchingRef.current) {
      return;
    }

    fetchingRef.current = true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => {
      if (prev.role) {
        return { ...prev, error: null };
      }
      return { ...prev, status: 'loading', error: null };
    });

    const email = user?.primaryEmailAddress?.emailAddress || null;
    const username = user?.username || null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    try {
      const headers = new Headers();
      const token = await getToken?.();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (user?.id) {
        headers.set('x-user-id', user.id);
      }
      if (email) {
        headers.set('x-user-email', email);
      }

      timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE}/me/bootstrap`, {
        credentials: 'include',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Bootstrap failed with status ${response.status}`);
      }

      const data = await response.json();
      const rawRole = sanitize(data?.role) || sanitize(data?.kind);
      const rawCode = sanitize(data?.code) || sanitize(data?.internal_code);
      const resolvedCode = fallbackCode(rawCode, email, username);

      if (rawRole) {
        writeStorage(ROLE_KEY, rawRole);
      }
      if (resolvedCode) {
        writeStorage(CODE_KEY, resolvedCode);
      }

      if (!rawRole) {
        throw new Error('Bootstrap response missing role');
      }

      if (abortRef.current !== controller || controller.signal.aborted) {
        return;
      }

      setState({ status: 'ready', role: rawRole, code: resolvedCode, error: null });
    } catch (err) {
      const fallbackRole = readStorage(ROLE_KEY);
      const fallbackCodeValue = readStorage(CODE_KEY);

      if (abortRef.current !== controller) {
        return;
      }

      if (isAbortError(err)) {
        if (fallbackRole) {
          setState({ status: 'ready', role: fallbackRole, code: fallbackCodeValue, error: null });
        } else {
          setState({ status: 'error', role: null, code: null, error: new Error('Bootstrap aborted') });
        }
        return;
      }

      const error = err instanceof Error ? err : new Error('Failed to bootstrap user role');
      console.error('useAuth bootstrap error', error);

      if (fallbackRole) {
        setState({ status: 'ready', role: fallbackRole, code: fallbackCodeValue, error: null });
      } else {
        setState({ status: 'error', role: null, code: null, error });
        writeStorage(ROLE_KEY, null);
        writeStorage(CODE_KEY, null);
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
  }, [authLoaded, userLoaded, isSignedIn, getToken, user]);

  useEffect(() => {
    if (!authLoaded || !userLoaded) {
      return;
    }

    if (!isSignedIn) {
      abortRef.current?.abort();
      fetchingRef.current = false;
      writeStorage(ROLE_KEY, null);
      writeStorage(CODE_KEY, null);
      setState({ status: 'idle', role: null, code: null, error: null });
      return;
    }

    // Only refresh if we don't already have a role and aren't currently fetching
    if (!state.role && !fetchingRef.current && state.status !== 'error') {
      void refresh();
    }
  }, [authLoaded, userLoaded, isSignedIn, state.role, state.status]);

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

