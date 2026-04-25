import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiMessage } from '../../api/auth';
import { apiGetAiLabels, type AILabelRow } from '../../api/ai';
import type { MainStackParamList } from '../../navigation/types';

const PAGE = '#F4F7F9';

const ICON_BG: Record<AILabelRow['icon'], string> = {
  heart: '#DCFCE7',
  chat: '#E0E7FF',
  help: '#E0F2FE',
  add: '#FEF3C7',
  refresh: '#E2E8F0',
  flame: '#FFE4E6',
  crown: '#FEF3C7',
};

const ICON_COLOR: Record<AILabelRow['icon'], string> = {
  heart: '#16A34A',
  chat: '#6366F1',
  help: '#0284C7',
  add: '#A16207',
  refresh: '#334155',
  flame: '#E11D48',
  crown: '#A16207',
};

function iconName(k: AILabelRow['icon']): React.ComponentProps<typeof Ionicons>['name'] {
  switch (k) {
    case 'heart':
      return 'heart';
    case 'chat':
      return 'chatbubble-ellipses';
    case 'help':
      return 'help-circle';
    case 'add':
      return 'add';
    case 'refresh':
      return 'refresh';
    case 'flame':
      return 'flame';
    case 'crown':
      return 'ribbon';
  }
}

export default function AILabelsScreen() {
  const navigation = useNavigation();
  const [note, setNote] = useState('');
  const [labels, setLabels] = useState<AILabelRow[]>([]);
  const [learnMoreTitle, setLearnMoreTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiGetAiLabels();
      setNote(res.note);
      setLabels(res.labels || []);
      setLearnMoreTitle(res.learnMore?.title ?? null);
    } catch (e) {
      setError(getApiMessage(e));
      setNote('');
      setLabels([]);
      setLearnMoreTitle(null);
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
          onPress={() => (navigation as any).goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">AI Labels & Explanations</Text>
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
          <View className="rounded-3xl bg-white p-4 shadow-sm">
            <View className="flex-row items-start">
              <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                <Ionicons name="bulb-outline" size={20} color="#6366F1" />
              </View>
              <Text className="ml-3 flex-1 text-sm leading-6 text-slate-600">
                <Text className="font-bold text-slate-900">Note:</Text> {note}
              </Text>
            </View>
          </View>

          <View className="mt-4 gap-3">
            {labels.map((l) => (
              <View key={l.key} className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm">
                <View className="flex-row items-center flex-1 pr-4">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: ICON_BG[l.icon] }}
                  >
                    <Ionicons name={iconName(l.icon)} size={20} color={ICON_COLOR[l.icon]} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] font-bold text-slate-900">{l.title}</Text>
                    <Text className="mt-0.5 text-xs text-slate-500">{l.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </View>
            ))}
          </View>

          {learnMoreTitle ? (
            <Pressable
              onPress={() => stackNav()?.navigate('AIModeratorInsights')}
              className="mt-6 items-center"
            >
              <View className="overflow-hidden rounded-full">
                <LinearGradient
                  colors={['#6C63FF', '#F5A623']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ paddingHorizontal: 18, paddingVertical: 12 }}
                >
                  <Text className="text-sm font-bold text-white">{learnMoreTitle} →</Text>
                </LinearGradient>
              </View>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

