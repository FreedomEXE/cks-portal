/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/
/**
 * File: cloudinary.ts
 *
 * Description:
 * Cloudinary integration for uploading catalog images (products & services).
 * Uses the Cloudinary Node SDK v2 with upload_stream for buffer-based uploads.
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
}

/**
 * Upload an image buffer to Cloudinary.
 *
 * @param buffer  - Raw file bytes
 * @param options - Folder and public_id overrides
 * @returns The Cloudinary upload response (includes secure_url)
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  options: { folder?: string; publicId?: string } = {},
): Promise<UploadApiResponse> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'cks-catalog',
        public_id: options.publicId,
        resource_type: 'image',
        overwrite: true,
        transformation: [
          { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary returned no result'));
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}
