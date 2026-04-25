// Legacy `expo-file-system` subpath — read/copy avoid broken default export in SDK 54+.
import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from '../api/client';
import { getStoredToken } from '../api/session';

function isHttpErrorWithResponse(err) {
  return err && typeof err === 'object' && err.response && typeof err.response.status === 'number';
}

const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // user-facing cap for DMs
const MAX_FILE_BYTES = 25 * 1024 * 1024; // match server multer

function pickExt(mimeType, fallback = 'bin') {
  if (!mimeType || typeof mimeType !== 'string') return fallback;
  if (mimeType.includes('gif')) return 'gif';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac')) return 'm4a';
  if (mimeType.includes('pdf')) return 'pdf';
  const semi = mimeType.split('/')[1];
  if (semi && semi.length < 8) return semi.replace('+xml', '').replace(/\W/g, '') || fallback;
  return fallback;
}

function extFromUriOrMime(localUri, mimeType) {
  if (typeof localUri === 'string') {
    const m = /(\.[a-z0-9]{1,6})(?:\?|#|$)/i.exec(localUri);
    if (m) return m[1].replace(/^\./, '').toLowerCase();
  }
  return pickExt(mimeType, 'bin');
}

/**
 * Copy ph://, content://, or iCloud paths into app cache as file:// for RN FormData.
 * @param {string} localUri
 * @param {string} [mimeType]
 * @returns {Promise<string>}
 */
async function copyToCacheForUploadIfNeeded(localUri, mimeType) {
  if (!localUri) return localUri;
  const base = FileSystem.cacheDirectory;
  if (!base) return localUri;
  const low = localUri.toLowerCase();
  if (low.startsWith('file:')) {
    return localUri;
  }
  const ext = extFromUriOrMime(localUri, mimeType);
  const dest = `${base}chat_in_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  try {
    await FileSystem.copyAsync({ from: localUri, to: dest });
    return dest;
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[chatUpload] copy to cache (will try direct URI):', e);
    }
  }
  return localUri;
}

/**
 * @param {string} chatId
 * @param {string} localUri
 * @param {string} [mimeType]
 * @param {string} [fileExt]
 * @param {{ base64?: string }} [options] — if set, materialize a temp file in cache (rare; prefer file URIs)
 * @returns {Promise<string>} Cloudinary `secure_url` from API
 */
export async function uploadChatMedia(_chatId, localUri, mimeType, fileExt, options) {
  const token = await getStoredToken();
  if (!token) {
    throw new Error('Sign in to send media. Open your account and try again.');
  }

  const inlineB64 = options && typeof options.base64 === 'string' ? options.base64.trim() : '';
  if (!inlineB64) {
    if (!localUri || typeof localUri !== 'string') {
      throw new Error('Invalid file path');
    }
  }

  const ext = (fileExt && fileExt.replace(/^\./, '')) || pickExt(mimeType, 'bin');
  let workUri = localUri;
  let contentType =
    mimeType ||
    (ext === 'm4a' || ext === 'mp3' ? 'audio/m4a' : ext === 'mp4' ? 'video/mp4' : 'application/octet-stream');

  if (inlineB64) {
    const base = FileSystem.cacheDirectory;
    if (!base) {
      throw new Error('Storage cache unavailable. Restart the app and try again.');
    }
    workUri = `${base}chat_b64_${Date.now()}.${ext}`;
    await FileSystem.writeAsStringAsync(workUri, inlineB64, { encoding: 'base64' });
    if (!mimeType) {
      if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'm4a') contentType = 'audio/m4a';
    }
  } else {
    workUri = await copyToCacheForUploadIfNeeded(workUri, contentType);
  }

  let info;
  try {
    info = await FileSystem.getInfoAsync(workUri, { size: true });
  } catch {
    info = { exists: true, size: 0, isDirectory: false };
  }
  const fileSize = typeof info.size === 'number' ? info.size : 0;
  if (fileSize > MAX_FILE_BYTES) {
    throw new Error('File is too large (max 25 MB).');
  }
  if (String(contentType).toLowerCase().startsWith('video/') && fileSize > MAX_VIDEO_BYTES) {
    throw new Error('Video is too large (max 20 MB). Try a shorter clip or lower quality.');
  }

  const name = `cxcix_${Date.now()}.${ext}`;
  const form = new FormData();
  form.append('file', {
    uri: workUri,
    name,
    type: contentType,
  });

  const { data } = await apiClient.post('/users/me/chat-media', form, {
    timeout: 120_000,
  });
  const url = data && data.data && data.data.url;
  if (typeof url !== 'string' || !url) {
    throw new Error('Upload did not return a URL. Try again.');
  }
  return url;
}

/**
 * @param {unknown} err
 * @returns {string}
 */
export function getChatMediaUploadErrorMessage(err) {
  if (isHttpErrorWithResponse(err)) {
    const { status, data: d } = err.response;
    const message =
      d && (typeof d.message === 'string' ? d.message : Array.isArray(d?.message) ? d.message[0] : null);
    if (status === 401) {
      return 'Sign in to send media. Open your account and try again.';
    }
    if (status === 413) {
      return 'File is too large for the server. Try a smaller file.';
    }
    if (status === 400 && message) {
      return String(message);
    }
    if (status === 502) {
      return message
        ? `Upload failed: ${String(message)}`
        : 'Media service unavailable. Check Cloudinary API keys on the server.';
    }
  }

  const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
  const msg = err instanceof Error ? err.message : String(err || '');

  if (code === 'ECONNABORTED' || (msg && msg.toLowerCase().includes('timeout'))) {
    return 'Upload timed out. Check your connection or try a smaller file.';
  }
  if (code === 'ERR_NETWORK' || (msg && msg.toLowerCase().includes('network'))) {
    return 'Network error. Check your connection and try again.';
  }
  if (
    msg &&
    msg.length < 200 &&
    (msg.startsWith('Sign in') || msg.startsWith('Invalid file') || msg.startsWith('File is too large'))
  ) {
    return msg;
  }
  if (
    msg &&
    msg.length < 200 &&
    (msg.startsWith('Video is too large') || msg.startsWith('Storage cache'))
  ) {
    return msg;
  }
  if (__DEV__ && msg) {
    return `${msg} (${code || 'error'})`;
  }
  return 'Could not upload this file. Try again or use a smaller file.';
}
