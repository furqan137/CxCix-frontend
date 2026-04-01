import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, Text, View, Image } from 'react-native';

import { BRAND_GRADIENT } from '../../constants/brand';
import { Images } from '../../constants/images';
import { MOOD_LABELS, type MoodId } from '../../constants/moods';
import { BottomSheetModal } from '../ui/BottomSheetModal';

type Props = {
  visible: boolean;
  onClose: () => void;
  currentMood: MoodId;
  onSwitchMood: (m: MoodId) => void;
};

const SUGGESTIONS: Array<{
  label: string;
  target: MoodId;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { label: 'Feeling curious?', target: 'serious', icon: 'book-outline' },
  { label: 'Need a laugh?', target: 'satire', icon: 'happy-outline' },
  { label: 'Want to create?', target: 'creative', icon: 'color-palette-outline' },
  { label: 'Vawulence?', target: 'vawulence', icon: 'flame-outline' },
  { label: 'Ready to engage?', target: 'debate', icon: 'chatbubbles-outline' },
];

const CARDS = [
  { id: 'econ', title: 'Global Economic\nTrends 2026', image: Images.tileEconomy },
  { id: 'vr', title: 'Tech Innovation\nSummit Results', image: Images.tileVr },
  { id: 'dig', title: 'The Future of Digital\nCurrency', image: Images.tileDigital },
];

/**
 * Mood Bridges — suggestion chips + explore tiles + switch/return CTAs (hi-fi).
 */
export function MoodBridgesSheet({
  visible,
  onClose,
  currentMood,
  onSwitchMood,
}: Props) {
  return (
    <BottomSheetModal visible={visible} onClose={onClose} maxHeightRatio={0.84}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mt-2 text-center text-2xl font-bold text-slate-900">
          You're in {MOOD_LABELS[currentMood]} 😌
        </Text>

        <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s.target}
              onPress={() => onSwitchMood(s.target)}
              className="w-[48%] flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 py-3"
            >
              <Text className="text-xs text-slate-600">{s.label} → </Text>
              <Text className="text-xs font-semibold text-blue-600">{MOOD_LABELS[s.target]}</Text>
              <Ionicons name={s.icon} size={16} color="#2563eb" style={{ marginLeft: 8 }} />
            </Pressable>
          ))}
        </View>

        <View className="mt-6 flex-row items-center justify-between">
          <Text className="text-base font-bold text-slate-900">Explore By Mood</Text>
          <Pressable>
            <Text className="text-sm font-semibold text-blue-600">View All</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <View className="flex-row gap-3">
            {CARDS.map((c) => (
              <View
                key={c.id}
                className="w-[160px] overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <Image
                  source={c.image}
                  style={{ width: '100%', height: 92 }}
                  resizeMode="cover"
                />
                <Text className="p-3 text-sm font-semibold text-slate-800">{c.title}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <Pressable
          onPress={() => {
            // Switch to the first suggestion target for now
            onSwitchMood('serious');
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
            <Text className="text-base font-bold text-white">Switch to Serious</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onClose} className="mt-3 items-center py-3">
          <Text className="text-base font-bold text-slate-600">Return to Calm</Text>
        </Pressable>
      </ScrollView>
    </BottomSheetModal>
  );
}

