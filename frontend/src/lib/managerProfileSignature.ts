// Simple manager profile signature helper
// Exports a synchronous deterministic signature generator (DJB2 fallback over JSON)

export type ManagerProfileSignatureInput = {
  subject?: { kind?: string; code?: string; name?: string };
  tabs: { label: string; columns: { key: string; label: string }[] }[];
  activeIndex?: number;
};

export type ManagerProfileSignature = {
  component: 'ManagerProfile';
  subjectKind: string;
  subjectCode: string;
  subjectName: string;
  tabCount: number;
  tabLabels: string[];
  firstTabLabel: string;
  profileTabColumnLabels: string[];
  hash: string;
};

function djb2Hex(str: string) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h & 0xffffffff;
  }
  // convert to unsigned hex with fixed width
  const v = (h >>> 0).toString(16).padStart(8, '0');
  return v;
}

export function computeManagerProfileSignature(input: ManagerProfileSignatureInput): ManagerProfileSignature {
  const subjectKind = (input.subject && input.subject.kind) || '';
  const subjectCode = (input.subject && input.subject.code) || '';
  const subjectName = (input.subject && input.subject.name) || '';

  const tabLabels = (input.tabs || []).map(t => t.label || '');
  const tabCount = tabLabels.length;
  const firstTabLabel = tabLabels[0] || '';

  // profile tab columns
  const profileTab = (input.tabs || []).find(t => String(t.label || '').toLowerCase() === 'profile');
  const profileTabColumnLabels = (profileTab && profileTab.columns) ? profileTab.columns.map(c => c.label || '') : [];

  const minimal = { tabLabels, profileTabColumnLabels, subjectKind, subjectCode };
  const json = JSON.stringify(minimal);

  // Use simple deterministic DJB2 hash over the JSON string. This avoids async crypto and is stable.
  const hash = djb2Hex(json);

  return {
    component: 'ManagerProfile',
    subjectKind,
    subjectCode,
    subjectName,
    tabCount,
    tabLabels,
    firstTabLabel,
    profileTabColumnLabels,
    hash,
  };
}
