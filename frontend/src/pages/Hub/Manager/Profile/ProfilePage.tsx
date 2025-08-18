import React from 'react';
import Card from '../../../../components/ui/Card';
import Skeleton from '../../../../components/Skeleton';
import Page from '../../../../components/Page';
import useMeProfile from '../../../../hooks/useMeProfile';
import { deriveCodeFrom, displayNameFrom } from '../../../../utils/profileCode';

export default function ProfilePage() {
  const state = useMeProfile();
  const code = deriveCodeFrom(state.kind, state.data);
  const name = displayNameFrom(state.kind, state.data) || '—';
  const email = state.data?.email || '—';
  const phone = state.data?.phone || '—';
  const role = state.kind ? state.kind.charAt(0).toUpperCase() + state.kind.slice(1) : 'Manager';
  const center = state.data?.center || state.data?.center_name || '—';

  if (state.loading) return <Page title="Profile"><Skeleton lines={6} /></Page>;
  if (state.error) return <Page title="Profile"><div style={{padding:12, color:'#b91c1c'}}>Error: {state.error}</div></Page>;

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="text-lg font-semibold mb-2">My Profile</div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-ink-500">Name</div>
            <div className="font-medium">{name}</div>
          </div>
          <div>
            <div className="text-ink-500">Email</div>
            <div className="font-medium">{email}</div>
          </div>
          <div>
            <div className="text-ink-500">Role</div>
            <div className="font-medium">{role}</div>
          </div>
          <div>
            <div className="text-ink-500">Center</div>
            <div className="font-medium">{center}</div>
          </div>
          <div>
            <div className="text-ink-500">Manager Code</div>
            <div className="font-medium">{code}</div>
          </div>
          <div>
            <div className="text-ink-500">Phone</div>
            <div className="font-medium">{phone}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
