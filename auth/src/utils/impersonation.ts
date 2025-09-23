const ROLE_PREFIXES: Record<string, string> = {
  ADM: 'admin',
  ADMIN: 'admin',
  MGR: 'manager',
  MAN: 'manager',
  CON: 'contractor',
  CUS: 'customer',
  CTR: 'center',
  CEN: 'center',
  CRW: 'crew',
  CRE: 'crew',
  WHS: 'warehouse',
  WH: 'warehouse',
};

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch (error) {
    console.warn('[impersonation] sessionStorage unavailable', error);
    return null;
  }
}

export function normalizeImpersonationCode(input: string | null | undefined): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toUpperCase();
}

export function extractFirstName(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const [first] = trimmed.split(/\s+/);
  return first || null;
}

export function inferRoleFromIdentifier(identifier: string | null | undefined, explicit?: string | null): string | null {
  const hinted = typeof explicit === 'string' ? explicit.trim().toLowerCase() : null;
  if (hinted) {
    return hinted;
  }

  const normalized = normalizeImpersonationCode(identifier);
  if (!normalized) {
    return null;
  }

  const alphaPrefixMatch = normalized.match(/^([A-Z]+)/);
  if (!alphaPrefixMatch) {
    return null;
  }

  const alphaPrefix = alphaPrefixMatch[1];
  if (ROLE_PREFIXES[alphaPrefix]) {
    return ROLE_PREFIXES[alphaPrefix];
  }

  const firstThree = alphaPrefix.slice(0, 3);
  if (ROLE_PREFIXES[firstThree]) {
    return ROLE_PREFIXES[firstThree];
  }

  return null;
}

export type ImpersonationPayload = {
  code: string;
  role?: string | null;
  displayName?: string | null;
  firstName?: string | null;
};

export type ImpersonationSnapshot = {
  isActive: boolean;
  code: string | null;
  role: string | null;
  displayName: string | null;
  firstName: string | null;
};

const SESSION_KEYS = ['impersonate', 'role', 'code', 'impersonate:firstName', 'impersonate:displayName'] as const;

export function persistImpersonation(payload: ImpersonationPayload): boolean {
  const storage = getSessionStorage();
  if (!storage) {
    return false;
  }

  const code = normalizeImpersonationCode(payload.code);
  if (!code) {
    return false;
  }

  const role = inferRoleFromIdentifier(code, payload.role);
  if (!role) {
    return false;
  }

  const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : null;
  const firstName = typeof payload.firstName === 'string' && payload.firstName.trim()
    ? payload.firstName.trim()
    : extractFirstName(displayName);

  try {
    storage.setItem('impersonate', 'true');
    storage.setItem('code', code);
    storage.setItem('role', role);

    if (displayName) {
      storage.setItem('impersonate:displayName', displayName);
    } else {
      storage.removeItem('impersonate:displayName');
    }

    if (firstName) {
      storage.setItem('impersonate:firstName', firstName);
    } else {
      storage.removeItem('impersonate:firstName');
    }

    return true;
  } catch (error) {
    console.warn('[impersonation] Failed to persist session', error);
    return false;
  }
}

export function clearImpersonation(): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  try {
    for (const key of SESSION_KEYS) {
      storage.removeItem(key);
    }
  } catch (error) {
    console.warn('[impersonation] Failed to clear session', error);
  }
}

export function readImpersonation(): ImpersonationSnapshot {
  const storage = getSessionStorage();
  if (!storage) {
    return {
      isActive: false,
      code: null,
      role: null,
      displayName: null,
      firstName: null,
    };
  }

  try {
    const isActive = storage.getItem('impersonate') === 'true';
    if (!isActive) {
      return {
        isActive: false,
        code: null,
        role: null,
        displayName: null,
        firstName: null,
      };
    }

    const code = storage.getItem('code');
    const role = storage.getItem('role');
    const displayName = storage.getItem('impersonate:displayName');
    const firstName = storage.getItem('impersonate:firstName');

    return {
      isActive: true,
      code: code ?? null,
      role: role ? role.toLowerCase() : null,
      displayName: displayName ?? null,
      firstName: firstName ?? extractFirstName(displayName),
    };
  } catch (error) {
    console.warn('[impersonation] Failed to read session', error);
    return {
      isActive: false,
      code: null,
      role: null,
      displayName: null,
      firstName: null,
    };
  }
}

export function getCodeFromPath(pathname: string): string | null {
  if (typeof pathname !== 'string') {
    return null;
  }
  const match = pathname.match(/^\/([^\/]*)\/hub\/?$/i);
  if (!match || !match[1]) {
    return null;
  }
  const decoded = (() => {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  })();
  return normalizeImpersonationCode(decoded);
}

export function isImpersonationPath(pathname: string): boolean {
  return getCodeFromPath(pathname) !== null;
}
