import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGetPostInsights, formatCompactCount, type PostInsights } from '../../api/posts';
import { getApiMessage } from '../../api/auth';
import { BRAND_GRADIENT } from '../../constants/brand';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'PostInsights'>;

const PAGE = '#F4F7F9';

const MOOD_TINT: Record<string, string> = {
  Calm: '#22C55E',
  Serious: '#3B82F6',
  Creative: '#8B5CF6',
  Satire: '#F97316',
  Debate: '#EF4444',
  Vawulence: '#EC4899',
};

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View
      className="flex-1 min-w-[44%] rounded-3xl bg-white p-4 shadow-sm"
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
        <Ionicons name={icon} size={22} color="#4F46E5" />
      </View>
      <Text className="mt-3 text-2xl font-extrabold text-slate-900">{value}</Text>
      <Text className="mt-0.5 text-sm font-semibold text-slate-600">{label}</Text>
      {sub ? <Text className="mt-1 text-xs text-slate-400">{sub}</Text> : null}
    </View>
  );
}

/**
 * Author-only engagement summary for a single post (`GET /posts/:id/insights`).
 */
export default function PostInsightsScreen({ navigation, route }: Props) {
  const postId = route.params?.postId ?? '';
  const [data, setData] = useState<PostInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postId) {
      setError('Missing post');
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const row = await apiGetPostInsights(postId);
      setData(row);
    } catch (e) {
      setError(getApiMessage(e));
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const moodColor = data?.mood ? MOOD_TINT[data.mood] ?? '#6366F1' : '#6366F1';
  const posted = data?.createdAt
    ? new Date(data.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Post insights</Text>
        <View className="h-10 w-10" />
      </View>

      {loading && !data ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : error && !data ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-slate-600">{error}</Text>
          <Pressable onPress={() => void load()} className="mt-4 rounded-full bg-slate-200 px-6 py-3">
            <Text className="font-semibold text-slate-800">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <LinearGradient
            colors={[`${moodColor}22`, '#ffffff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#e2e8f0',
            }}
          >
            <View className="flex-row items-center justify-between">
              <View className="rounded-full bg-white/80 px-3 py-1">
                <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: moodColor }}>
                  {data?.mood ?? '—'}
                </Text>
              </View>
              {data?.pinnedToProfile ? (
                <View className="flex-row items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1">
                  <Ionicons name="pin" size={14} color="#B45309" />
                  <Text className="text-xs font-bold text-amber-800">Pinned</Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-4 text-lg font-bold text-slate-900">How this post is doing</Text>
            <Text className="mt-1 text-sm leading-5 text-slate-600">
              {data?.textPreview
                ? `${data.textPreview}${data.textPreview.length >= 160 ? '…' : ''}`
                : data?.hasMedia
                  ? 'Media post'
                  : 'Your post'}
            </Text>
            <Text className="mt-3 text-xs text-slate-400">Posted {posted}</Text>
          </LinearGradient>

          <Text className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
            Engagement
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <StatCard
              icon="heart-outline"
              label="Likes"
              value={formatCompactCount(data?.likesCount ?? 0)}
            />
            <StatCard
              icon="bookmark-outline"
              label="Saves"
              value={formatCompactCount(data?.bookmarksCount ?? 0)}
            />
            <StatCard
              icon="chatbubble-ellipses-outline"
              label="Comments"
              value={formatCompactCount(data?.commentsCount ?? 0)}
            />
            <StatCard
              icon="git-branch-outline"
              label="Shifts"
              value={formatCompactCount(data?.shiftsCount ?? 0)}
              sub="Replies with perspective"
            />
          </View>

          <Pressable
            onPress={() => navigation.navigate('ReadComment', { postId, variant: 'standard' })}
            className="mt-8 overflow-hidden rounded-full"
          >
            <LinearGradient
              colors={[...BRAND_GRADIENT]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ paddingVertical: 16, alignItems: 'center' }}
            >
              <Text className="text-base font-bold text-white">Open post</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
