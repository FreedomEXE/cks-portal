import { generatePrefixedId, normalizeIdentity } from './customIdGenerator';
import { getClerkUserIdByRoleAndCode, getHubAccountByClerkId, getHubAccountByCode } from './repository';
import type { IdentityEntity } from './types';

export async function nextIdentityId(entity: IdentityEntity): Promise<string> {
  return generatePrefixedId(entity);
}

export {
  normalizeIdentity,
  getClerkUserIdByRoleAndCode,
  getHubAccountByClerkId,
  getHubAccountByCode,
};

export type { HubAccountRecord, HubAccountRole } from './repository';
