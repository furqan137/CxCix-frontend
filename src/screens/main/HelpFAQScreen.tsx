import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetFaqIndex, type FaqIndexPayload } from '../../api/help';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'HelpFAQ'>;

const PAGE = '#F4F7F9';

export default function HelpFAQScreen({ navigation }: Props) {
  const [data, setData] = useState<FaqIndexPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGetFaqIndex();
      setData(d);
    } catch (e) {
      Alert.alert('Help', getApiMessage(e));
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

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">{data?.title?.trim() || 'Help'}</Text>
        <Pressable onPress={() => void load()} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
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
            <Text className="text-lg font-extrabold text-slate-900">{data.introTitle}</Text>
            <Text className="mt-3 text-[15px] leading-6 text-slate-600">{data.introBody}</Text>
          </View>

          {data.sections.map((section) => (
            <View key={section.id} className="mt-6">
              <Text className="mb-2 text-sm font-bold text-slate-700">{section.title}</Text>
              <Text className="mb-3 text-xs text-slate-500">{section.subtitle}</Text>
              <View className="gap-3">
                {section.items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => navigation.navigate('HelpFAQDetail', { itemId: item.id })}
                    className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm"
                  >
                    <View className="flex-row items-center flex-1 pr-2">
                      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                        <Ionicons
                          name={section.icon as ComponentProps<typeof Ionicons>['name']}
                          size={20}
                          color="#2563eb"
                        />
                      </View>
                      <Text className="ml-3 flex-1 text-[15px] font-semibold text-slate-800">{item.q}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-slate-600">Help isn’t available right now.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
