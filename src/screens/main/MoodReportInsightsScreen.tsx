import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MainStackParamList } from '../../navigation/types';
import {
  type AIMode,
  SLIDER_KEYS,
  useAIModeratorStore,
} from '../../store/useAIModeratorStore';

const PAGE_BG = '#F9FAFB';
const H_PAD = 20;
/** Figma — purple → gold (mode + reset border) */
const GRADIENT = ['#6C63FF', '#F5A623'] as const;
const TRACK_PURPLE = '#6366F1';
const TRACK_GRAY = '#E5E7EB';
const THUMB_BLUE = '#2563EB';

const MODE_LABELS: Record<AIMode, string> = {
  gentle: 'Gentle',
  balanced: 'Balanced',
  unfiltered: 'Unfiltered',
};

type Props = NativeStackScreenProps<MainStackParamList, 'AIModeratorInsights'>;

function formatLabel(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Mood Report insights — AI mode, filter sliders, toggles, reset (Figma).
 * Shares state with onboarding via `useAIModeratorStore`.
 */
export default function MoodReportInsightsScreen({ navigation }: Props) {
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

  const onInfo = useCallback(() => {
    Alert.alert(
      'Mood Report insights',
      'Tune how CxCix ranks and filters content. Changes apply across your feed and replies.',
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Mood Report insights
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About mood report"
          onPress={onInfo}
          style={styles.headerIconBtn}
        >
          <Ionicons name="information-circle-outline" size={22} color="#334155" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modeSection}>
          <View style={styles.modeLabelRow}>
            <Text style={styles.modeLabel}>AI Mode</Text>
            <Text style={styles.modeHint}>*default selected</Text>
          </View>
          <View style={styles.segmentWrap}>
            {(Object.keys(MODE_LABELS) as AIMode[]).map((m) => {
              const selected = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={styles.segmentItem}
                >
                  {selected ? (
                    <LinearGradient
                      colors={[...GRADIENT]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.segmentGradient}
                    >
                      <Text style={styles.segmentTextActive}>{MODE_LABELS[m]}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.segmentInactive}>
                      <Text style={styles.segmentText}>{MODE_LABELS[m]}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          {SLIDER_KEYS.map((key, index) => (
            <View
              key={key}
              style={[
                styles.sliderBlock,
                index < SLIDER_KEYS.length - 1 ? styles.sliderBlockBorder : styles.sliderBlockLast,
              ]}
            >
              <View style={styles.sliderLabelRow}>
                <Text style={styles.sliderLabel}>{formatLabel(key)}</Text>
                <Text style={styles.sliderPct}>{sliders[key]}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={sliders[key]}
                onValueChange={(v) => setSlider(key, v as number)}
                minimumTrackTintColor={TRACK_PURPLE}
                maximumTrackTintColor={TRACK_GRAY}
                thumbTintColor={THUMB_BLUE}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Explanations</Text>
              <Text style={styles.toggleSub}>
                Adds source + related context when content is flagged
              </Text>
            </View>
            <Switch
              value={explanations}
              onValueChange={setExplanations}
              trackColor={{ false: '#d4d4d8', true: '#93c5fd' }}
              thumbColor={explanations ? THUMB_BLUE : '#f4f4f5'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Hide toxic replies</Text>
              <Text style={styles.toggleSub}>
                Collapses replies likely to be abusive or harassing
              </Text>
            </View>
            <Switch
              value={hideToxicReplies}
              onValueChange={setHideToxicReplies}
              trackColor={{ false: '#d4d4d8', true: '#93c5fd' }}
              thumbColor={hideToxicReplies ? THUMB_BLUE : '#f4f4f5'}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.resetTitle}>AI Reset</Text>
          <Text style={styles.resetSub}>
            Clears learned preferences and restores defaults.
          </Text>
          <Pressable onPress={onReset} style={styles.resetBtnOuter}>
            <LinearGradient
              colors={[...GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resetGradientBorder}
            >
              <View style={styles.resetBtnInner}>
                <Text style={styles.resetBtnText}>Reset AI personalization</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingVertical: 10,
    backgroundColor: PAGE_BG,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
  },
  modeSection: {
    marginBottom: 8,
  },
  modeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  modeHint: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#94a3b8',
  },
  segmentWrap: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: '#fff',
    padding: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  segmentItem: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  segmentGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  segmentInactive: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  card: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sliderBlock: {
    paddingBottom: 16,
  },
  sliderBlockBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 16,
  },
  sliderBlockLast: {
    paddingBottom: 0,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  sliderPct: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    color: '#64748b',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSub: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  resetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  resetSub: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  resetBtnOuter: {
    marginTop: 16,
    borderRadius: 999,
    overflow: 'hidden',
  },
  resetGradientBorder: {
    borderRadius: 999,
    padding: 2,
  },
  resetBtnInner: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});
