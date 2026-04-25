import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetFaqItem, type FaqItemPayload } from '../../api/help';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'HelpFAQDetail'>;

const PAGE = '#F4F7F9';

export default function HelpFAQDetailScreen({ navigation, route }: Props) {
  const itemId = route.params?.itemId ?? '';
  const [data, setData] = useState<FaqItemPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const d = await apiGetFaqItem(itemId);
      setData(d);
    } catch (e) {
      Alert.alert('Help', getApiMessage(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const openRoute = useMemo(() => data?.deepLinkRoute?.trim() || null, [data?.deepLinkRoute]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Help</Text>
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
      ) : data ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="rounded-3xl bg-white p-5 shadow-sm">
            <Text className="text-lg font-extrabold text-slate-900">{data.question}</Text>
            <Text className="mt-3 text-[15px] leading-6 text-slate-600">{data.answer}</Text>
          </View>

          {openRoute ? (
            <Pressable
              onPress={() => {
                // Navigate within the same main stack by name
                navigation.navigate(openRoute as any);
              }}
              className="mt-4 flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                  <Ionicons name="arrow-forward-circle-outline" size={22} color="#4F46E5" />
                </View>
                <Text className="ml-3 text-[15px] font-semibold text-slate-800">Open in Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </Pressable>
          ) : null}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-slate-600">This article isn’t available.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

