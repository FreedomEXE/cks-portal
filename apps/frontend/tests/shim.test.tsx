import { describe, expect, it } from 'vitest';

import { useSyncExternalStore } from '../src/shims/useSyncExternalStore';

describe('useSyncExternalStore shim', () => {
  it('provides a function export', () => {
    expect(typeof useSyncExternalStore).toBe('function');
  });
});
