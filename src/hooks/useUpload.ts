import { useCallback, useState } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { uploadReplyMedia } from '../services/cloudinary';
import type { ReplyMediaItem } from '../api/comments';

export type UploadPhase = 'idle' | 'picking' | 'compressing' | 'uploading' | 'error';

export function useUpload() {
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase('idle');
    setProgress(0);
    setLastError(null);
  }, []);

  /**
   * Pick from library, compress images, upload to Cloudinary via API.
   */
  const pickAndUploadMedia = useCallback(async (): Promise<ReplyMediaItem | null> => {
    setLastError(null);
    setPhase('picking');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPhase('error');
      setLastError('Photo library permission denied');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
      videoMaxDuration: 120,
    });

    if (result.canceled || !result.assets[0]) {
      setPhase('idle');
      return null;
    }

    const asset = result.assets[0];
    const isVideo =
      asset.type === 'video' ||
      (typeof asset.mimeType === 'string' && asset.mimeType.startsWith('video/'));

    let uri = asset.uri;
    let mime = asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
    const nameFromUri = uri.split('/').pop() || (isVideo ? 'clip.mp4' : 'photo.jpg');

    if (!isVideo) {
      setPhase('compressing');
      try {
        const out = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1600 } }],
          { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
        );
        uri = out.uri;
        mime = 'image/jpeg';
      } catch {
        /* use original */
      }
    }

    setPhase('uploading');
    setProgress(0);
    try {
      const uploaded = await uploadReplyMedia(
        { uri, name: nameFromUri, type: mime },
        (p) => setProgress(p),
      );
      setPhase('idle');
      setProgress(0);
      return {
        type: uploaded.resourceType === 'video' ? 'video' : 'image',
        url: uploaded.url,
        publicId: uploaded.publicId,
      };
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : 'Upload failed';
      setPhase('error');
      setLastError(msg);
      setProgress(0);
      return null;
    }
  }, []);

  return { phase, progress, lastError, pickAndUploadMedia, reset };
}
