import { generatePrefixedId, normalizeIdentity } from './customIdGenerator';
import type { IdentityEntity } from './types';

export async function nextIdentityId(entity: IdentityEntity): Promise<string> {
  return generatePrefixedId(entity);
}

export { normalizeIdentity };
