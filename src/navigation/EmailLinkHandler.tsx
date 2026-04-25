import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';

import { trySignInWithEmailLinkFromIncomingUrl, PENDING_LINK_EMAIL_KEY } from '../services/firebaseAuth';
import { navigationRef } from './navigationRef';

/**
 * Completes **Firebase** email-link (passwordless) when the app opens a link.
 */
export function EmailLinkHandler() {
  useEffect(() => {
    const finish = async (url: string) => {
      const email = (await SecureStore.getItemAsync(PENDING_LINK_EMAIL_KEY)) ?? '';
      if (!email) {
        Alert.alert(
          'Email',
          'We could not match this link to a pending sign-up. Use the same device where you tapped “Send verification link”.',
        );
        return;
      }
      try {
        const ok = await trySignInWithEmailLinkFromIncomingUrl(email, url);
        if (ok && navigationRef.isReady()) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'CheckEmail', params: { email, linkOpened: true } }],
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Sign-in failed';
        Alert.alert('Email link', msg);
      }
    };

    void Linking.getInitialURL().then((u) => {
      if (u) void finish(u);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      void finish(url);
    });
    return () => sub.remove();
  }, []);

  return null;
}
