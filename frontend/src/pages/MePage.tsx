/**
 * MePage.tsx
 *
 * Bootstraps the signed-in user's link state and shows either a link prompt
 * or their live profile card with a button to go to their Hub.
 */
import { useEffect, useState } from 'react';
import { useUser } from '../lib/auth';
import Page from '../components/Page';
import ProfileCard from '../components/ProfileCard';
import { buildUrl, apiFetch } from '../lib/apiBase';

type BootState = { loading: boolean; linked: boolean; role?: string; internal_code?: string; error?: string };

export default function MePage() {
  const { user } = useUser();
  const [boot, setBoot] = useState<BootState>({ loading: true, linked: false });
  const [profile, setProfile] = useState<{ kind: string; data: any } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setBoot({ loading: true, linked: false });
  const headers: Record<string, string> = {};
  if (user?.id) headers['x-user-id'] = user.id;
  if (user?.primaryEmailAddress?.emailAddress) headers['x-user-email'] = user.primaryEmailAddress.emailAddress;
  const r = await apiFetch(buildUrl('/me/bootstrap'), { headers });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Bootstrap failed');
        if (!j.linked) {
          setBoot({ loading: false, linked: false });
          return;
        }
        setBoot({ loading: false, linked: true, role: j.role, internal_code: j.internal_code });
        // Fetch profile
  const p = await apiFetch(buildUrl('/me/profile'), { headers });
        const pj = await p.json();
        if (!p.ok) throw new Error(pj.error || 'Profile fetch failed');
        setProfile(pj);
      } catch (e: any) {
        setBoot({ loading: false, linked: false, error: String(e?.message || e) });
      }
    })();
  }, [user?.id]);

  if (boot.loading) return <Page title="My Profile"><div>Loading…</div></Page>;
  if (boot.error) return <Page title="My Profile"><div className="text-red-600">{boot.error}</div></Page>;

  if (!boot.linked) {
    return (
      <Page title="Link your account">
        <div className="space-y-3">
          <p>Your account isn’t linked to a CKS ID yet.</p>
          <a className="inline-block border rounded px-4 py-2 bg-gray-900 text-white" href="/link">Link now</a>
        </div>
      </Page>
    );
  }

  return (
    <Page title="My Profile">
      {profile ? (
        <div>
          <ProfileCard kind={profile.kind} data={profile.data} />
          <div className="mt-6">
            <a className="inline-block border rounded px-4 py-2" href="/hub">Go to my Hub</a>
          </div>
        </div>
      ) : (
        <div>Loading profile…</div>
      )}
    </Page>
  );
}
