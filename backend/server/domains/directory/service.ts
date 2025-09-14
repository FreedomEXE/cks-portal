import { DirectoryItemBase, DirectoryQuery } from './types';
import * as repo from './repository';

export async function list(
  userId: string,
  scope: 'global'|'ecosystem',
  roleCode: string,
  query: DirectoryQuery
): Promise<DirectoryItemBase[]> {
  // Basic sanitize
  const q: DirectoryQuery = {
    ...query,
    page: Math.max(1, query.page || 1),
    limit: Math.min(Math.max(query.limit || 25, 1), 200)
  };
  return await repo.listDirectory(userId, scope, roleCode, q);
}

