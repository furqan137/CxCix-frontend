import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import {
  apiGetNotificationSettings,
  apiUpdateNotificationSettings,
  apiUpsertExpoPushToken,
  type NotificationSettings,
} from '../../api/users';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'NotificationsSettings'>;

const PAGE = '#F4F7F9';

async function registerForPushAsync() {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device.');
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') {
    throw new Error('Notification permission not granted.');
  }
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

function Row({
  icon,
  title,
  sub,
  right,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
    >
      <View className="flex-row items-center flex-1 pr-4">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
          <Ionicons name={icon} size={20} color="#2563eb" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[15px] font-semibold text-slate-800">{title}</Text>
          {sub ? <Text className="mt-0.5 text-xs text-slate-500">{sub}</Text> : null}
        </View>
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color="#94a3b8" /> : null)}
    </Pressable>
  );
}

export default function NotificationsSettingsScreen({ navigation }: Props) {
  const [data, setData] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGetNotificationSettings();
      setData(d);
    } catch (e) {
      Alert.alert('Notifications', getApiMessage(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const patch = async (p: Partial<NotificationSettings>, key: string) => {
    setSavingKey(key);
    try {
      const d = await apiUpdateNotificationSettings(p);
      setData(d);
    } catch (e) {
      Alert.alert('Notifications', getApiMessage(e));
    } finally {
      setSavingKey(null);
    }
  };

  const togglePush = async (next: boolean) => {
    if (!data) return;
    if (next) {
      try {
        const token = await registerForPushAsync();
        await apiUpsertExpoPushToken(token);
      } catch (e) {
        Alert.alert('Push Notifications', String((e as Error)?.message || e));
        return;
      }
    }
    await patch({ pushEnabled: next }, 'pushEnabled');
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Notifications</Text>
        <View className="h-10 w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="rounded-3xl bg-white p-4 shadow-sm">
            <Row
              icon="notifications-outline"
              title="Enable Push Notifications"
              right={
                <Switch
                  value={data?.pushEnabled === true}
                  onValueChange={(v) => void togglePush(v)}
                  disabled={savingKey === 'pushEnabled'}
                />
              }
            />
          </View>

          <Text className="mt-5 mb-2 text-sm font-bold text-slate-700">Push Notifications</Text>
          <View className="gap-3">
            <Row
              icon="at-outline"
              title="Mentions"
              sub="Notifications"
              right={
                <Switch
                  value={data?.mentions !== false}
                  onValueChange={(v) => void patch({ mentions: v }, 'mentions')}
                  disabled={savingKey === 'mentions'}
                />
              }
            />
            <Row
              icon="person-add-outline"
              title="Follower Requests"
              sub="Not set"
              right={
                <Switch
                  value={data?.followerRequests !== false}
                  onValueChange={(v) => void patch({ followerRequests: v }, 'followerRequests')}
                  disabled={savingKey === 'followerRequests'}
                />
              }
            />
            <Row
              icon="heart-outline"
              title="Likes"
              sub="Not set"
              right={
                <Switch
                  value={data?.likes !== false}
                  onValueChange={(v) => void patch({ likes: v }, 'likes')}
                  disabled={savingKey === 'likes'}
                />
              }
            />
            <Row
              icon="chatbubble-ellipses-outline"
              title="Comments"
              sub="Not set"
              right={
                <Switch
                  value={data?.comments !== false}
                  onValueChange={(v) => void patch({ comments: v }, 'comments')}
                  disabled={savingKey === 'comments'}
                />
              }
            />
          </View>

          <Text className="mt-5 mb-2 text-sm font-bold text-slate-700">Preferences</Text>
          <View className="gap-3">
            <Row
              icon="volume-high-outline"
              title="In-App Sounds"
              right={
                <Switch
                  value={data?.inAppSounds !== false}
                  onValueChange={(v) => void patch({ inAppSounds: v }, 'inAppSounds')}
                  disabled={savingKey === 'inAppSounds'}
                />
              }
            />
            <Row
              icon="moon-outline"
              title="Quiet Mode"
              sub="Mute push notifications temporarily"
              onPress={() => navigation.navigate('QuietMode')}
            />
            <Row
              icon="settings-outline"
              title="Notification Settings"
              sub="Manage all notification preferences"
              onPress={() => void load()}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

