/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useUser, useAuth } from '@clerk/clerk-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const [step, setStep] = useState<1|2>(1);
  const [identifier, setIdentifier] = useState(''); // email or username
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmitIdentifier(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    try {
      setLoading(true);
      // Initialize a reset flow for this identifier
      await signIn!.create({ identifier });
      await signIn!.prepareFirstFactor({ strategy: 'reset_password_email_code' });
      setStep(2);
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || 'Could not start password reset.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitReset(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    try {
      setLoading(true);
      const attempt = await signIn!.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });
      if (attempt.status === 'complete') {
        // Optionally sign the user in immediately
        if (attempt.createdSessionId) {
          await setActive!({ session: attempt.createdSessionId });
        }
        // Route to login (or directly to hub if session is active)
        if (isSignedIn || attempt.createdSessionId) {
          // Best-effort route to hub — use username/email prefix
          const uname = (user?.username || identifier.split('@')[0] || '').toLowerCase();
          navigate(uname ? `/${uname}/hub` : '/login', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } else {
        setError('Please complete the verification steps.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || 'Password reset failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#1f1f1f] text-white flex items-center justify-center">
      <div className="w-full max-w-md -translate-y-8">
        <div className="flex flex-col items-center text-center">
          <img src="/cks-logo.png" alt="CKS" className="w-full h-auto mb-1 select-none invert px-6"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <div className="text-lg md:text-xl font-semibold mt-1">Reset your password</div>
        </div>

        {error && (
          <div className="alert-error mb-2">{error}</div>
        )}

        {step === 1 && (
          <form onSubmit={onSubmitIdentifier} className="px-6 pt-0 pb-4 relative z-10">
            <div className="mb-4 text-left">
              <label className="block mb-1 text-white text-base md:text-lg">Email or Username</label>
              <input
                className="w-full rounded-xl border border-gray-700 bg-[#111111] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder-gray-400"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full text-base md:text-lg py-3" disabled={loading || !isLoaded}>
              {loading ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={onSubmitReset} className="px-6 pt-0 pb-4 relative z-10">
            <div className="mb-3 text-left">
              <label className="block mb-1 text-white text-base md:text-lg">Verification code</label>
              <input
                className="w-full rounded-xl border border-gray-700 bg-[#111111] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder-gray-400"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div className="mb-4 text-left">
              <label className="block mb-1 text-white text-base md:text-lg">New password</label>
              <input
                className="w-full rounded-xl border border-gray-700 bg-[#111111] text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-500 placeholder-gray-400"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full text-base md:text-lg py-3" disabled={loading || !isLoaded}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        )}

        <div className="mt-2 text-center text-sm md:text-base text-gray-400">
          <button onClick={() => navigate('/login')} className="hover:underline">Back to sign in</button>
        </div>
      </div>
    </div>
  );
}

