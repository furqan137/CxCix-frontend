/**
 * Daily video/audio calls. Uses the React Native SDK (same `createCallObject` / `join` model as
 * `@daily-co/daily-js` on web — here we import from `@daily-co/react-native-daily-js`).
 */
import Daily from '@daily-co/react-native-daily-js';
import type { DailyCall } from '@daily-co/react-native-daily-js';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

let callObject: DailyCall | null = null;

export function getCallObject(): DailyCall | null {
  return callObject;
}

export function createCallObject(): DailyCall {
  if (!callObject) {
    callObject = Daily.createCallObject();
  }
  return callObject;
}

export function destroyCallObject(): void {
  if (callObject) {
    try {
      callObject.destroy();
    } catch {
      /* noop */
    }
    callObject = null;
  }
}

export async function requestCallPermissions(): Promise<boolean> {
  try {
    const audio = await Audio.requestPermissionsAsync();
    if (audio.status !== 'granted') {
      return false;
    }
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (cam.status !== 'granted') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
