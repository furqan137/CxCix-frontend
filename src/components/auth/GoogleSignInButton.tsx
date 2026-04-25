import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  label?: string;
  disabled?: boolean;
  onIdToken: (idToken: string) => void;
  onError?: (message: string) => void;
};

function GoogleSignInButtonInner({
  label = 'Continue with Google',
  disabled,
  onIdToken,
  onError,
  webClientId,
  iosClientId,
  androidClientId,
}: Props & {
  webClientId: string;
  iosClientId?: string;
  androidClientId?: string;
}) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    iosClientId: iosClientId || undefined,
    androidClientId: androidClientId || undefined,
  });

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (response?.type === 'success') {
      const id = response.params?.id_token;
      if (id) {
        onIdToken(id);
      } else {
        onError?.('Google did not return an ID token. Check OAuth client IDs.');
      }
      setBusy(false);
    } else if (response?.type === 'error') {
      onError?.(response.error?.message ?? 'Google sign-in failed');
      setBusy(false);
    } else if (response?.type === 'dismiss') {
      setBusy(false);
    }
  }, [response, onIdToken, onError]);

  return (
    <Pressable
      disabled={disabled || !request || busy}
      onPress={() => {
        setBusy(true);
        void promptAsync();
      }}
      className="flex-row items-center justify-center rounded-full border border-slate-200 bg-white py-3.5 active:opacity-80"
    >
      <View className="flex-row items-center gap-2">
        {busy ? <ActivityIndicator /> : <Text className="text-lg font-bold text-slate-700">G</Text>}
        <Text className="text-base font-semibold text-slate-800">{label}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Google OAuth → ID token for Firebase. Requires `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
 */
export function GoogleSignInButton(props: Props) {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  if (!webClientId) {
    return null;
  }

  return (
    <GoogleSignInButtonInner
      {...props}
      webClientId={webClientId}
      iosClientId={iosClientId}
      androidClientId={androidClientId}
    />
  );
}
