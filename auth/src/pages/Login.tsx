/**
 * OG Login page - copied from frontend/src/pages/Login.tsx
 * Kept intact to preserve visuals and flow.
 */
import { SignedIn, useAuth as useClerkAuth, useSignIn } from '@clerk/clerk-react';
import { FormEvent, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth as useBootstrapAuth } from '../hooks/useAuth';
import logoSrc from '../assets/cks-portal-logo.svg';

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

      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-auto">
        {/* Diagonal split background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#1a1a1a]"></div>
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, #f5f5f0 0%, #f5f5f0 50%, #1a1a1a 50%, #1a1a1a 100%)'
          }}></div>
        </div>
        <div className="w-full max-w-md my-auto relative z-10">
          <div className="bg-[#1f1f1f] rounded-2xl shadow-2xl border border-gray-800 p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <img
                src={logoSrc}
                alt="CKS"
                className="w-full max-w-[280px] h-auto select-none"
                style={{ filter: 'invert(1) brightness(0.9)' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            {error && (<div className="alert-error mb-4">{error}</div>)}
            <form onSubmit={onSubmit} className="relative z-10">
              <div className="mb-4 text-left">
                <label className="block mb-2 text-gray-200 text-sm font-medium">Username</label>
              <input
                className="w-full rounded-xl border border-gray-700 bg-[#111111] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder-gray-400"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
              </div>
              <div className="mb-5 text-left">
                <label className="block mb-2 text-gray-200 text-sm font-medium">Password</label>
              <input
                className="w-full rounded-xl border border-gray-700 bg-[#111111] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder-gray-400"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              </div>
              <button type="submit" className="btn btn-primary w-full text-base py-3 mb-3" disabled={loading || !isLoaded}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <div className="flex items-center justify-center text-xs text-gray-400">
                <a href="/forgot" className="hover:underline hover:text-gray-300 transition-colors">Forgot password?</a>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-800">
              <button onClick={signInWithGoogle} className="btn w-full bg-white hover:bg-gray-100 text-black text-base py-3 transition-colors" disabled={!isLoaded || loading}>
                Continue with Google
              </button>
              <div className="mt-4 text-center text-xs text-gray-500">Secured by Clerk</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
