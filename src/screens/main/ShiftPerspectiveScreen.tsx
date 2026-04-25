import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientButton } from '../../components/ui/GradientButton';
import { BRAND } from '../../constants/brand';
import {
  SHIFT_PERSPECTIVES,
  type ShiftPerspectiveId,
} from '../../constants/shiftPerspectives';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'ShiftPerspective'>;

const BG = '#F8F9FA';

/**
 * Shift flow — “Select Perspective” grid + Continue (matches Tap_Shift mock).
 */
export default function ShiftPerspectiveScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const postId = route.params?.postId;
  const [selected, setSelected] = useState<ShiftPerspectiveId | null>(null);

  useEffect(() => {
    if (!postId) {
      Alert.alert('Shift', 'Open Shift from a post on the feed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [postId, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-center border-b border-slate-100 px-4 py-3">
        <Pressable
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Select Perspective</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        style={{ backgroundColor: BG }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {SHIFT_PERSPECTIVES.map((item) => {
            const active = selected === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelected(item.id)}
                className="w-[48%] overflow-hidden rounded-2xl bg-white p-4 shadow-soft"
                style={{
                  borderWidth: active ? 2 : 0,
                  borderColor: active ? BRAND.purpleDeep : 'transparent',
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: active ? 0.12 : 0.06,
                  shadowRadius: 10,
                  elevation: active ? 4 : 2,
                }}
              >
                <Image source={item.icon} style={{ width: 28, height: 28 }} resizeMode="contain" />
                <Text className="mt-6 text-sm font-semibold text-slate-800">{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="border-t border-slate-100 bg-white px-4 pb-2 pt-3">
        <GradientButton
          onPress={() => {
            if (!selected || !postId) return;
            const label = SHIFT_PERSPECTIVES.find((x) => x.id === selected)?.label ?? 'Perspective';
            navigation.navigate('AddCommentary', {
              postId,
              perspectiveLabel: label,
            });
          }}
          disabled={!selected || !postId}
        >
          Continue
        </GradientButton>
      </View>
    </SafeAreaView>
  );
}
