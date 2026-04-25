import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  apiGetMyPosts,
  apiGetProfileAnalytics,
  formatCompactCount,
  formatRelativeTime,
  type ApiFeedPost,
  type MyPostsTab,
  type ProfileAnalytics,
} from '../../api/posts';
import { getApiMessage } from '../../api/auth';
import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/useAuthStore';
import { formatAtUsername, formatUserDisplayName } from '../../utils/userDisplay';

/** Figma page background */
const PAGE_BG = '#F9FAFB';
const H_PAD = 24;
const CARD_RADIUS = 20;
const POST_IMG_RADIUS = 12;

const TABS = ['Posts', 'Shifted', 'Bookmarks', 'Likes', 'Media'] as const;

const TAB_TO_API: Record<(typeof TABS)[number], MyPostsTab> = {
  Posts: 'posts',
  Shifted: 'shifted',
  Bookmarks: 'bookmarks',
  Likes: 'likes',
  Media: 'media',
};

function truncateCaption(text: string, max = 52): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '…';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Profile — real user from auth; mood analytics + tab grids from `/posts/me/*`.
 */
export default function ProfileScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Posts');
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ApiFeedPost[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsError(null);
    try {
      const data = await apiGetProfileAnalytics();
      setAnalytics(data);
    } catch (e) {
      setAnalyticsError(getApiMessage(e));
      setAnalytics(null);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setPostsError(null);
    setPostsLoading(true);
    try {
      const apiTab = TAB_TO_API[tab];
      const res = await apiGetMyPosts({ tab: apiTab, page: 1, limit: 30 });
      setPosts(res.posts);
      setPostsTotal(res.total);
    } catch (e) {
      setPostsError(getApiMessage(e));
      setPosts([]);
      setPostsTotal(0);
    } finally {
      setPostsLoading(false);
    }
  }, [tab]);

  useFocusEffect(
    useCallback(() => {
      void refreshUser();
      void loadAnalytics();
    }, [refreshUser, loadAnalytics]),
  );

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

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

  const openEditProfile = () => {
    stackNav()?.navigate('EditProfile');
  };

  const openFollowConnections = (mode: 'followers' | 'following') => {
    stackNav()?.navigate('FollowConnections', { mode });
  };

  const openPost = (postId: string) => {
    stackNav()?.navigate('ReadComment', { postId, variant: 'standard' });
  };

  const displayName = formatUserDisplayName(
    {
      fullName: user?.fullName,
      displayName: user?.displayName,
      username: user?.username,
      email: user?.email,
    },
    'Your name',
  );
  const handle = user?.username ? formatAtUsername(user.username) : formatAtUsername(null, 'username');
  const bioText = user?.bio?.trim() ?? '';
  const followers = user?.followersCount ?? 0;
  const following = user?.followingCount ?? 0;
  const avatarSource =
    user?.avatarUrl && user.avatarUrl.length > 0
      ? { uri: user.avatarUrl }
      : Images.avatarSplit;

  const moodWeek = analytics?.moodWeek ?? [];
  const passport = analytics?.moodPassport;
  const insights = analytics?.insights ?? [];

  const gridRows: ApiFeedPost[][] = [];
  for (let i = 0; i < posts.length; i += 3) {
    gridRows.push(posts.slice(i, i + 3));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <Pressable
            style={styles.editPill}
            hitSlop={4}
            onPress={openEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
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
              <Image source={avatarSource} style={styles.avatarImg} resizeMode="cover" />
            </View>
            <Text style={styles.displayName} numberOfLines={2}>
              {displayName}
            </Text>
            <Text style={styles.handle}>{handle}</Text>
            <Text style={styles.bioText}>
              {bioText.length > 0 ? bioText : 'No bio yet — tap Edit to add one.'}
            </Text>

            <View style={styles.statsRow}>
              <Pressable
                style={styles.stat}
                onPress={() => openFollowConnections('followers')}
                accessibilityRole="button"
                accessibilityLabel="View followers"
              >
                <Text style={styles.statNum}>{formatCompactCount(followers)}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </Pressable>
              <View style={styles.statDivider} />
              <Pressable
                style={styles.stat}
                onPress={() => openFollowConnections('following')}
                accessibilityRole="button"
                accessibilityLabel="View following"
              >
                <Text style={styles.statNum}>{formatCompactCount(following)}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {analyticsError ? (
          <Text style={styles.inlineError}>{analyticsError}</Text>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Mood Distribution</Text>
            <Text style={styles.linkThisWeek}>This Week</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={styles.barRow}>
              {moodWeek.length > 0 ? (
                moodWeek.map((s) => (
                  <View
                    key={s.mood}
                    style={{ flex: s.flex, backgroundColor: s.color }}
                  />
                ))
              ) : (
                <View style={{ flex: 1, backgroundColor: '#e2e8f0' }} />
              )}
            </View>
          </View>
          <View style={styles.legendWrap}>
            {moodWeek.length > 0 ? (
              moodWeek.map((item) => (
                <Legend key={item.mood} dot={item.color} label={`${item.mood} (${item.count})`} />
              ))
            ) : (
              <Text style={styles.legendEmpty}>Post this week to see mood mix.</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Mood Passport</Text>
            <Text style={styles.passportMeta}>Last 30 Days Summary</Text>
          </View>
          <Text style={styles.passportSub}>Time-Of-Day Mood Band / Peaks Timeline</Text>
          <View style={styles.barTrack}>
            <View style={styles.barRow}>
              {passport?.segments?.length ? (
                passport.segments.map((s, i) => (
                  <View key={i} style={{ flex: s.flex, backgroundColor: s.color }} />
                ))
              ) : (
                <>
                  <View style={{ flex: 1, backgroundColor: '#60A5FA' }} />
                  <View style={{ flex: 2, backgroundColor: '#A78BFA' }} />
                  <View style={{ flex: 2, backgroundColor: '#FDE047' }} />
                  <View style={{ flex: 2, backgroundColor: '#FB923C' }} />
                  <View style={{ flex: 1, backgroundColor: '#F59E0B' }} />
                </>
              )}
            </View>
          </View>
          <View style={styles.timeRow}>
            {(passport?.timeLabels ?? ['00:00', '06:00', '12:00', '18:00', '24:00']).map(
              (t) => (
                <Text key={t} style={styles.timeLabel}>
                  {t}
                </Text>
              ),
            )}
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
          {insights.length > 0 ? (
            insights.map((ins) => (
              <Insight
                key={ins.id}
                image={
                  ins.icon === 'shield' ? Images.profileAiInsightShield : Images.profileAiInsightSun
                }
                title={ins.title}
                sub={ins.sub}
              />
            ))
          ) : (
            <Insight
              image={Images.profileAiInsightSun}
              title="Insights unlock as you post"
              sub="Share posts to see time-of-day and mood patterns here."
            />
          )}
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
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t}</Text>
                  {active ? <View style={styles.tabUnderline} /> : (
                    <View style={styles.tabUnderlinePlaceholder} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {postsError ? (
          <Text style={styles.inlineError}>{postsError}</Text>
        ) : null}

        {postsLoading ? (
          <View style={styles.gridLoading}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.gridLoadingText}>Loading…</Text>
          </View>
        ) : gridRows.length === 0 ? (
          <Text style={styles.gridEmpty}>
            {postsTotal === 0
              ? 'Nothing here yet — create a post from Home.'
              : 'No items on this tab.'}
          </Text>
        ) : (
          gridRows.map((row, ri) => (
            <View key={`row-${ri}`} style={styles.postsRow}>
              {row.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.postCol}
                  onPress={() => openPost(p.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Open post"
                >
                  <View style={styles.postImageWrap}>
                    {p.mediaUrl ? (
                      <Image
                        source={{ uri: p.mediaUrl }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.postImagePlaceholder}>
                        <Ionicons name="document-text-outline" size={28} color="#94a3b8" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.postTitle} numberOfLines={3}>
                    {truncateCaption(p.text)}
                  </Text>
                  <View style={styles.postFooter}>
                    <Ionicons name="heart" size={14} color="#3b82f6" />
                    <Text style={styles.postLikes}>{formatCompactCount(p.likesCount)}</Text>
                  </View>
                </Pressable>
              ))}
              {row.length < 3
                ? [...Array(3 - row.length)].map((_, i) => (
                    <View key={`pad-${ri}-${i}`} style={styles.postCol} />
                  ))
                : null}
            </View>
          ))
        )}
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
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: H_PAD,
    paddingVertical: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
  bioText: {
    marginTop: 12,
    marginHorizontal: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
  },
  statsRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: '#e2e8f0' },
  statNum: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  statLabel: { marginTop: 2, fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  inlineError: {
    marginTop: 8,
    fontSize: 12,
    color: '#b45309',
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
  legendEmpty: {
    fontSize: 12,
    color: '#94a3b8',
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
  gridLoading: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gridLoadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  gridEmpty: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 14,
    color: '#64748b',
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
  postImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
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
