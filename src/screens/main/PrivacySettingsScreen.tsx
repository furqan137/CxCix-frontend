import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetMyPrivacy, apiUpdateMyPrivacy, type PrivacySettings } from '../../api/users';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'PrivacySettings'>;

const PAGE = '#F4F7F9';

function CardRow({
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
      style={{ opacity: onPress ? 1 : 1 }}
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

export default function PrivacySettingsScreen({ navigation }: Props) {
  const [data, setData] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGetMyPrivacy();
      setData(d);
    } catch (e) {
      Alert.alert('Privacy', getApiMessage(e));
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

  const setToggle = async (key: 'isPrivate' | 'showActivityStatus', next: boolean) => {
    if (!data) return;
    setSavingKey(key);
    try {
      const d = await apiUpdateMyPrivacy({ [key]: next } as Partial<PrivacySettings>);
      setData(d);
    } catch (e) {
      Alert.alert('Privacy', getApiMessage(e));
    } finally {
      setSavingKey(null);
    }
  };

  const mentionsLabel =
    data?.mentions === 'everyone' ? 'Everyone' : data?.mentions === 'following' ? 'People I follow' : 'No one';
  const taggingLabel =
    data?.taggingPermissions === 'everyone'
      ? 'Anyone can tag me'
      : data?.taggingPermissions === 'following'
        ? 'People I follow'
        : 'No one';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Privacy Settings</Text>
        <View className="h-10 w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            <CardRow
              icon="lock-closed-outline"
              title="Private Account"
              sub="Only followers can see your posts"
              right={
                <Switch
                  value={data?.isPrivate === true}
                  onValueChange={(v) => void setToggle('isPrivate', v)}
                  disabled={savingKey === 'isPrivate'}
                />
              }
            />
            <CardRow
              icon="pricetag-outline"
              title="Tagging Permissions"
              sub={taggingLabel}
              onPress={() => navigation.navigate('TaggingPermissions')}
            />
            <CardRow
              icon="at-outline"
              title="Activity Status"
              sub="Allow others to see when you were last active"
              right={
                <Switch
                  value={data?.showActivityStatus !== false}
                  onValueChange={(v) => void setToggle('showActivityStatus', v)}
                  disabled={savingKey === 'showActivityStatus'}
                />
              }
            />
            <CardRow
              icon="at-outline"
              title="Mentions"
              sub={mentionsLabel}
              onPress={() => navigation.navigate('MentionsSettings')}
            />
            <CardRow
              icon="link-outline"
              title="Connected Accounts"
              sub={(data?.connectedAccounts?.length || 0) ? `${data?.connectedAccounts.length} connected` : 'None'}
              onPress={() => navigation.navigate('ConnectedAccounts')}
            />
            <CardRow
              icon="cloud-download-outline"
              title="Download Your Data"
              sub="Request a copy of your data"
              onPress={() => navigation.navigate('DownloadData')}
            />
            <CardRow
              icon="trash-outline"
              title="Account Deletion"
              sub="Permanently delete your account"
              onPress={() => navigation.navigate('AccountDeletion')}
            />
          </View>

          <Text className="mt-6 text-xs text-slate-400">
            Private Account is enforced in feeds and profile grids: non-followers won’t see your posts.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

