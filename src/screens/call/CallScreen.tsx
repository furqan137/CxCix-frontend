import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { lazy, Suspense } from 'react';
import {
  ActivityIndicator,
  NativeModules,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MainStackParamList } from '../../navigation/types';

const CallScreenDaily = lazy(() => import('./CallScreenDaily'));

type Props = NativeStackScreenProps<MainStackParamList, 'Call'>;

/** Stock RN WebRTC / Daily’s fork exposes this when the dev client is built with native WebRTC. */
function isCallNativeModuleAvailable() {
  return NativeModules.WebRTCModule != null;
}

function CallRequiresDevBuild({ navigation }: Pick<Props, 'navigation'>) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.missingRoot, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Ionicons name="call-outline" size={48} color="#94a3b8" />
      <Text style={styles.missingTitle}>Install variant without calling</Text>
      <Text style={styles.missingBody}>
        This build does not include the Daily / WebRTC native module. Use a development or production
        build of the CxCix app (Expo Go cannot load it).
      </Text>
      <Text style={styles.missingCode}>npx expo prebuild{'\n'}npx expo run:ios</Text>
      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [styles.missingBtn, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.missingBtnText}>Go back</Text>
      </Pressable>
    </View>
  );
}

/**
 * Do not import `@daily-co/react-native-daily-js` at the top of this file — it will crash
 * Expo Go and any build without native WebRTC. Real UI lives in `CallScreenDaily` (lazy).
 */
export default function CallScreen(props: Props) {
  if (!isCallNativeModuleAvailable()) {
    return <CallRequiresDevBuild navigation={props.navigation} />;
  }
  return (
    <Suspense
      fallback={
        <View style={styles.suspenseRoot}>
          <ActivityIndicator size="large" color="#e2e8f0" />
        </View>
      }
    >
      <CallScreenDaily {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  suspenseRoot: { flex: 1, backgroundColor: '#020617', alignItems: 'center', justifyContent: 'center' },
  missingRoot: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  missingBody: { color: '#94a3b8', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12 },
  missingCode: {
    color: '#cbd5e1',
    fontSize: 13,
    fontFamily: 'Menlo',
    marginTop: 16,
    textAlign: 'center',
  },
  missingBtn: {
    marginTop: 28,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  missingBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
