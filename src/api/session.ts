import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'cxcix_access_token';

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (!token) {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
