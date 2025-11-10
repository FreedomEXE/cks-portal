import { describe, it, expect } from 'vitest';
import { resolvedUserCode } from '../shared/utils/userCode';

describe('userCode utils', () => {
  it('resolvedUserCode prefers primary and normalizes', () => {
    expect(resolvedUserCode(' abc-123 ', 'zzz')).toBe('ABC-123');
  });

  it('resolvedUserCode falls back and normalizes', () => {
    expect(resolvedUserCode(null, ' mgr-001 ')).toBe('MGR-001');
  });
});
