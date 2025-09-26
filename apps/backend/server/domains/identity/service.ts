import { generatePrefixedId, normalizeIdentity } from './customIdGenerator';
import { getHubAccountByClerkId, getHubAccountByCode } from './repository';
import type { IdentityEntity } from './types';

export async function nextIdentityId(entity: IdentityEntity): Promise<string> {
  return generatePrefixedId(entity);
}

export {
  normalizeIdentity,
  getHubAccountByClerkId,
  getHubAccountByCode,
};

export type { HubAccountRecord, HubAccountRole } from './repository';
