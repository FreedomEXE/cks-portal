import { saveUserPreferences } from './preferences';
import { canRoleEditWatermark } from './watermark';
import type { WatermarkRole } from './watermark';

type ClerkLikeUser = {
  setProfileImage: (params: { file: File }) => Promise<unknown>;
  reload?: () => Promise<unknown>;
  imageUrl?: string | null;
};

export async function uploadProfilePhotoAndSyncLogo(
  user: ClerkLikeUser | null | undefined,
  file: File,
  userCode: string | null | undefined,
  role?: WatermarkRole | null,
): Promise<void> {
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Upload profile photo to Clerk
  await user.setProfileImage({ file });

  // Force reload to get new imageUrl
  if (typeof user.reload === 'function') {
    await user.reload();
  }

  // Only sync watermark logo for contractors
  if (canRoleEditWatermark(role)) {
    const nextImageUrl = typeof user.imageUrl === 'string' ? user.imageUrl.trim() : '';
    if (nextImageUrl) {
      // Save watermark preference (this already emits the change event)
      saveUserPreferences(userCode, { logoWatermarkUrl: nextImageUrl });
    }
  }
}
