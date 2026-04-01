import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOOD_LABELS, MOODS, type MoodId } from '../../constants/moods';
import type { MainStackParamList } from '../../navigation/types';
import { useBookmarksStore } from '../../store/useBookmarksStore';

type Props = NativeStackScreenProps<MainStackParamList, 'Saved'>;

const PAGE = '#F5F7F9';

function MoodRowIcon({ mood }: { mood: MoodId }) {
  const common = { size: 20, color: '#334155' } as const;
  switch (mood) {
    case 'calm':
      return <Ionicons name="flower-outline" {...common} />;
    case 'serious':
      return <Ionicons name="book-outline" {...common} />;
    case 'creative':
      return <Ionicons name="color-palette-outline" {...common} />;
    case 'satire':
      return <Ionicons name="happy-outline" {...common} />;
    case 'debate':
      return <Ionicons name="chatbubbles-outline" {...common} />;
    case 'vawulence':
      return <Ionicons name="flame-outline" {...common} />;
  }
}

/**
 * Saved — bookmark collections by mood (accordion) + sample preview.
 */
export default function SavedScreen({ navigation }: Props) {
  const items = useBookmarksStore((s) => s.items);
  const [openMood, setOpenMood] = useState<MoodId>('serious');

  const counts = useMemo(() => {
    const base: Record<MoodId, number> = {
      calm: 14,
      serious: 4,
      creative: 9,
      satire: 5,
      debate: 3,
      vawulence: 14,
    };
    for (const m of MOODS) {
      const extra = items.filter((x) => x.mood === m).length;
      base[m] = Math.max(base[m], extra);
    }
    return base;
  }, [items]);

  const seriousPreview = items.find((x) => x.mood === 'serious');

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Saved</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="mb-3 text-base font-semibold text-slate-800">
          Your bookmark collections
        </Text>

        <View className="overflow-hidden rounded-3xl bg-white shadow-sm">
          {MOODS.map((m) => {
            const open = openMood === m;
            return (
              <View key={m} className="border-b border-slate-100 last:border-0">
                <Pressable
                  onPress={() => setOpenMood(open ? (m === 'serious' ? 'calm' : 'serious') : m)}
                  className="flex-row items-center justify-between px-4 py-4"
                >
                  <View className="flex-row items-center">
                    <MoodRowIcon mood={m} />
                    <Text className="ml-3 text-[15px] font-semibold text-slate-900">
                      {MOOD_LABELS[m]}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="h-7 min-w-[28px] items-center justify-center rounded-full bg-slate-100 px-2">
                      <Text className="text-xs font-semibold text-slate-600">
                        {counts[m]}
                      </Text>
                    </View>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#94a3b8"
                    />
                  </View>
                </Pressable>

                {open && m === 'serious' && seriousPreview ? (
                  <View className="px-4 pb-4">
                    <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <Text className="text-sm font-bold text-slate-900">
                        {seriousPreview.author}{' '}
                        <Text className="font-normal text-slate-500">
                          {seriousPreview.timeLabel}
                        </Text>
                      </Text>
                      <Text className="text-sm text-slate-500">{seriousPreview.handle}</Text>
                      <Text className="mt-2 text-[14px] leading-5 text-slate-700">
                        {seriousPreview.body}
                      </Text>
                    </View>
                    <Pressable className="mt-3 items-center py-2">
                      <Text className="text-sm font-semibold text-slate-500">
                        See All Items <Text className="text-slate-400">→</Text>
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

