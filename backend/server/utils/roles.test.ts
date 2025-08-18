/// <reference types="jest" />
import { roleFromInternalCode } from './roles';

describe('roleFromInternalCode', () => {
  it('maps admin', () => {
    expect(roleFromInternalCode('000-A')).toBe('admin');
  });
  it('maps crew', () => {
    expect(roleFromInternalCode('A123-A')).toBe('crew');
  });
  it('maps contractor', () => {
    expect(roleFromInternalCode('B1')).toBe('contractor');
  });
  it('maps customer', () => {
    expect(roleFromInternalCode('C9')).toBe('customer');
  });
  it('returns null for unknown', () => {
    expect(roleFromInternalCode('ZZZ')).toBeNull();
  });
});
