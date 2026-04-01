import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BRAND_GRADIENT } from '../../constants/brand';
import { MOOD_LABELS, MOODS, type MoodId } from '../../constants/moods';
import { useBookmarksStore } from '../../store/useBookmarksStore';
import { BottomSheetModal } from '../ui/BottomSheetModal';

type Draft = {
  author: string;
  handle: string;
  timeLabel: string;
  body: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  draft?: Draft;
};

/**
 * Save Bookmark sheet — choose mood collection then save (hi-fi BOOKMARKS).
 */
export function SaveBookmarkSheet({ visible, onClose, draft }: Props) {
  const save = useBookmarksStore((s) => s.save);
  const [selected, setSelected] = useState<MoodId>('calm');

  const item = useMemo(
    () =>
      draft ?? {
        author: 'Elena Fisher',
        handle: '@elenadesign',
        timeLabel: '2h',
        body: 'Taking a moment to breathe today. The world is quiet and everything feels aligned. Sending peace to everyone on the timeline. 🌿',
      },
    [draft],
  );

  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightRatio={0.78}>
      <View className="px-5 pb-4">
        <Text className="text-xs font-bold uppercase tracking-widest text-blue-600">
          Save Bookmark
        </Text>
        <Text className="mt-2 text-xl font-bold text-slate-900">
          Choose where to save this post
        </Text>

        <View className="mt-5 gap-3">
          {MOODS.map((m) => {
            const active = selected === m;
            return (
              <Pressable
                key={m}
                onPress={() => setSelected(m)}
                className="flex-row items-center justify-between rounded-2xl border bg-white px-4 py-4"
                style={{
                  borderColor: active ? '#2563eb' : '#e2e8f0',
                }}
              >
                <View className="flex-row items-center">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <Text className="text-sm font-bold text-slate-700">
                      {MOOD_LABELS[m].slice(0, 1)}
                    </Text>
                  </View>
                  <Text className="ml-3 text-[15px] font-semibold text-slate-800">
                    Save for {MOOD_LABELS[m]}
                  </Text>
                </View>
                <View
                  className="h-6 w-6 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: active ? '#2563eb' : '#cbd5e1',
                    backgroundColor: active ? '#2563eb' : 'transparent',
                  }}
                >
                  {active ? <View className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            save({ mood: selected, ...item });
            onClose();
          }}
          className="mt-6 overflow-hidden rounded-full"
        >
          <LinearGradient
            colors={[...BRAND_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ paddingVertical: 16, alignItems: 'center' }}
          >
            <Text className="text-base font-bold text-white">Save</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

