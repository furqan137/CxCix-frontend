import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BRAND, BRAND_GRADIENT } from '../../constants/brand';
import { GradientButton } from '../../components/ui/GradientButton';
import { type AIMode, SLIDER_KEYS, useAIModeratorStore } from '../../store/useAIModeratorStore';
import type { RootStackParamList } from '../../navigation/types';
import { apiSaveAiPreferences } from '../../api/users';
import { getApiMessage } from '../../api/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'AIModerator'>;

const MODE_LABELS: Record<AIMode, string> = {
  gentle: 'Gentle',
  balanced: 'Balanced',
  unfiltered: 'Unfiltered',
};

function formatLabel(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Full AI moderator tuning — sliders, mode, toggles, reset (design match).
 */
export default function AIModeratorScreen({ navigation, route }: Props) {
  const signupFlow = route.params?.signupFlow === true;
  const insets = useSafeAreaInsets();
  const mode = useAIModeratorStore((s) => s.mode);
  const setMode = useAIModeratorStore((s) => s.setMode);
  const sliders = useAIModeratorStore((s) => s.sliders);
  const setSlider = useAIModeratorStore((s) => s.setSlider);
  const explanations = useAIModeratorStore((s) => s.explanations);
  const hideToxicReplies = useAIModeratorStore((s) => s.hideToxicReplies);
  const setExplanations = useAIModeratorStore((s) => s.setExplanations);
  const setHideToxicReplies = useAIModeratorStore((s) => s.setHideToxicReplies);
  const resetPersonalization = useAIModeratorStore((s) => s.resetPersonalization);

  const onReset = useCallback(() => {
    Alert.alert(
      'Reset AI personalization?',
      'This clears learned preferences and restores defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetPersonalization() },
      ],
    );
  }, [resetPersonalization]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: BRAND.pageBg }} edges={['top']}>
      <StatusBar style="dark" />
      <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft"
        >
          <Ionicons name="chevron-back" size={22} color="#1e293b" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About AI moderator"
          onPress={() =>
            Alert.alert(
              'My AI Moderator',
              'Tune how CxCix ranks and filters content. Accessible from Home, Settings, and Mood.',
            )
          }
          className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft"
        >
          <Ionicons name="information-circle-outline" size={22} color="#1e293b" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-center text-xl font-bold text-slate-900">Mood Report insights</Text>

        {/* AI Mode */}
        <View className="mt-6">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-slate-900">AI Mode</Text>
            <Text className="text-xs italic text-slate-400">*default selected</Text>
          </View>
          <View className="flex-row rounded-full border border-slate-200 bg-white p-1 shadow-soft">
            {(Object.keys(MODE_LABELS) as AIMode[]).map((m) => {
              const selected = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  className="flex-1 overflow-hidden rounded-full"
                >
                  {selected ? (
                    <LinearGradient
                      colors={[...BRAND_GRADIENT]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text className="text-sm font-semibold text-white">{MODE_LABELS[m]}</Text>
                    </LinearGradient>
                  ) : (
                    <View className="py-2.5">
                      <Text className="text-center text-sm font-semibold text-slate-800">
                        {MODE_LABELS[m]}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sliders card */}
        <View className="mt-6 rounded-2xl bg-white p-4 shadow-soft">
          {SLIDER_KEYS.map((key) => (
            <View key={key} className="mb-5 border-b border-slate-100 pb-5 last:mb-0 last:border-0 last:pb-0">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-sm font-medium text-slate-800">{formatLabel(key)}</Text>
                <Text className="text-sm tabular-nums text-slate-500">{sliders[key]}%</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 36 }}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={sliders[key]}
                onValueChange={(v) => setSlider(key, v as number)}
                minimumTrackTintColor={BRAND.gradientStart}
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor="#3B82F6"
              />
            </View>
          ))}
        </View>

        {/* Toggles */}
        <View className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 pr-2">
              <Text className="text-base font-bold text-slate-900">Explanations</Text>
              <Text className="mt-1 text-sm leading-5 text-slate-500">
                Adds source + related context when content is flagged.
              </Text>
            </View>
            <Switch
              value={explanations}
              onValueChange={setExplanations}
              trackColor={{ false: '#d4d4d8', true: '#93c5fd' }}
              thumbColor={explanations ? '#2563eb' : '#f4f4f5'}
            />
          </View>
          <View className="my-4 h-px bg-slate-100" />
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 pr-2">
              <Text className="text-base font-bold text-slate-900">Hide toxic replies</Text>
              <Text className="mt-1 text-sm leading-5 text-slate-500">
                Collapses replies likely to be abusive or harassing.
              </Text>
            </View>
            <Switch
              value={hideToxicReplies}
              onValueChange={setHideToxicReplies}
              trackColor={{ false: '#d4d4d8', true: '#93c5fd' }}
              thumbColor={hideToxicReplies ? '#2563eb' : '#f4f4f5'}
            />
          </View>
        </View>

        {/* Reset */}
        <View className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
          <Text className="text-base font-bold text-slate-900">AI Reset</Text>
          <Text className="mt-1 text-sm text-slate-500">
            Clears learned preferences and restores defaults.
          </Text>
          <Pressable
            onPress={onReset}
            className="mt-4 items-center rounded-full border border-violet-200 bg-white py-3.5 shadow-sm"
          >
            <Text className="text-sm font-semibold text-slate-800">Reset AI personalization</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-200/80 bg-white px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <GradientButton
          onPress={() =>
            void (async () => {
              try {
                await apiSaveAiPreferences({
                  mode,
                  toxicity: (sliders.toxicity ?? 25) / 100,
                  humor: (sliders.humor ?? 40) / 100,
                  intensity: (sliders.intensity ?? 50) / 100,
                  depth: (sliders.depth ?? 65) / 100,
                  repetition: (sliders.repetition ?? 30) / 100,
                });
              } catch (e) {
                Alert.alert('Could not save', getApiMessage(e));
                return;
              }
              signupFlow ? navigation.replace('AccountCreated') : navigation.replace('Login');
            })()
          }
        >
          Finish AI Setup
        </GradientButton>
      </View>
    </SafeAreaView>
  );
}
