/**
 * OG Login page — copied from frontend/src/pages/Login.tsx
 * Kept intact to preserve visuals and flow.
 */
import { useAuth, useSignIn, useUser } from '@clerk/clerk-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../assets/cks-logo.png';

const DEV_PROXY_BASE = '/api';
const RAW_API_BASE = import.meta.env.VITE_API_URL || DEV_PROXY_BASE;
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

function buildUrl(path: string, params: Record<string, any> = {}) {
  const url = new URL(API_BASE + path, window.location.origin);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function getClerkUserId(): string | null {
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    const u = w?.Clerk?.user?.id || w?.Clerk?.session?.user?.id || null;
    return u ? String(u) : null;
  } catch { return null; }
}

async function apiFetch(input: string, init: RequestInit = {}) {
  let overrideCode: string | null = null;
  let overrideRole: string | null = null;
  let impersonate = false;
  try {
    impersonate = sessionStorage.getItem('impersonate') === 'true';
    if (impersonate) {
      overrideCode = sessionStorage.getItem('me:lastCode');
      overrideRole = sessionStorage.getItem('me:lastRole');
    }
  } catch { /* ignore */ }
  const userId = (impersonate && overrideCode) ? overrideCode : getClerkUserId();
  const headers = new Headers(init.headers || {});
  if (userId && !headers.has('x-user-id')) headers.set('x-user-id', userId);
  if (impersonate && overrideRole && !headers.has('x-user-role')) headers.set('x-user-role', overrideRole);
  try {
    const w: any = typeof window !== 'undefined' ? (window as any) : null;
    const email = w?.Clerk?.user?.primaryEmailAddress?.emailAddress || w?.Clerk?.session?.user?.primaryEmailAddress?.emailAddress || null;
    if (email && !headers.has('x-user-email')) headers.set('x-user-email', String(email));
  } catch { /* ignore */ }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const opts: RequestInit = { credentials: 'include', ...init, headers };
  return fetch(input, opts);
}

export default function Login() {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectedRef = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {
  if (!isSignedIn || redirectedRef.current) return;

  (async () => {
    try {
      const wasLoggedOut = localStorage.getItem('userLoggedOut') === 'true';
      if (wasLoggedOut) {
        localStorage.removeItem('userLoggedOut');
        return;
      }

      redirectedRef.current = true;

      let destId = '';
      try {
        destId = (sessionStorage.getItem('code') || '').toLowerCase();
      } catch {}

      const bootstrapUrl = buildUrl('/me/bootstrap');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      // Try to include a Bearer token for the backend in addition to cookies
      let headers: HeadersInit | undefined = undefined;
      try {
        const w: any = typeof window !== 'undefined' ? (window as any) : null;
        const token: string | null | undefined = await w?.Clerk?.session?.getToken?.();
        if (token) headers = { Authorization: `Bearer ${token}` };
      } catch {}

      const response = await apiFetch(bootstrapUrl, { signal: controller.signal, headers });
      clearTimeout(timeout);

      if (!response.ok) {
        console.error('Bootstrap request failed', response.status);
        return;
      }

      const data = await response.json();
      const role = (data?.role || data?.kind || '').toLowerCase();
      const code = (data?.code || data?.internal_code || '').toLowerCase();

      if (role) { try { sessionStorage.setItem('role', role); } catch {} }
      if (code) { try { sessionStorage.setItem('code', code); } catch {} }

      if (!destId) {
        destId = code;
      }

      if (!destId) {
        const userEmail = user?.primaryEmailAddress?.emailAddress || '';
        const emailPrefix = (userEmail.split('@')[0] || '').toLowerCase();
        const uname = (user?.username || '').toLowerCase();
        destId = emailPrefix || uname || 'admin';
      }

      navigate(destId ? `/${destId}/hub` : '/hub', { replace: true });
    } catch (err) {
      console.error('Bootstrap navigation skipped:', err);
    }
  })();
}, [isSignedIn, navigate, user]);

  async function onSubmit(e: FormEvent) {
  e.preventDefault();
  setError(null);

  if (!isLoaded || submittingRef.current) {
    return;
  }

  if (isSignedIn) {
    navigate('/admin/hub', { replace: true });
    return;
  }

  submittingRef.current = true;

  try {
    setLoading(true);

    const result = await signIn!.create({ identifier, password });

    if (result.status === 'complete') {
      await setActive!({ session: result.createdSessionId });
      return;
    }

    if (result.status === 'needs_first_factor') {
      const attempt = await signIn!.attemptFirstFactor({
        strategy: 'password',
        password,
      });

      if (attempt.status === 'complete') {
        await setActive!({ session: attempt.createdSessionId });
        return;
      }

      setError('Additional verification required. Please complete the next step.');
      return;
    }

    setError('Sign in failed. Please try again.');
  } catch (err: any) {
    const clerkError = err?.errors?.[0];
    if (clerkError?.code === 'session_exists') {
      navigate('/admin/hub', { replace: true });
      return;
    }

    const message = clerkError?.message || err?.message || 'Sign in failed. Please try again.';
    setError(message);
  } finally {
    submittingRef.current = false;
    setLoading(false);
  }
}

  async function signInWithGoogle() {
  if (!isLoaded || submittingRef.current) return;

  if (isSignedIn) {
    navigate('/admin/hub', { replace: true });
    return;
  }

  try {
    submittingRef.current = true;
    setLoading(true);

    try {
      const raw = String(identifier || '').trim();
      const prefix = raw.includes('@') ? raw.split('@')[0] : raw;
      const safe = prefix.toLowerCase().replace(/[^a-z0-9_\-]/g, '');
      if (safe) sessionStorage.setItem('code', safe);
    } catch {}

    await signIn!.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/login',
      redirectUrlComplete: '/login',
    });
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message || err?.message || 'Google sign-in failed.';
    setError(msg);
  } finally {
    submittingRef.current = false;
    setLoading(false);
  }
}

  return (
    <div className="fixed inset-0 bg-[#1f1f1f] text-white flex items-center justify-center">
      <div className="w-full max-w-md -translate-y-8">
        <div className="flex flex-col items-center text-center">
          <img
            src={logoSrc}
            alt="CKS"
            className="w-full h-auto mb-1 select-none invert px-6"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        {error && (<div className="alert-error mb-2">{error}</div>)}
        <form onSubmit={onSubmit} className="px-6 pt-0 pb-4 relative z-10">
          <div className="mb-3 text-left">
            <label className="block mb-1 text-white text-base md:text-lg">Username</label>
            <input
              className="w-full rounded-xl border border-gray-700 bg-[#111111] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder-gray-400"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
          <div className="mb-4 text-left">
            <label className="block mb-1 text-white text-base md:text-lg">Password</label>
            <input
              className="w-full rounded-xl border border-gray-700 bg-[#111111] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder-gray-400"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full text-base md:text-lg py-3" disabled={loading || !isLoaded}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <div className="flex items-center justify-center mt-2 text-xs md:text-sm text-gray-400">
            <a href="/forgot" className="hover:underline">Forgot password?</a>
          </div>
        </form>
        <div className="my-1.5" />
        <button onClick={signInWithGoogle} className="btn w-full bg-white text-black text-base md:text-lg py-2.5" disabled={!isLoaded || loading}>
          Continue with Google
        </button>
        <div className="mt-2 text-center text-sm md:text-base text-gray-400">Secured by Clerk</div>
      </div>
    </div>
  );
}

