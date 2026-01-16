import { FormEvent, useMemo, useState } from 'react';
import logoSrc from '../assets/cks-portal-logo.svg';

const API_BASE = String((import.meta as any).env?.VITE_API_URL || '/api').replace(/\/+$/, '');

export default function Forgot() {
  const [cksId, setCksId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cardSurfaceStyle = useMemo(
    () => ({
      backgroundColor: '#4a5568',
      backgroundImage: `
        radial-gradient(ellipse at top, rgba(255,255,255,0.12) 0%, transparent 60%),
        linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 40%),
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg opacity='0.03'%3E%3Cpolygon fill='white' points='50 0, 60 40, 100 50, 60 60, 50 100, 40 60, 0 50, 40 40'/%3E%3C/g%3E%3C/svg%3E")
      `,
      backgroundSize: 'cover, cover, 50px 50px',
      backgroundPosition: 'center, top, 0 0',
      boxShadow: `
        0 0 0 1px rgba(255,255,255,0.1) inset,
        0 2px 4px rgba(0,0,0,0.1) inset,
        0 50px 100px -20px rgba(0,0,0,0.5),
        0 30px 60px -30px rgba(0,0,0,0.6)
      `,
    }),
    [],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!cksId.trim()) {
      setError('Please enter your CKS ID.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/account/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cksId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Request failed');
      }

      setMessage('If the account exists, a reset email has been sent.');
    } catch (err: any) {
      const msg = err?.message || 'Failed to send reset email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#1a1a1a]" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #f5f5f0 0%, #f5f5f0 52%, #1a1a1a 52%, #1a1a1a 100%)' }}
        />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="relative rounded-[28px] border border-slate-600/40 p-8 backdrop-blur-sm" style={cardSurfaceStyle}>
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
            {message && (
              <div className="mb-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900">
                {message}
              </div>
            )}
            <form onSubmit={onSubmit}>
              <div className="mb-5 text-left">
                <label className="block mb-2 text-sm font-medium text-slate-200">CKS ID</label>
                <input
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-600/15 placeholder:text-neutral-500"
                  type="text"
                  autoComplete="username"
                  value={cksId}
                  onChange={(e) => setCksId(e.target.value)}
                  placeholder="MGR-001"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send reset email'}
              </button>
              <div className="flex items-center justify-center pt-3 text-xs text-slate-300">
                <a href="/login" className="transition-colors hover:text-neutral-900 hover:underline">
                  Back to sign in
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
