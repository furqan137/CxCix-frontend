import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Animated, Image, Pressable, Text, View } from 'react-native';

const HEART_LIKED = '#4F7CFF';
const HEART_MUTED = '#94a3b8';

export interface PostCardProps {
  author: string;
  handle: string;
  timeLabel: string;
  aiLabel?: string;
  body: string;
  /** Legacy single image support (fallback). */
  image?: ImageSourcePropType;
  /** Multiple media items (preferred). */
  media?: { url: string; resourceType: 'image' | 'video' | 'raw' }[];
  avatar?: ImageSourcePropType;
  comments: string;
  likes: string;
  views: string;
  /** When true, heart is filled and tinted. */
  liked?: boolean;
  onShift: () => void;
  onLike?: () => void;
  onOpenPost?: () => void;
  onPressComment?: () => void;
  /** Header row: open shifter profile */
  onPressAuthor?: () => void;
  /** For legacy single-image posts. */
  onPressImage?: () => void;
  /** For multi-media posts. */
  onPressMedia?: (index: number) => void;
  onBookmark?: () => void;
  /** Filled icon when saved */
  bookmarked?: boolean;
  onMore?: () => void;
}

/**
 * Threads-style post card — avatar row, body, optional media, action strip + Shift.
 */
export function PostCard({
  author,
  handle,
  timeLabel,
  aiLabel,
  body,
  image,
  media,
  avatar,
  comments,
  likes,
  views,
  liked = false,
  onShift,
  onLike,
  onOpenPost,
  onPressComment,
  onPressAuthor,
  onPressImage,
  onPressMedia,
  onBookmark,
  bookmarked = false,
  onMore,
}: PostCardProps) {
  const cardStyle = {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  } as const;

  const heartScale = useRef(new Animated.Value(1)).current;

  const playHeartBounce = useCallback(() => {
    heartScale.setValue(0.86);
    Animated.spring(heartScale, {
      toValue: 1,
      friction: 4,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [heartScale]);

  const handleLikePress = useCallback(() => {
    playHeartBounce();
    onLike?.();
  }, [onLike, playHeartBounce]);

  return (
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-soft" style={cardStyle}>
      <View className="flex-row items-start justify-between">
        <Pressable
          onPress={onPressAuthor ?? onOpenPost}
          accessibilityRole="button"
          accessibilityLabel={onPressAuthor ? `View ${author} profile` : `Open post by ${author}`}
          className="flex-1 flex-row"
        >
          {avatar ? (
            <Image source={avatar} className="h-11 w-11 rounded-full" resizeMode="cover" />
          ) : (
            <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-200">
              <Ionicons name="person" size={24} color="#94a3b8" />
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text className="text-[15px] font-bold text-slate-900" numberOfLines={2}>
              {author}
            </Text>
            <View className="mt-0.5 flex-row flex-wrap items-center gap-x-1.5">
              <Text className="text-sm text-slate-500">{handle}</Text>
              <Text className="text-sm text-slate-400">·</Text>
              <Text className="text-sm text-slate-400">{timeLabel}</Text>
              {aiLabel ? (
                <>
                  <Text className="text-sm text-slate-300">·</Text>
                  <View className="rounded-full bg-indigo-50 px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-indigo-700">{aiLabel}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </Pressable>
        <Pressable
          hitSlop={8}
          accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Save post'}
          onPress={onBookmark}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={bookmarked ? '#2563eb' : '#64748b'}
          />
        </Pressable>
      </View>

      <Pressable
        onPress={onOpenPost}
        accessibilityRole="button"
        accessibilityLabel="Open post"
      >
        <Text className="mt-3 text-[15px] leading-6 text-slate-800">{body}</Text>
      </Pressable>

      {Array.isArray(media) && media.length > 0 ? (
        <PostMediaGrid
          items={media}
          onPress={(i) => onPressMedia?.(i)}
        />
      ) : image ? (
        <Pressable onPress={onPressImage} disabled={!onPressImage} accessibilityLabel="View image">
          <Image
            source={image}
            className="mt-3 w-full overflow-hidden rounded-2xl"
            style={{ height: 200 }}
            resizeMode="cover"
          />
        </Pressable>
      ) : null}

      {liked ? (
        <Text className="mt-1 text-xs font-medium text-slate-500">Liked by you</Text>
      ) : null}

      <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
        <Pressable
          onPress={onPressComment}
          disabled={!onPressComment}
          className="flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel="View comments"
        >
          <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">{comments}</Text>
        </Pressable>
        <Pressable
          onPress={handleLikePress}
          disabled={!onLike}
          className="flex-row items-center"
          accessibilityRole="button"
          accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? HEART_LIKED : HEART_MUTED}
            />
          </Animated.View>
          <Text
            className="ml-1 text-sm"
            style={{ color: liked ? '#334155' : '#64748b' }}
            numberOfLines={1}
          >
            {likes}
          </Text>
        </Pressable>
        <Pressable onPress={onShift} className="flex-row items-center">
          <Ionicons name="sync" size={18} color="#64748b" />
          <Text className="ml-1 text-sm font-semibold text-slate-700">Shift</Text>
        </Pressable>
        <View className="flex-row items-center">
          <Ionicons name="eye-outline" size={18} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-500">{views}</Text>
        </View>
        <Pressable hitSlop={8} className="ml-auto" onPress={onMore}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
        </Pressable>
      </View>
    </View>
  );
}

function PostMediaGrid({
  items,
  onPress,
}: {
  items: { url: string; resourceType: 'image' | 'video' | 'raw' }[];
  onPress?: (index: number) => void;
}) {
  const m = items.slice(0, 4);
  const more = items.length - m.length;

  const cell = (it: (typeof items)[number], index: number, extra?: { overlay?: string }) => {
    const isVideo = it.resourceType === 'video';
    return (
      <Pressable
        key={`${it.url}-${index}`}
        onPress={() => onPress?.(index)}
        disabled={!onPress}
        className="overflow-hidden rounded-2xl"
        style={{ flex: 1 }}
        accessibilityLabel={isVideo ? 'View video' : 'View image'}
      >
        <Image source={{ uri: it.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {isVideo ? (
          <View className="absolute inset-0 items-center justify-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-black/45">
              <Ionicons name="play" size={22} color="#fff" style={{ marginLeft: 2 }} />
            </View>
          </View>
        ) : null}
        {extra?.overlay ? (
          <View className="absolute inset-0 items-center justify-center bg-black/40">
            <Text className="text-2xl font-extrabold text-white">{extra.overlay}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  if (m.length === 1) {
    return <View className="mt-3 overflow-hidden rounded-2xl" style={{ height: 220 }}>{cell(m[0], 0)}</View>;
  }
  if (m.length === 2) {
    return (
      <View className="mt-3 flex-row" style={{ gap: 8, height: 180 }}>
        {cell(m[0], 0)}
        {cell(m[1], 1)}
      </View>
    );
  }
  if (m.length === 3) {
    return (
      <View className="mt-3 flex-row" style={{ gap: 8, height: 220 }}>
        <View style={{ flex: 1.2 }}>{cell(m[0], 0)}</View>
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ flex: 1 }}>{cell(m[1], 1)}</View>
          <View style={{ flex: 1 }}>{cell(m[2], 2)}</View>
        </View>
      </View>
    );
  }
  // 4+
  return (
    <View className="mt-3" style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 8, height: 130 }}>
        {cell(m[0], 0)}
        {cell(m[1], 1)}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, height: 130 }}>
        {cell(m[2], 2)}
        {cell(m[3], 3, more > 0 ? { overlay: `+${more}` } : undefined)}
      </View>
    </View>
  );
}
