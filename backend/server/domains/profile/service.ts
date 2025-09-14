import { UserProfile } from './types';
import * as repo from './repository';

export async function getSelfProfile(userId: string): Promise<UserProfile | null> {
  return await repo.getUserProfile(userId);
}

export async function updateSelfProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'user_name' | 'email' | 'template_version'>>
): Promise<UserProfile | null> {
  // Sanitize
  const clean: any = {};
  if (updates.user_name !== undefined) clean.user_name = String(updates.user_name).trim();
  if (updates.email !== undefined) clean.email = updates.email?.toLowerCase() ?? null;
  if (updates.template_version !== undefined) clean.template_version = updates.template_version;

  return await repo.updateUserProfile(userId, clean);
}

