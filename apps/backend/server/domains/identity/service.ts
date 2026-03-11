import {
  generatePrefixedId,
  generateScheduleBlockId,
  generateScheduleTaskId,
  normalizeIdentity,
} from './customIdGenerator.js';
import {
  getClerkUserIdByRoleAndCode,
  getHubAccountByClerkId,
  getHubAccountByCode,
  getIdentityContactByRoleAndCode,
  linkClerkUserToAccount,
  unlinkClerkUserFromAccount,
} from './repository.js';
import type { IdentityEntity } from './types.js';

export async function nextIdentityId(entity: IdentityEntity): Promise<string> {
  return generatePrefixedId(entity);
}

export { generateScheduleBlockId, generateScheduleTaskId };

export {
  normalizeIdentity,
  getClerkUserIdByRoleAndCode,
  getHubAccountByClerkId,
  getHubAccountByCode,
  getIdentityContactByRoleAndCode,
  linkClerkUserToAccount,
  unlinkClerkUserFromAccount,
};

export type { HubAccountRecord, HubAccountRole } from './repository.js';
