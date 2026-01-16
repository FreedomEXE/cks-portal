/**
 * Test Setup - Polyfills and Mocks
 *
 * Provides browser APIs and service mocks for test environment.
 * Unblocks App.test.tsx and other component tests that depend on:
 * - fetch API
 * - sessionStorage
 * - LoadingService
 * - Feature flags
 */

import { vi } from 'vitest';

// ============================================================================
// Polyfill: global.fetch
// ============================================================================

if (!global.fetch) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ data: {}, success: true }),
      text: async () => '',
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      headers: new Headers(),
      redirected: false,
      type: 'basic',
      url: '',
      clone: function() { return this; },
      body: null,
      bodyUsed: false
    } as Response)
  ) as any;
}

// ============================================================================
// Polyfill: window.sessionStorage
// ============================================================================

if (typeof window !== 'undefined' && !window.sessionStorage) {
  const storage = new Map<string, string>();

  (window as any).sessionStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size;
    }
  };
}

// In-memory storage for Node environment (non-browser tests)
if (!global.sessionStorage) {
  const storage = new Map<string, string>();

  (global as any).sessionStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size;
    }
  };
}

// ============================================================================
// Mock: LoadingService
// ============================================================================

vi.mock('../services/LoadingService', () => ({
  LoadingService: {
    show: vi.fn(),
    hide: vi.fn(),
    isLoading: vi.fn(() => false),
    cleanup: vi.fn()
  }
}));

// ============================================================================
// Mock: Clerk Authentication
// ============================================================================

vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    isSignedIn: true,
    userId: 'user_test',
    getToken: async () => 'TEST_TOKEN',
    signOut: vi.fn(),
  }),
  useClerk: () => ({
    signOut: vi.fn(),
  }),
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: vi.fn(async () => ({ status: 'complete', createdSessionId: 'test_session' })),
    },
    setActive: vi.fn(),
  }),
  useUser: () => ({
    user: {
      id: 'user_test',
      fullName: 'Test User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
  }),
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
}));

// ============================================================================
// Feature Flags (Stable Path for Tests)
// ============================================================================

// Set to false for stable legacy behavior in tests
// Or set to true to test ID_FIRST_MODALS code paths
process.env.ID_FIRST_MODALS = 'false';
process.env.SERVICE_DETAIL_FETCH = 'false';

// ============================================================================
// Console Suppression (Optional)
// ============================================================================

// Suppress expected warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Suppress React SSR warnings in tests
  if (args[0]?.includes('useLayoutEffect')) {
    return;
  }
  // Suppress entity catalog unknown ID warnings in tests
  if (args[0]?.includes('[EntityCatalog]')) {
    return;
  }
  originalWarn(...args);
};

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Helper: Reset all mocks between tests
 */
export function resetAllMocks() {
  vi.clearAllMocks();
  if (global.sessionStorage) {
    (global.sessionStorage as any).clear();
  }
}

/**
 * Helper: Set feature flag for specific test
 */
export function setFeatureFlag(flag: string, value: boolean) {
  process.env[flag] = value ? 'true' : 'false';
}

/**
 * Helper: Mock successful API response
 */
export function mockApiSuccess(data: any) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({ data, success: true }),
  });
}

/**
 * Helper: Mock API error
 */
export function mockApiError(status: number, message: string) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ error: message, success: false }),
  });
}
