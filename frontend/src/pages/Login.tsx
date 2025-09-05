/**
 * File: Login.tsx
 *
 * Description:
 *   Custom Clerk-powered sign-in page with a minimal, dark-styled UI.
 *
 * Functionality:
 *   Handles username/password and Google OAuth sign-in, then deterministically
 *   routes users to their hub at /{id}/hub (preferring typed username, then backend code,
 *   Clerk username, email prefix). Auto-forwards away from /login if already signed in.
 *
 * Importance:
 *   Entry point for authenticated access. Prevents redirect loops and consistently
 *   lands an Admin user on their username-scoped hub.
 *
 * Connections:
 *   Uses Clerk hooks (useSignIn, useAuth, useUser), apiBase (buildUrl, apiFetch),
 *   and React Router navigate(). Persists role/code in sessionStorage for routing helpers.
 *
 * Notes:
 *   Includes a best-effort /me/bootstrap fetch for authoritative role/code. The
 *   Google OAuth flow returns to /login; an effect then forwards to the hub.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useAuth, useUser } from '@clerk/clerk-react';
// Inline API utilities for login page
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
  // Prefer dev/session override code only when impersonating
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
    // Provide user email to help backend map Clerk user to app user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  // Clear any prior impersonation when landing on login
  useEffect(() => {
    try { sessionStorage.removeItem('impersonate'); } catch {}
  }, []);

  // If already signed in (e.g., after OAuth redirect), compute destination and leave /login immediately
  // But check if user was intentionally logged out
  useEffect(() => {
    if (!isSignedIn || redirectedRef.current) return;
    
    // Check if user intentionally logged out (prevent immediate re-login)
    try {
      const wasLoggedOut = localStorage.getItem('userLoggedOut') === 'true';
      if (wasLoggedOut) {
        localStorage.removeItem('userLoggedOut');
        return;
      }
    } catch {}
    
    redirectedRef.current = true;
    (async () => {
      try {
        // Prefer an existing sessionStorage code if present (persisted from prior flows)
        let destId = '';
        try {
          destId = (sessionStorage.getItem('code') || '').toLowerCase();
        } catch {}

        const userEmail = user?.primaryEmailAddress?.emailAddress || '';
        const emailPrefix = (userEmail.split('@')[0] || '').toLowerCase();
        const uname = (user?.username || '').toLowerCase();

        // Best-effort bootstrap to get authoritative code/role
        try {
          const bootstrapUrl = buildUrl('/me/bootstrap');
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2500);
          const r = await apiFetch(bootstrapUrl, { signal: controller.signal });
          clearTimeout(timeout);
          if (r.ok) {
            const js = await r.json();
            const role = (js?.role || js?.kind || '').toLowerCase();
            const code = (js?.code || js?.internal_code || '').toLowerCase();
            if (role) { try { sessionStorage.setItem('role', role); } catch {} }
            if (code) { try { sessionStorage.setItem('code', code); } catch {} }
            destId = destId || code;
          }
        } catch {}

        destId = destId || uname || emailPrefix;
        navigate(destId ? `/${destId}/hub` : '/hub', { replace: true });
      } catch {
        navigate('/hub', { replace: true });
      }
    })();
  }, [isSignedIn, navigate, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    try {
      setLoading(true);
      const result = await signIn!.create({ identifier, password });
      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
        try { localStorage.removeItem('me:lastRole'); localStorage.removeItem('me:lastCode'); } catch {}
        // After session activation, ask backend for authoritative role/code mapping
        try {
          const rawTyped = String(identifier || '').trim();
          const typedPrefix = rawTyped.includes('@') ? rawTyped.split('@')[0] : rawTyped;
          const typed = typedPrefix.toLowerCase().replace(/[^a-z0-9_\-]/g, '');
          // Optimistically store code as the sanitized typed value
          try { if (typed) sessionStorage.setItem('code', typed); } catch {}

          // Try to fetch authoritative code/role from backend
          const clerkId = user?.id || '';
          const headers: Record<string,string> = {};
          if (clerkId) headers['x-user-id'] = clerkId;
          const userEmail = user?.primaryEmailAddress?.emailAddress || '';
          if (userEmail) headers['x-user-email'] = userEmail;
          const bootstrapUrl = buildUrl('/me/bootstrap');
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          let role = '';
          let code = '';
          try {
            const r = await apiFetch(bootstrapUrl, { headers, signal: controller.signal });
            clearTimeout(timeout);
            if (r.ok) {
              const js = await r.json();
              role = (js?.role || js?.kind || '').toLowerCase();
              code = (js?.code || js?.internal_code || '').toLowerCase();
            }
          } catch {}

          const emailPrefix = (userEmail.split('@')[0] || '').toLowerCase();
          const uname = (user?.username || '').toLowerCase();
          // Prefer the typed username first (what the user entered),
          // then backend code, then Clerk username, then email prefix.
          const destId = typed || code || uname || emailPrefix;
          if (role) { try { sessionStorage.setItem('role', role); } catch {} }
          if (code || typed) { try { sessionStorage.setItem('code', code || typed); } catch {} }

          if (destId) {
            navigate(`/${destId}/hub`, { replace: true });
          } else {
            navigate('/hub');
          }
        } catch {
          navigate('/hub');
        }
      } else {
        // Handle MFA or additional steps if enabled in Clerk dashboard
        setError('Additional verification required. Please complete the next step.');
      }
    } catch (err: any) {
      const originalMsg = err?.errors?.[0]?.message || err?.message || 'Sign in failed. Please try again.';

      // If Clerk reports an existing session, try to terminate it and retry once.
      if (typeof originalMsg === 'string' && originalMsg.toLowerCase().includes('session already exists')) {
        try {
          // Attempt to end any lingering session without redirecting.
          if (typeof signOut === 'function') {
            await signOut();
          } else if (typeof (window as any).Clerk?.signOut === 'function') {
            await (window as any).Clerk.signOut();
          }
        } catch {
          // ignore signOut failures and continue to retry
        }

        // Retry sign-in once after clearing session
        try {
          const retry = await signIn!.create({ identifier, password });
          if (retry.status === 'complete') {
            await setActive!({ session: retry.createdSessionId });
            try { localStorage.removeItem('me:lastRole'); localStorage.removeItem('me:lastCode'); } catch {}
            // same bootstrap flow as above (best-effort)
            try {
              const clerkId = user?.id || '';
              const headers: Record<string,string> = {};
              if (clerkId) headers['x-user-id'] = clerkId;
              if (user?.primaryEmailAddress?.emailAddress) headers['x-user-email'] = user.primaryEmailAddress.emailAddress;
              const bootstrapUrl = buildUrl('/me/bootstrap');
              const r = await apiFetch(bootstrapUrl, { headers });
              if (r.ok) {
                const js = await r.json();
                const role = (js?.role || js?.kind || '').toLowerCase();
                const code = js?.code || js?.internal_code || '';
                if (role) {
                  const uname = user?.username || (user?.primaryEmailAddress?.emailAddress || '').split('@')[0];
                  try { sessionStorage.setItem('role', role.toLowerCase()); } catch {}
                  try { sessionStorage.setItem('code', (code || uname || role).toLowerCase()); } catch {}
                  const dest = `/${(uname || code || role).toLowerCase()}/hub`;
                  navigate(dest, { replace: true });
                  return;
                } else if (identifier) {
                  navigate(`/${String(identifier).toLowerCase()}/hub`, { replace: true });
                  return;
                }
              }
            } catch {}
            navigate('/hub');
            return;
          } else {
            setError('Additional verification required. Please complete the next step.');
          }
        } catch (err2: any) {
          const msg2 = err2?.errors?.[0]?.message || err2?.message || 'Sign in failed. Please try again.';
          setError(msg2);
        }
      } else {
        setError(originalMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    if (!isLoaded) return;
    try {
      setLoading(true);
      // If the user typed an identifier, seed it so post-OAuth redirect can resolve a hub path immediately
      try {
        const raw = String(identifier || '').trim();
        const prefix = raw.includes('@') ? raw.split('@')[0] : raw;
        const safe = prefix.toLowerCase().replace(/[^a-z0-9_\-]/g, '');
        if (safe) sessionStorage.setItem('code', safe);
      } catch {}
      await signIn!.authenticateWithRedirect({
        strategy: 'oauth_google',
  // Return to /login; the effect above will detect signed-in state and route to /{code}/hub
  redirectUrl: '/login',
  redirectUrlComplete: '/login',
      });
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || 'Google sign-in failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#1f1f1f] text-white flex items-center justify-center">
      <div className="w-full max-w-md -translate-y-8">
        <div className="flex flex-col items-center text-center">
          {/* Transparent logo; invert to white on dark background and scale up for presence */}
          <img
            src="/cks-logo.png"
            alt="CKS"
            className="w-full h-auto mb-1 select-none invert px-6"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {error && (
          <div className="alert-error mb-2">{error}</div>
        )}

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

        {/* Google OAuth via Clerk; redirect straight to Google */}
        <div className="my-1.5" />
        <button onClick={signInWithGoogle} className="btn w-full bg-white text-black text-base md:text-lg py-2.5" disabled={!isLoaded || loading}>
          Continue with Google
        </button>

        <div className="mt-2 text-center text-sm md:text-base text-gray-400">Secured by Clerk</div>

        
      </div>
    </div>
  );
}
