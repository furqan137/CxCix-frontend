import { Alert, Platform, ToastAndroid } from 'react-native';

/** Lightweight toast: Android uses Toast; iOS falls back to a non-blocking alert-style notice. */
export function showToast(message: string) {
  const m = String(message || '').trim();
  if (!m) return;
  if (Platform.OS === 'android') {
    ToastAndroid.show(m, ToastAndroid.LONG);
  } else {
    Alert.alert('', m);
  }
}
