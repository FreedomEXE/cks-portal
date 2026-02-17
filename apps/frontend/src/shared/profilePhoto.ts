import { saveUserPreferences } from './preferences';
import { canRoleEditWatermark } from './watermark';
import type { WatermarkRole } from './watermark';

type ClerkLikeUser = {
  setProfileImage: (params: { file: File }) => Promise<unknown>;
  reload?: () => Promise<unknown>;
  imageUrl?: string | null;
};

const IMAGE_URL_SYNC_ATTEMPTS = 5;
const IMAGE_URL_SYNC_RETRY_DELAY_MS = 250;

function getNormalizedImageUrl(user: ClerkLikeUser): string {
  return typeof user.imageUrl === 'string' ? user.imageUrl.trim() : '';
}

async function waitForUpdatedImageUrl(user: ClerkLikeUser): Promise<string> {
  let imageUrl = getNormalizedImageUrl(user);
  if (imageUrl) {
    return imageUrl;
  }

  const canReload = typeof user.reload === 'function';
  if (!canReload) {
    return '';
  }

  for (let attempt = 0; attempt < IMAGE_URL_SYNC_ATTEMPTS; attempt += 1) {
    await user.reload?.();
    imageUrl = getNormalizedImageUrl(user);
    if (imageUrl) {
      return imageUrl;
    }
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, IMAGE_URL_SYNC_RETRY_DELAY_MS);
    });
  }

  return '';
}

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
    const nextImageUrl = await waitForUpdatedImageUrl(user);
    if (nextImageUrl) {
      // Save watermark preference (this already emits the change event)
      saveUserPreferences(userCode, { logoWatermarkUrl: nextImageUrl });
    }
  }
}
