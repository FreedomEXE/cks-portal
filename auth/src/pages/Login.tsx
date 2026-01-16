/**
 * OG Login page - copied from frontend/src/pages/Login.tsx
 * Kept intact to preserve visuals and flow.
 */
import { SignedIn, useAuth as useClerkAuth, useSignIn } from '@clerk/clerk-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth as useBootstrapAuth } from '../hooks/useAuth';
import logoSrc from '../assets/cks-portal-logo.svg';

const CARD_ANIMATION_STYLE_ID = 'cks-login-card-animation';

export default function Login() {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useClerkAuth();
  useBootstrapAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isLoaded || submittingRef.current) {
      return;
    }

    if (isSignedIn) {
      navigate('/hub', { replace: true });
      return;
    }

    submittingRef.current = true;

    try {
      setLoading(true);

      const result = await signIn!.create({ identifier, password });

      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
        navigate('/hub', { replace: true });
        return;
      }

      if (result.status === 'needs_first_factor') {
        const attempt = await signIn!.attemptFirstFactor({
          strategy: 'password',
          password,
        });

        if (attempt.status === 'complete') {
          await setActive!({ session: attempt.createdSessionId });
          navigate('/hub', { replace: true });
          return;
        }

        setError('Additional verification required. Please complete the next step.');
        return;
      }

      setError('Sign in failed. Please try again.');
    } catch (err: any) {
      const clerkError = err?.errors?.[0];
      if (clerkError?.code === 'session_exists') {
        navigate('/hub', { replace: true });
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
      navigate('/hub', { replace: true });
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

      const env: any = (import.meta as any).env ?? {};
      const redirectPath = env.VITE_CLERK_SIGN_IN_URL || '/login';
      await signIn!.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: redirectPath,
        redirectUrlComplete: redirectPath,
      });
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || 'Google sign-in failed.';
      setError(msg);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (!document.getElementById(CARD_ANIMATION_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = CARD_ANIMATION_STYLE_ID;
      style.textContent = `@keyframes cksCardEntrance {
        from {
          opacity: 0;
          transform: translateY(60px) scale(0.96);
          filter: blur(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0px);
        }
      }`;
      document.head.appendChild(style);
      cleanup = () => {
        if (style.parentElement) {
          style.parentElement.removeChild(style);
        }
      };
    }

    const frame = requestAnimationFrame(() => {
      setTimeout(() => setReady(true), 100);
    });
    return () => {
      cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, []);

  const cardSurfaceStyle = useMemo(
    () => ({
      backgroundColor: '#4a5568',
      backgroundImage: `
        radial-gradient(ellipse at top, rgba(255,255,255,0.12) 0%, transparent 60%),
        linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 40%),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg opacity='0.03'%3E%3Cpolygon fill='white' points='50 0, 60 40, 100 50, 60 60, 50 100, 40 60, 0 50, 40 40'/%3E%3C/g%3E%3C/svg%3E"),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg opacity='0.02'%3E%3Cpath fill='white' d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")
      `,
      backgroundSize: 'cover, cover, 50px 50px, 40px 40px',
      backgroundPosition: 'center, top, 0 0, 0 0',
      boxShadow: `
        0 0 0 1px rgba(255,255,255,0.1) inset,
        0 2px 4px rgba(0,0,0,0.1) inset,
        0 50px 100px -20px rgba(0,0,0,0.5),
        0 30px 60px -30px rgba(0,0,0,0.6)
      `,
    }),
    [],
  );

  return (
    <>
      <SignedIn>
        <Navigate to="/hub" replace />
      </SignedIn>

      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Diagonal split background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#1a1a1a]" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #f5f5f0 0%, #f5f5f0 52%, #1a1a1a 52%, #1a1a1a 100%)' }}
          />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div
              className="relative"
              style={
                ready
                  ? {
                      animation: 'cksCardEntrance 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
                    }
                  : {
                      opacity: 0,
                      transform: 'translateY(60px) scale(0.96)',
                      filter: 'blur(4px)'
                    }
              }
            >
              <div className="absolute -inset-2 rounded-[32px] bg-gradient-to-b from-white/10 to-black/30 blur-2xl" aria-hidden />
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white/[0.08] to-transparent" aria-hidden />
              <div
                className="relative rounded-[28px] border border-slate-600/40 p-8 backdrop-blur-sm"
                style={cardSurfaceStyle}
              >
                <div className="flex flex-col items-center text-center mb-8">
                  <img
                    src={logoSrc}
                    alt="CKS"
                    className="w-full max-w-[260px] h-auto select-none"
                    style={{ filter: 'invert(1) brightness(1.1)' }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                {error && <div className="alert-error mb-4">{error}</div>}
                <form onSubmit={onSubmit} className="relative z-10">
                <div className="mb-4 text-left">
                  <label className="block mb-2 text-sm font-medium text-slate-200">CKS ID</label>
                  <input
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-600/15 placeholder:text-neutral-500"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-5 text-left">
                  <label className="block mb-2 text-sm font-medium text-slate-200">Password</label>
                  <input
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-600/15 placeholder:text-neutral-500"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={loading || !isLoaded}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <div className="flex items-center justify-center pt-3 text-xs text-slate-300">
                  <a href="/forgot" className="transition-colors hover:text-neutral-900 hover:underline">
                    Forgot password?
                  </a>
                </div>
              </form>

              <div className="mt-6 border-t border-slate-500/30 pt-6">
                <button
                  onClick={signInWithGoogle}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-base font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={!isLoaded || loading}
                >
                  Continue with Google
                </button>
                <div className="mt-4 text-center text-xs text-slate-400">Secured by Clerk</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
