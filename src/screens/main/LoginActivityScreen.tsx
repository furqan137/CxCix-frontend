import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetMySecurity, type LoginActivityRow } from '../../api/users';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'LoginActivity'>;

const PAGE = '#F4F7F9';

function friendlyDevice(row: LoginActivityRow) {
  const bits = [row.device?.trim(), row.platform?.trim()].filter(Boolean);
  return bits.length ? bits.join(' · ') : 'Device';
}

export default function LoginActivityScreen({ navigation }: Props) {
  const [rows, setRows] = useState<LoginActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const d = await apiGetMySecurity();
      setRows(d.recentLogins || []);
    } catch (e) {
      setError(getApiMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Login Activity</Text>
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
      ) : rows.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-slate-600">No login activity yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            {rows.map((r) => {
              const when = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
              const ua = r.userAgent?.trim() ? r.userAgent.trim().slice(0, 90) : '';
              return (
                <View key={r.id} className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-start">
                      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                        <Ionicons name="shield-checkmark-outline" size={20} color="#4F46E5" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-[15px] font-bold text-slate-900">{friendlyDevice(r)}</Text>
                        <Text className="mt-0.5 text-xs text-slate-500">{when}</Text>
                      </View>
                    </View>
                    <Text className="text-xs font-semibold text-slate-500">{r.ip || '—'}</Text>
                  </View>
                  {ua ? <Text className="mt-2 text-xs text-slate-400">{ua}</Text> : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

