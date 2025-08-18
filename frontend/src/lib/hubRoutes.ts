// hubRoutes helper removed — placeholder to restore prior state.
export {}; 
// Central helper to construct hub URLs and toggle between schemes A and B.
// Scheme A (default): /:username/hub[/...]
// Scheme B: /hubs/:hubId[/...]
export type HubMode = 'A' | 'B';

let currentMode: HubMode = 'A'; // default to A while admin is completed

export function setHubMode(mode: HubMode) {
  currentMode = mode;
}

export function getHubMode(): HubMode {
  return currentMode;
}

export function normalizeHub(hub: string | undefined | null) {
  return (hub || '').toLowerCase();
}

export function buildHubPath(hub: string, subpath?: string) {
  const id = normalizeHub(hub);
  const tail = subpath ? subpath.replace(/^\/+/, '') : '';
  if (currentMode === 'A') {
    return tail ? `/${id}/hub/${tail}` : `/${id}/hub`;
  }
  // Mode B
  return tail ? `/hubs/${id}/${tail}` : `/hubs/${id}`;
}

export function buildHubPrefix(hub: string) {
  return buildHubPath(hub);
}
