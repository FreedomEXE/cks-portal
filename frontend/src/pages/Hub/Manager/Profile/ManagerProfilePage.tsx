import React from 'react';
import Page from '../../../../components/Page';
import { useUser } from '@clerk/clerk-react';
import useMeProfile from '../../../../hooks/useMeProfile';
import ManagerProfile from './ManagerProfile';
import UserWidget from '../../../../components/UserWidget';

// Internal lightweight adapter to ensure we only show loading until we have (or stub) manager data
function useManagerProfilePageData() {
  try {
    const base: any = (typeof useMeProfile === 'function') ? useMeProfile() : { loading: true };
    const roleKind = (base?.kind || base?.data?.role || '').toLowerCase();
    const hasManagerData = roleKind === 'manager' && !!(base?.data?.manager_id || base?.data?.name);
    return { loading: base?.loading && !hasManagerData, error: base?.error, data: hasManagerData ? base?.data : null };
  } catch (e) {
    return { loading: false, error: String(e), data: null };
  }
}

export default function ManagerProfilePage() {
  const { user } = useUser();
  const state = useManagerProfilePageData();
  const data: any = state.data || {
    role: 'manager',
    kind: 'manager',
    manager_id: 'stub-mgr',
    name: user?.fullName || (user as any)?.firstName || 'Manager (Local Stub)',
    _stub: true
  };
  try { console.debug('[ManagerProfilePage]', { hasReal: !data._stub, stub: !!data._stub, loading: state.loading, error: !!state.error }); } catch {}
  return (
    <Page title="My Profile" right={<UserWidget />}> 
      {state.error && !data._stub ? <div style={{color:'#b91c1c'}}>Error: {state.error}</div> : null}
      {data._stub ? (
        <div style={{marginBottom:12,fontSize:12,color:'#92400e',background:'#fef3c7',padding:8,borderRadius:6}}>
          Profile data unavailable (404). Using temporary stub.
        </div>
      ) : null}
      <ManagerProfile data={data} />
    </Page>
  );
}
