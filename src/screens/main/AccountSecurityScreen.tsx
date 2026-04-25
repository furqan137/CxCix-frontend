import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetMySecurity, type AccountSecurity } from '../../api/users';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'AccountSecurity'>;

const PAGE = '#F4F7F9';

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
    >
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
          <Ionicons name={icon} size={20} color="#2563eb" />
        </View>
        <View className="ml-3">
          <Text className="text-[15px] font-semibold text-slate-800">{label}</Text>
          {value != null ? <Text className="mt-0.5 text-xs text-slate-500">{value}</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
    </Pressable>
  );
}

export default function AccountSecurityScreen({ navigation }: Props) {
  const [data, setData] = useState<AccountSecurity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const d = await apiGetMySecurity();
      setData(d);
    } catch (e) {
      setError(getApiMessage(e));
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

  const emailValue = data?.email?.trim() ? data.email : 'Not set';
  const phoneValue = data?.phone?.trim() ? data.phone : 'Not set';
  const activityValue =
    data?.recentLogins?.[0]?.createdAt
      ? `Last: ${new Date(data.recentLogins[0].createdAt).toLocaleString()}`
      : 'No recent logins';
  const twoFaValue = data?.twoFactorEnabled ? 'Enabled' : 'Disabled';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Account & Security</Text>
        <Pressable
          onPress={() => void load()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="refresh" size={20} color="#334155" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-slate-600">{error}</Text>
          <Pressable onPress={() => void load()} className="mt-4 rounded-full bg-slate-200 px-6 py-3">
            <Text className="font-semibold text-slate-800">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            <Row
              icon="mail-outline"
              label="Email Address"
              value={emailValue}
              onPress={() => navigation.navigate('UpdateEmail')}
            />
            <Row
              icon="call-outline"
              label="Phone Number"
              value={phoneValue}
              onPress={() => navigation.navigate('UpdatePhone')}
            />
            <Row
              icon="key-outline"
              label="Change Password"
              value="Update your password"
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <Row
              icon="shield-checkmark-outline"
              label="Login Activity"
              value={activityValue}
              onPress={() => navigation.navigate('LoginActivity')}
            />
            <Row
              icon="lock-closed-outline"
              label="Two-Factor Authentication"
              value={twoFaValue}
              onPress={() => navigation.navigate('TwoFactor')}
            />
          </View>

          <Text className="mt-6 text-xs text-slate-400">
            Security tip: If you see an unrecognized login, change your password immediately.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

