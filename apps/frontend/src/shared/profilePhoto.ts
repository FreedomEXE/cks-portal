import { saveUserPreferences } from './preferences';

type ClerkLikeUser = {
  setProfileImage: (params: { file: File }) => Promise<unknown>;
  reload?: () => Promise<unknown>;
  imageUrl?: string | null;
};

export async function uploadProfilePhotoAndSyncLogo(
  user: ClerkLikeUser | null | undefined,
  file: File,
  userCode: string | null | undefined,
): Promise<void> {
  if (!user) {
    throw new Error('User not authenticated');
  }

  await user.setProfileImage({ file });
  if (typeof user.reload === 'function') {
    await user.reload();
  }

  const nextImageUrl = typeof user.imageUrl === 'string' ? user.imageUrl.trim() : '';
  if (nextImageUrl) {
    saveUserPreferences(userCode, { logoWatermarkUrl: nextImageUrl });
  }
}

