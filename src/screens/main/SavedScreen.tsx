import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  apiGetBookmarkCollections,
  formatRelativeTime,
  type BookmarkCollectionRow,
} from '../../api/posts';
import { getApiMessage } from '../../api/auth';
import { Images } from '../../constants/images';
import { MOOD_LABELS, MOODS, type MoodId } from '../../constants/moods';
import type { MainStackParamList } from '../../navigation/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<MainStackParamList, 'Saved'>;

const PAGE = '#F8FAFC';
const CARD = '#FFFFFF';
const INK = '#0F172A';
const MUTED = '#64748B';
const BADGE_BG = '#E0E7FF';
const BADGE_TEXT = '#2563EB';

function collectionForMood(
  collections: BookmarkCollectionRow[],
  moodId: MoodId,
): BookmarkCollectionRow | undefined {
  const label = MOOD_LABELS[moodId];
  return collections.find((c) => c.mood === label);
}

/**
 * Saved — bookmark collections by post mood from `GET /posts/me/bookmarks`.
 */
export default function SavedScreen({ navigation }: Props) {
  const [openMood, setOpenMood] = useState<MoodId | null>(null);
  const [collections, setCollections] = useState<BookmarkCollectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const rows = await apiGetBookmarkCollections();
      setCollections(rows);
    } catch (e) {
      setError(getApiMessage(e));
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggle = (m: MoodId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMood((prev) => (prev === m ? null : m));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>

        <Text style={styles.title}>Saved</Text>

        <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {loading && collections.length === 0 ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading bookmarks…</Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>Your bookmark collections</Text>

        {!loading && !error && collections.length === 0 ? (
          <Text style={styles.emptyPage}>No bookmark data yet.</Text>
        ) : null}

        {MOODS.map((m) => {
          const open = openMood === m;
          const row = collectionForMood(collections, m);
          const count = row?.count ?? 0;
          const preview = row?.preview;
          const u = preview?.user;

          return (
            <View key={m} style={styles.card}>
              <Pressable onPress={() => toggle(m)} style={styles.row}>
                <Image source={Images.bookmarkMood[m]} style={styles.icon} />

                <Text style={styles.mood}>{MOOD_LABELS[m]}</Text>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>

                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#94a3b8"
                />
              </Pressable>

              {open && (
                <View style={styles.expand}>
                  {preview && u ? (
                    <>
                      <View style={styles.preview}>
                        <View style={styles.previewHeader}>
                          {u.avatarUrl ? (
                            <Image
                              source={{ uri: u.avatarUrl }}
                              style={styles.avatar}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.avatar, styles.avatarFallback]}>
                              <Ionicons name="person" size={22} color="#94a3b8" />
                            </View>
                          )}

                          <View>
                            <Text style={styles.author}>{u.displayName}</Text>
                            <Text style={styles.sub}>
                              @{u.username} · {formatRelativeTime(preview.createdAt)}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.body}>{preview.text}</Text>
                      </View>

                      <Pressable
                        style={styles.link}
                        onPress={() =>
                          navigation.navigate('MainTabs', {
                            screen: 'Home',
                          })
                        }
                      >
                        <Text style={styles.linkText}>See All Items →</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={styles.preview}>
                      <Text style={styles.empty}>
                        No bookmarks in {MOOD_LABELS[m]} yet.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: MUTED,
  },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
  },
  bannerText: {
    fontSize: 13,
    color: '#9a3412',
    textAlign: 'center',
  },
  retry: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: INK,
  },
  scroll: {
    padding: 16,
    paddingBottom: 120,
  },
  section: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    color: INK,
  },
  emptyPage: {
    fontSize: 14,
    color: MUTED,
    marginBottom: 12,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    marginBottom: 12,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    width: 26,
    height: 26,
  },
  mood: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: INK,
  },
  badge: {
    minWidth: 36,
    height: 28,
    borderRadius: 14,
    backgroundColor: BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginRight: 8,
  },
  badgeText: {
    color: BADGE_TEXT,
    fontWeight: '700',
  },
  expand: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  preview: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 14,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  avatarFallback: {
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  sub: {
    fontSize: 12,
    color: MUTED,
  },
  body: {
    marginTop: 10,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  empty: {
    fontSize: 14,
    color: MUTED,
  },
  link: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
