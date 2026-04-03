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

import { Images } from '../../constants/images';
import { MOOD_LABELS, type MoodId } from '../../constants/moods';
import { BottomSheetModal } from '../ui/BottomSheetModal';

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

const CARDS = [
  {
    id: 'econ',
    title: 'Global Economic\nTrends 2026',
    image: Images.moodBridgeExplore.economy,
  },
  {
    id: 'vr',
    title: 'Tech Innovation\nSummit Results',
    image: Images.moodBridgeExplore.tech,
  },
  {
    id: 'dig',
    title: 'The Future of Digital\nCurrency',
    image: Images.moodBridgeExplore.digital,
  },
];

/**
 * Mood Bridges — Figma-aligned chips, explore row, CTAs.
 */
export function MoodBridgesSheet({
  visible,
  onClose,
  currentMood,
  onSwitchMood,
}: Props) {
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScrollContent}
        >
          {CARDS.map((c, idx) => (
            <View
              key={c.id}
              style={[styles.card, idx < CARDS.length - 1 && { marginRight: CARD_GAP }]}
            >
              <View style={styles.cardImageWrap}>
                <Image
                  source={c.image}
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
