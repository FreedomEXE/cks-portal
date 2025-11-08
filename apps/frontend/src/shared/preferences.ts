export type UserPreferences = {
  hubTitle?: string;
  defaultLandingTab?: string;
  theme?: 'light' | 'dark';
};

const KEY_PREFIX = 'cks_prefs_';

export function loadUserPreferences(userCode: string | null | undefined): UserPreferences {
  try {
    if (!userCode) return {};
    const raw = window.localStorage.getItem(KEY_PREFIX + userCode.toUpperCase());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function saveUserPreferences(userCode: string | null | undefined, prefs: Partial<UserPreferences>): void {
  try {
    if (!userCode) return;
    const key = KEY_PREFIX + userCode.toUpperCase();
    const current = loadUserPreferences(userCode);
    const next = { ...current, ...prefs } as UserPreferences;
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
}

