import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGetExplore, type ApiFeedPost, type ExploreMoodSection } from '../../api/posts';
import { getApiMessage } from '../../api/auth';
import { MOOD_LABELS, moodApiToId, type MoodId } from '../../constants/moods';
import type { MainStackParamList } from '../../navigation/types';
import { useMoodStore } from '../../store/useMoodStore';

const PAGE = '#F5F7F9';

const MOOD_EMOJI: Record<MoodId, string> = {
  calm: '😌',
  serious: '😔',
  creative: '✨',
  satire: '😂',
  debate: '💬',
  vawulence: '🔥',
};

const MOOD_HEADER_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Calm: 'flower-outline',
  Serious: 'book-outline',
  Creative: 'color-palette-outline',
  Satire: 'happy-outline',
  Debate: 'chatbubbles-outline',
  Vawulence: 'flame-outline',
};

const MOOD_CHIPS: { label: string; icon: keyof typeof Ionicons.glyphMap; target: MoodId }[] = [
  { label: 'Feeling curious?', icon: 'book-outline', target: 'creative' },
  { label: 'Need a laugh?', icon: 'happy-outline', target: 'satire' },
  { label: 'Vawulence?', icon: 'flame-outline', target: 'vawulence' },
  { label: 'Want to create?', icon: 'color-palette-outline', target: 'creative' },
  { label: 'Ready to engage?', icon: 'chatbubbles-outline', target: 'debate' },
  { label: 'Need Calm?', icon: 'flower-outline', target: 'calm' },
];

function snippet(text: string, max = 48) {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return 'Tap to read';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

const PREVIEW_TILES = 3;
/** Fetch one extra per mood so we can tell if the feed has more than 3 posts. */
const FETCH_PER_MOOD = PREVIEW_TILES + 1;

function ExplorePostTile({ post, onPress }: { post: ApiFeedPost; onPress: () => void }) {
  const img = post.mediaUrl ? { uri: post.mediaUrl } : null;
  const caption = snippet(post.text);
  return (
    <Pressable onPress={onPress} className="min-w-0 flex-1">
      <View className="h-24 w-full overflow-hidden rounded-2xl bg-slate-200">
        {img ? (
          <Image source={img} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center bg-slate-100 px-1">
            <Text className="text-center text-[10px] font-medium text-slate-500" numberOfLines={3}>
              {caption}
            </Text>
          </View>
        )}
      </View>
      <Text className="mt-2 text-xs font-semibold leading-4 text-slate-800" numberOfLines={3}>
        {caption}
      </Text>
    </Pressable>
  );
}

/**
 * Explore — AI search, mood bridges, topics, and per-mood post samples from `GET /posts/explore`.
 */
export default function ExploreScreen() {
  const navigation = useNavigation();
  const mood = useMoodStore((s) => s.currentMood);
  const setMood = useMoodStore((s) => s.setMood);

  const [sections, setSections] = useState<ExploreMoodSection[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicIdx, setTopicIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState('');

  const stackNav = useCallback(() => {
    return navigation.getParent() as
      | { navigate: (name: keyof MainStackParamList, params?: object) => void }
      | undefined;
  }, [navigation]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGetExplore({ perMood: FETCH_PER_MOOD });
      setSections(data.moods);
      setTopics(data.topics.length ? data.topics : ['Personal Growth', 'Creative Ideas', 'Deep Explanations']);
    } catch (e) {
      setError(getApiMessage(e));
      setSections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const goHomeWithMood = (m: MoodId) => {
    setMood(m);
    navigation.navigate('Home' as never);
  };

  const openPost = (p: ApiFeedPost) => {
    const variant = p.shiftFrom && p.originalPost ? 'shifted' : 'standard';
    stackNav()?.navigate('ReadComment', { postId: p.id, variant });
  };

  const openSearchFromAi = () => {
    const q = aiQuery.trim();
    if (!q) return;
    stackNav()?.navigate('Search', { initialTab: 'Posts', initialQuery: q });
  };

  const openTopic = (t: string, idx: number) => {
    setTopicIdx(idx);
    stackNav()?.navigate('Search', { initialTab: 'Posts', initialQuery: t });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Explore</Text>
        <Pressable
          onPress={() => stackNav()?.navigate('Search')}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Ask your AI... ('best productivity hacks', 'urban...')"
            placeholderTextColor="#94a3b8"
            className="ml-2 flex-1 text-sm text-slate-900"
            value={aiQuery}
            onChangeText={setAiQuery}
            returnKeyType="search"
            onSubmitEditing={openSearchFromAi}
          />
        </View>

        <Text className="mt-6 text-center text-xl font-bold text-slate-900">
          {`You're in ${MOOD_LABELS[mood]} ${MOOD_EMOJI[mood]}`}
        </Text>

        <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
          {MOOD_CHIPS.map((c) => (
            <View key={c.label} className="w-[32%] items-center">
              <Pressable
                onPress={() => goHomeWithMood(c.target)}
                className="w-full flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 py-2.5"
              >
                <Ionicons name={c.icon} size={16} color="#2563eb" />
                <Text className="ml-1 text-[10px] font-semibold text-slate-700" numberOfLines={2}>
                  {c.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text className="mt-6 text-base font-bold text-slate-900">AI Topics For You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 12 }}>
          {topics.map((t, idx) => (
            <Pressable
              key={t}
              onPress={() => openTopic(t, idx)}
              className={`rounded-full border border-slate-200 px-4 py-2 ${topicIdx === idx ? 'bg-slate-200' : 'bg-white'}`}
            >
              <Text className="text-sm font-semibold text-slate-700">{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text className="mt-6 text-base font-bold text-slate-900">Explore By Mood</Text>

        {loading ? (
          <View className="mt-6 items-center py-12">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-3 text-sm text-slate-500">Loading moods…</Text>
          </View>
        ) : null}

        {error && !loading ? (
          <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Text className="text-center text-sm text-amber-900">{error}</Text>
            <Pressable onPress={() => void load()} className="mt-2 items-center">
              <Text className="text-sm font-semibold text-indigo-600">Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading &&
          sections.map((sec) => {
            const icon = MOOD_HEADER_ICON[sec.mood] ?? 'ellipse-outline';
            const id = moodApiToId(sec.mood);
            const isActive = id === mood;
            const raw = sec.posts;
            const hasMoreInFeed = raw.length > PREVIEW_TILES;
            const tiles = raw.slice(0, PREVIEW_TILES);

            return (
              <View key={sec.mood} className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name={icon} size={18} color="#2563eb" />
                    <Text className="ml-2 text-sm font-bold text-slate-900">{sec.mood}</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      if (id) goHomeWithMood(id);
                    }}
                  >
                    <LinearGradient
                      colors={isActive ? ['#E0E7FF', '#FEF3C7'] : ['#6366F1', '#FDE047']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text
                        className={`text-xs font-bold ${isActive ? 'text-slate-700' : 'text-white'}`}
                      >
                        {isActive ? 'View feed' : `Switch to ${sec.mood}`}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>

                {tiles.length === 0 ? (
                  <Text className="mt-4 text-center text-sm font-medium text-slate-500">No posts</Text>
                ) : (
                  <View className="mt-3 flex-row items-center">
                    <View className="min-w-0 flex-1 flex-row gap-3">
                      {tiles.map((post) => (
                        <ExplorePostTile
                          key={post.id}
                          post={post}
                          onPress={() => openPost(post)}
                        />
                      ))}
                    </View>
                    {hasMoreInFeed && id ? (
                      <Pressable
                        onPress={() => goHomeWithMood(id)}
                        className="ml-2 h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50"
                        accessibilityRole="button"
                        accessibilityLabel={`View all ${sec.mood} posts in the home feed`}
                      >
                        <Ionicons name="arrow-forward" size={22} color="#4f46e5" />
                      </Pressable>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
}
