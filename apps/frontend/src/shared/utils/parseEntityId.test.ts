import { describe, expect, it } from 'vitest';
import { isValidId, parseEntityId } from './parseEntityId';

describe('parseEntityId user id handling', () => {
  it('treats extended user identifiers as user entities when no nested entity token is present', () => {
    const parsed = parseEntityId('CON-001-PRIMARY');
    expect(parsed.type).toBe('user');
    expect(parsed.subtype).toBe('contractor');
    expect(isValidId('CON-001-PRIMARY')).toBe(true);
  });

  it('does not misclassify scoped entity ids as users', () => {
    expect(parseEntityId('CON-001-PO-004').type).toBe('order');
    expect(parseEntityId('CON-001-SO-004').type).toBe('order');
    expect(parseEntityId('CON-001-SRV-004').type).toBe('service');
    expect(parseEntityId('CON-001-RPT-004').type).toBe('report');
  });
});
