import { apiClient } from '../api/client';

export type CloudinaryReplyUploadResult = {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
};

/**
 * Upload reply media via backend → Cloudinary (`cxcix/replies`).
 */
export async function uploadReplyMedia(
  file: { uri: string; name: string; type: string },
  onProgress?: (fraction: number) => void,
): Promise<CloudinaryReplyUploadResult> {
  const form = new FormData();
  form.append('file', file as unknown as Blob);
  const { data } = await apiClient.post<{ success: boolean; data: CloudinaryReplyUploadResult }>(
    '/media/reply-upload',
    form,
    {
      timeout: 120_000,
      onUploadProgress: (ev) => {
        const t = ev.total || 0;
        if (t > 0 && onProgress) onProgress(Math.min(1, ev.loaded / t));
      },
    },
  );
  return data.data;
}
