/**
 * ManagerProfile (migrated from legacy Hubs/Manager)
 * Thin wrapper around ProfileTabs using managerTabs.config
 */
import React, { useEffect, useRef } from 'react';
import ProfileTabs from '../../../../components/ProfileTabs';
import managerTabsConfig from '../../../../components/profiles/managerTabs.config';
import { computeManagerProfileSignature } from '../../../../lib/managerProfileSignature';

export default function ManagerProfile({ data }: { data: any }) {
  const lastLoggedRef = useRef<Record<string, boolean>>({});
  if (!data) return null;

  function handleTabSignature(payload: any) {
    try { (window as any).__mgrProfileLastColumns = payload; } catch {}
  }

  useEffect(() => {
    try {
      const signature = computeManagerProfileSignature({
        subject: { kind: 'manager', code: data?.manager_id, name: data?.name },
        tabs: managerTabsConfig,
      });
      try { (window as any).__mgrProfileLast = signature; } catch {}
      try {
        const w = window as any;
        if (typeof w.__mgrProfileBaseline === 'undefined' && data?.manager_id) {
          w.__mgrProfileBaseline = signature;
        }
      } catch {}
      const loggedKey = signature.subjectCode || '__no_code__';
      if (!lastLoggedRef.current[loggedKey]) {
        try { console.debug('[mgrProfile] signature', { hash: signature.hash, tabCount: signature.tabCount, profileCols: signature.profileTabColumnLabels.length, subjectCode: signature.subjectCode }); } catch {}
        lastLoggedRef.current[loggedKey] = true;
      }
    } catch (e) {
      try { console.debug('[mgrProfile] signature error', String(e)); } catch {}
    }
  }, [data]);

  return (
    <div data-manager-profile-root>
      <ProfileTabs
        tabs={managerTabsConfig}
        subject={{ kind: 'manager', code: data?.manager_id, name: data?.name }}
        data={data}
        onSignature={handleTabSignature}
      />
    </div>
  );
}
