
'use server';

import cloudinary from '@/lib/cloudinary';

/**
 * Server Action to upload image to Cloudinary.
 * Receives a base64 encoded string of the compressed image.
 */
export async function uploadToCloudinary(base64Data: string, folder: string) {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Data, {
      folder: `tsss/${folder}`,
      resource_type: 'auto',
    });

    return {
      success: true,
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
    };
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload to Cloudinary',
    };
  }
}
