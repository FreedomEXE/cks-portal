/**
TRACE
OutboundImports: ../../../components/ProfileTabs, ../../../components/profiles/managerTabs.config
InboundUsedBy: frontend/src/pages/MyProfile.tsx, frontend/src/pages/Hubs/Manager/ManagerHub.tsx
ProvidesData: component props: { data }
ConsumesData: manager_id, name
SideEffects: none
RoleBranching: none
CriticalForManagerProfile: yes (primary manager profile UI)
SimplificationRisk: low (thin wrapper around shared tabs)
*/

/*
  Files in `frontend/src/pages/Hubs/Manager/`:
  - ManagerHub.tsx
  - ManagerProfile.tsx
*/

/*
FilePurpose: Renders the Manager-specific profile view using shared ProfileTabs.

ImportsCategorized:
  UI Components:
    - ProfileTabs (shared tabs renderer)
  Data/Hooks:
    - managerTabsConfig (tabs configuration for manager)
  Utils/Helpers:
    - none
  Styles/Assets:
    - none
RoleSpecificLogic: does it reference non-manager roles? no (only `manager` subject)

  - REMOVE candidates: none (component already manager-scoped)
  
SideEffects: none (no useEffect/localStorage/console debug present)

SuspiciousProps: 
  - `data`: generic prop shape; if it contains multi-role fields this could be a cross-role surface (mark for later audit)

SimplifyKeep:
  - `ProfileTabs` invocation with `managerTabsConfig` and a minimal `subject` ({ kind:'manager', code, name })

SimplifyDrop:
  - any outer wrappers or header card (not used here)
  - any role-guarding logic or viewer-mode branches (none present)

*/

import React, { useEffect, useRef } from "react";
import ProfileTabs from "../../../components/ProfileTabs";
import managerTabsConfig from "../../../components/profiles/managerTabs.config";
import { computeManagerProfileSignature } from "../../../lib/managerProfileSignature";

export default function ManagerProfile({ data }: { data: any }) {
  const lastLoggedRef = useRef<Record<string, boolean>>({});
  if (!data) return null;

  // Handler passed to ProfileTabs; gathers active labels/columns from the tabs component for shadowing
  function handleTabSignature(payload: any) {
    // payload: { tabs, active, activeLabel, columns }
    // Attach this info to window.__mgrProfileLastColumns for debugging if needed
    try {
      (window as any).__mgrProfileLastColumns = payload;
    } catch {}
    }

    useEffect(() => {
    try {
      const signature = computeManagerProfileSignature({
        subject: { kind: 'manager', code: data?.manager_id, name: data?.name },
        tabs: managerTabsConfig,
      });
      try { (window as any).__mgrProfileLast = signature; } catch {}

      // If baseline not present and we have a manager_id, set baseline once
      try {
        const w = window as any;
        if (typeof w.__mgrProfileBaseline === 'undefined' && data?.manager_id) {
          w.__mgrProfileBaseline = signature;
        }
      } catch {}

      // Console.debug once per subjectCode
      const loggedKey = signature.subjectCode || '__no_code__';
      if (!lastLoggedRef.current[loggedKey]) {
        try {
          console.debug('[mgrProfile] signature', { hash: signature.hash, tabCount: signature.tabCount, profileCols: signature.profileTabColumnLabels.length, subjectCode: signature.subjectCode });
        } catch {}
        lastLoggedRef.current[loggedKey] = true;
      }
    } catch (e) {
      try { console.debug('[mgrProfile] signature error', String(e)); } catch {}
    }
  }, [data]);
  return (
    <div data-manager-profile-root>
      {/* No header card per recent requirement; only tabs and table headings */}
      <ProfileTabs
        tabs={managerTabsConfig}
        subject={{ kind: 'manager', code: data?.manager_id, name: data?.name }}
        onSignature={handleTabSignature}
      />
    </div>
  );
}

/*
// UNIFICATION_PLAN

- Collapse duplicates into `SingleProfilePage.tsx` (or `index.tsx`) that accepts a `role` prop and a minimal `subject` shape.
- Replace multi-role branching across hub pages with a manager-only codepath for the Manager hub; keep other hub pages pointing to the unified page.
- Remove override/guess heuristics from `MyProfile` (role override, lastRole fallbacks). Instead, surface explicit params only.
- Move persistence side-effects (localStorage of last role/code) to a dedicated future hook: `usePersistLastManager` (placeholder). Keep a single responsibility: persistence only.
- Keep visual parity: preserve the following visual sections when unifying:
  - Profile header/card (if present in hub-level usage)
+  - Primary tabs (ProfileTabs configured via `managerTabsConfig`)
+  - Tab content areas (reports, assignments, personnel lists)
+
- Identify shared components to reuse (instead of duplicating): `ProfileTabs`, `ProfileCard`, `components/profiles/managerTabs.config`, and `useMeProfile` for fetching context.
+
- Do NOT change runtime logic now; implement the above as a documented plan and migrate incrementally.
+
*/

// MANAGER_TABS_CONFIG_REQUIREMENTS // ExpectedTabIds: Profile, Centers, Crew, Services, Jobs, Training, Performance, Supplies/Equipment // TabHeadings: see managerTabs.config.ts (Profile has Full Name, Reports To, Manager ID, Role, etc.) // MissingOrUnused: none
