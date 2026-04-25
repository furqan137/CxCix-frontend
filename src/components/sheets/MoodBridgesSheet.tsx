import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { Images } from '../../constants/images';
import { MOOD_LABELS, type MoodId } from '../../constants/moods';
import { BottomSheetModal } from '../ui/BottomSheetModal';
import { apiGetExploreMood, type ApiFeedPost } from '../../api/posts';
import { getApiMessage } from '../../api/auth';

type Props = {
  visible: boolean;
  onClose: () => void;
  currentMood: MoodId;
  onSwitchMood: (m: MoodId) => void;
};

/** Figma accent — mood names, icons, “View All”. */
const MOOD_BLUE = '#4A90E2';
/** Figma primary CTA — purple → gold. */
const MOOD_BRIDGES_GRADIENT = ['#6C63FF', '#F5A623'] as const;

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 24;
const CHIP_GAP = 12;
const CHIP_W = (SCREEN_W - H_PAD * 2 - CHIP_GAP) / 2;
const FULL_ROW_W = SCREEN_W - H_PAD * 2;
/** Square thumbnails — fixed box + cover avoids stretch; assets stay sharp. */
const CARD_IMAGE = 148;
const CARD_GAP = 16;

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

function postThumb(p: ApiFeedPost) {
  const url = p.media?.[0]?.url || p.mediaUrl;
  return url ? { uri: url } : null;
}

/**
 * Mood Bridges — Figma-aligned chips, explore row, CTAs.
 */
export function MoodBridgesSheet({
  visible,
  onClose,
  currentMood,
  onSwitchMood,
}: Props) {
  const [explore, setExplore] = useState<{ calm: ApiFeedPost[]; serious: ApiFeedPost[]; creative: ApiFeedPost[] } | null>(
    null,
  );
  const [exploreError, setExploreError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setExploreError(null);
    void (async () => {
      try {
        const res = await apiGetExploreMood({ per: 6 });
        if (!alive) return;
        setExplore(res);
      } catch (e) {
        if (!alive) return;
        setExplore(null);
        setExploreError(getApiMessage(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible]);

  const cards = useMemo(() => {
    const make = (key: 'calm' | 'serious' | 'creative', title: string) => {
      const p = explore?.[key]?.[0];
      return {
        id: key,
        title,
        post: p ?? null,
        image: p ? postThumb(p) : null,
        fallback:
          key === 'calm'
            ? Images.moodBridgeExplore.economy
            : key === 'serious'
              ? Images.moodBridgeExplore.tech
              : Images.moodBridgeExplore.digital,
      };
    };
    return [
      make('calm', 'Calm picks\nfor you'),
      make('serious', 'Serious picks\nfor you'),
      make('creative', 'Creative picks\nfor you'),
    ];
  }, [explore]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      maxHeightRatio={0.84}
      topBorderRadius={32}
      handleWidth={40}
      handleHeight={4}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          You're in {MOOD_LABELS[currentMood]} 😌
        </Text>

        <View style={styles.chipGrid}>
          {SUGGESTIONS.map((s, i) => {
            const fullRow = i === SUGGESTIONS.length - 1;
            return (
              <Pressable
                key={s.target}
                onPress={() => onSwitchMood(s.target)}
                style={[
                  styles.chip,
                  fullRow ? { width: FULL_ROW_W } : { width: CHIP_W },
                ]}
              >
                <View style={styles.chipTextWrap}>
                  <Text style={styles.chipLead}>
                    {s.label}{' '}
                    <Text style={styles.chipAccent}>→ {MOOD_LABELS[s.target]}</Text>
                  </Text>
                </View>
                <Ionicons name={s.icon} size={18} color={MOOD_BLUE} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.exploreHeader}>
          <Text style={styles.exploreTitle}>Explore By Mood</Text>
          <Pressable hitSlop={8}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        {exploreError ? (
          <Text style={{ marginBottom: 8, color: '#64748b', fontSize: 12 }}>
            {exploreError}
          </Text>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScrollContent}
        >
          {cards.map((c, idx) => (
            <View
              key={c.id}
              style={[styles.card, idx < cards.length - 1 && { marginRight: CARD_GAP }]}
            >
              <View style={styles.cardImageWrap}>
                <Image
                  source={c.image ?? c.fallback}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.cardTitle}>{c.title}</Text>
            </View>
          ))}
        </ScrollView>

        <Pressable
          onPress={() => {
            onSwitchMood('serious');
            onClose();
          }}
          style={styles.primaryBtnOuter}
        >
          <LinearGradient
            colors={[...MOOD_BRIDGES_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryBtnInner}
          >
            <Text style={styles.primaryBtnText}>Switch to Serious</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => {
            onSwitchMood('calm');
            onClose();
          }}
          style={styles.secondaryBtn}
        >
          <Text style={styles.secondaryBtnText}>Return to Calm</Text>
        </Pressable>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 20,
  },
  title: {
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CHIP_GAP,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chipTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  chipLead: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  chipAccent: {
    fontWeight: '600',
    color: MOOD_BLUE,
  },
  exploreHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exploreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: MOOD_BLUE,
  },
  hScrollContent: {
    paddingBottom: 4,
  },
  card: {
    width: CARD_IMAGE,
    backgroundColor: '#fff',
  },
  cardImageWrap: {
    width: CARD_IMAGE,
    height: CARD_IMAGE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
  },
  primaryBtnOuter: {
    marginTop: 24,
    borderRadius: 50,
    overflow: 'hidden',
  },
  primaryBtnInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
});
