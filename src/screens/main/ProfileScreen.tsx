import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

/** Figma page background */
const PAGE_BG = '#F9FAFB';
const H_PAD = 24;
/** Main cards — ~20px radius */
const CARD_RADIUS = 20;
/** Post thumbnails — ~12px */
const POST_IMG_RADIUS = 12;

const TABS = ['Posts', 'Shifted', 'Bookmarks', 'Likes', 'Media'] as const;

/** Mood Distribution bar: Purple, Red, Orange, Green, Blue (Figma) */
const MOOD_SEGMENTS: Array<{ flex: number; color: string }> = [
  { flex: 2, color: '#8B5CF6' },
  { flex: 1, color: '#EF4444' },
  { flex: 1, color: '#F97316' },
  { flex: 2, color: '#22C55E' },
  { flex: 2, color: '#3B82F6' },
];

const MOOD_LEGEND: Array<{ dot: string; label: string }> = [
  { dot: '#8B5CF6', label: 'Creative' },
  { dot: '#EF4444', label: 'Debate' },
  { dot: '#F97316', label: 'Funny' },
  { dot: '#22C55E', label: 'Calm' },
  { dot: '#3B82F6', label: 'Serious' },
];

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Posts');

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  const openSaved = () => {
    stackNav()?.navigate('Saved');
  };

  const openMoodReportInsights = () => {
    stackNav()?.navigate('AIModeratorInsights');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerIconBtn}
          hitSlop={6}
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable
          onPress={() => stackNav()?.navigate('Search')}
          style={styles.headerIconBtn}
          hitSlop={6}
        >
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card — avatar + name centered; Edit top-right */}
        <View style={styles.profileCard}>
          <Pressable style={styles.editPill} hitSlop={4}>
            <LinearGradient
              colors={['#6C63FF', '#F5A623']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.editGradient}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
              <Text style={styles.editText}>Edit</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.profileInner}>
            <View style={styles.avatarRing}>
              <Image
                source={Images.avatarSplit}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.displayName}>Wade Warren</Text>
            <Text style={styles.handle}>@wade_warren</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Mood Distribution</Text>
            <Text style={styles.linkThisWeek}>This Week</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={styles.barRow}>
              {MOOD_SEGMENTS.map((s, i) => (
                <View key={i} style={{ flex: s.flex, backgroundColor: s.color }} />
              ))}
            </View>
          </View>
          <View style={styles.legendWrap}>
            {MOOD_LEGEND.map((item) => (
              <Legend key={item.label} dot={item.dot} label={item.label} />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Mood Passport</Text>
            <Text style={styles.passportMeta}>Last 30 Days Summary</Text>
          </View>
          <Text style={styles.passportSub}>
            Time-Of-Day Mood Band / Peaks Timeline
          </Text>
          <View style={styles.barTrack}>
            <View style={styles.barRow}>
              <View style={{ flex: 1, backgroundColor: '#60A5FA' }} />
              <View style={{ flex: 2, backgroundColor: '#A78BFA' }} />
              <View style={{ flex: 2, backgroundColor: '#FDE047' }} />
              <View style={{ flex: 2, backgroundColor: '#FB923C' }} />
              <View style={{ flex: 1, backgroundColor: '#F59E0B' }} />
            </View>
          </View>
          <View style={styles.timeRow}>
            {['00:00', '06:00', '12:00', '18:00', '24:00'].map((t) => (
              <Text key={t} style={styles.timeLabel}>
                {t}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.aiSectionHeader}>
          <Text style={styles.sectionHeading}>AI Insights</Text>
          <Pressable
            onPress={openMoodReportInsights}
            style={styles.editInsightsBtn}
            hitSlop={8}
          >
            <Text style={styles.editInsightsLabel}>Edit settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#2563eb" />
          </Pressable>
        </View>
        <View style={styles.insightsCol}>
          <Insight
            image={Images.profileAiInsightSun}
            title="Your creativity peaks at night"
            sub="Based on your activity patterns from 10 PM to 2 AM."
          />
          <Insight
            image={Images.profileAiInsightShield}
            title="You avoided Debate for 3 weeks"
            sub="Consistency is key to maintaining your current calm state."
          />
        </View>

        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {TABS.map((t) => {
              const active = tab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    setTab(t);
                    if (t === 'Bookmarks') openSaved();
                  }}
                  style={styles.tabItem}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {t}
                  </Text>
                  {active ? <View style={styles.tabUnderline} /> : (
                    <View style={styles.tabUnderlinePlaceholder} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.postsRow}>
          {[Images.tileCalmMan, Images.feedPost2, Images.tileSilence].map((img, idx) => (
            <View key={idx} style={styles.postCol}>
              <View style={styles.postImageWrap}>
                <Image source={img} style={styles.postImage} resizeMode="cover" />
              </View>
              <Text style={styles.postTitle}>
                {idx === 0
                  ? 'Find peace within\nthe noise'
                  : idx === 1
                    ? 'Clarity begins with\na breath'
                    : 'Silence is the loudest\nstrength'}
              </Text>
              <View style={styles.postFooter}>
                <Ionicons name="heart" size={14} color="#3b82f6" />
                <Text style={styles.postLikes}>24.4k</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: dot }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function Insight({
  image,
  title,
  sub,
}: {
  image: ImageSourcePropType;
  title: string;
  sub: string;
}) {
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightRow}>
        <View style={styles.insightIconWrap}>
          <Image source={image} style={styles.insightIcon} resizeMode="contain" />
        </View>
        <View style={styles.insightTextCol}>
          <Text style={styles.insightTitle}>{title}</Text>
          <Text style={styles.insightSub}>{sub}</Text>
        </View>
      </View>
    </View>
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
    backgroundColor: '#fff',
    paddingHorizontal: H_PAD,
    paddingVertical: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    paddingBottom: 120,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  editPill: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  editGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  profileInner: {
    alignItems: 'center',
    paddingTop: 8,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#3B82F6',
    padding: 2,
    backgroundColor: '#fff',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  displayName: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  handle: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  card: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  linkThisWeek: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  passportMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
  passportSub: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
  },
  barTrack: {
    marginTop: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  barRow: {
    height: 12,
    flexDirection: 'row',
  },
  legendWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    rowGap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    marginLeft: 8,
    fontSize: 12,
    color: '#475569',
  },
  timeRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  aiSectionHeader: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editInsightsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editInsightsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  insightsCol: {
    marginTop: 12,
    gap: 12,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightIcon: {
    width: 28,
    height: 28,
  },
  insightTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20,
  },
  insightSub: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
  },
  tabsWrap: {
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabsScroll: {
    flexDirection: 'row',
    paddingBottom: 0,
    gap: 20,
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: 12,
    minWidth: 72,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabLabelActive: {
    color: '#2563eb',
  },
  tabUnderline: {
    marginTop: 8,
    height: 3,
    width: 40,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
  },
  tabUnderlinePlaceholder: {
    marginTop: 8,
    height: 3,
    width: 40,
    opacity: 0,
  },
  postsRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 16,
  },
  postCol: {
    flex: 1,
    minWidth: 0,
  },
  postImageWrap: {
    borderRadius: POST_IMG_RADIUS,
    overflow: 'hidden',
    aspectRatio: 1,
    backgroundColor: '#f1f5f9',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 16,
  },
  postFooter: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLikes: {
    marginLeft: 4,
    fontSize: 12,
    color: '#64748b',
  },
});
