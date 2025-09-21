/**
 * OG Login page - copied from frontend/src/pages/Login.tsx
 * Kept intact to preserve visuals and flow.
 */
import { SignedIn, useAuth as useClerkAuth, useSignIn } from '@clerk/clerk-react';
import { FormEvent, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth as useBootstrapAuth } from '../hooks/useAuth';
import logoSrc from '../assets/cks-logo.png';

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
    <>
      <SignedIn>
        <Navigate to="/hub" replace />
      </SignedIn>

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
              {loading ? 'Signing in...' : 'Sign in'}
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
    </>
  );
}
