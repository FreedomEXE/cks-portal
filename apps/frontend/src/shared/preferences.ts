export type UserPreferences = {
  hubTitle?: string;
  defaultLandingTab?: string;
  theme?: 'light' | 'dark' | 'system';
  logoWatermarkUrl?: string;
};

const KEY_PREFIX = 'cks_prefs_';
export const USER_PREFERENCES_EVENT = 'cks:user-preferences-changed';

export type UserPreferencesChangeDetail = {
  userCode: string;
  preferences: UserPreferences;
};

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
    const normalizedCode = userCode.toUpperCase();
    const key = KEY_PREFIX + normalizedCode;
    const current = loadUserPreferences(userCode);
    const next = { ...current, ...prefs } as UserPreferences;
    window.localStorage.setItem(key, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent<UserPreferencesChangeDetail>(USER_PREFERENCES_EVENT, {
        detail: {
          userCode: normalizedCode,
          preferences: next,
        },
      }),
    );
  } catch {
    // ignore
  }
}
