import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Animated, Image, Pressable, Text, View } from 'react-native';

const HEART_LIKED = '#4F7CFF';
const HEART_MUTED = '#94a3b8';

export interface ShiftedPostCardProps {
  author: string;
  handle: string;
  timeLabel: string;
  avatar: ImageSourcePropType;
  perspectiveLabel: string;
  /** Your commentary above the quoted post */
  body: string;
  nested: {
    author: string;
    handle: string;
    timeLabel: string;
    body: string;
    image?: ImageSourcePropType;
    avatar: ImageSourcePropType;
  };
  comments: string;
  likes: string;
  views: string;
  liked?: boolean;
  onLike?: () => void;
  onPressComment?: () => void;
  onPressCard?: () => void;
  onPressNestedImage?: () => void;
  onShift: () => void;
  onBookmark?: () => void;
  bookmarked?: boolean;
  onMore?: () => void;
  /** Header row: open shifter profile */
  onPressAuthor?: () => void;
}

/**
 * Shifted post — Figma: “Shifted original post” banner, perspective pill, nested quote + media.
 */
export function ShiftedPostCard({
  author,
  handle,
  timeLabel,
  avatar,
  perspectiveLabel,
  body,
  nested,
  comments,
  likes,
  views,
  liked = false,
  onLike,
  onPressComment,
  onPressCard,
  onPressNestedImage,
  onShift,
  onBookmark,
  bookmarked = false,
  onMore,
  onPressAuthor,
}: ShiftedPostCardProps) {
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

  const cardStyle = {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  } as const;

  return (
    <View className="mb-3 overflow-hidden rounded-2xl bg-white shadow-soft" style={cardStyle}>
      <View className="flex-row items-center bg-sky-100 px-3 py-2.5">
        <Ionicons name="checkmark-circle" size={18} color="#0284c7" />
        <Text className="ml-2 flex-1 text-sm font-semibold text-sky-900">Shifted original post</Text>
      </View>

      <View className="p-4">
        <Pressable
          onPress={onPressAuthor ?? onPressCard}
          accessibilityRole="button"
          accessibilityLabel={`${author} shifted post`}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row">
              <Image source={avatar} className="h-11 w-11 rounded-full" resizeMode="cover" />
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-bold text-slate-900" numberOfLines={2}>
                  {author}
                </Text>
                <View className="mt-0.5 flex-row flex-wrap items-center gap-x-1.5">
                  <Text className="text-sm text-slate-500">{handle}</Text>
                  <Text className="text-sm text-slate-400">·</Text>
                  <Text className="text-sm text-slate-400">{timeLabel}</Text>
                </View>
                <View className="mt-2 self-start rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1">
                  <Text className="text-xs font-semibold text-sky-800">
                    Perspective: {perspectiveLabel}
                  </Text>
                </View>
              </View>
            </View>
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
        </Pressable>

        <Pressable onPress={onPressCard} accessibilityRole="button" accessibilityLabel="Open shifted post">
          {body.trim().length > 0 ? (
            <Text className="mt-3 text-[15px] leading-6 text-slate-800">{body}</Text>
          ) : null}

          <View className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 flex-row">
                <Image
                  source={nested.avatar}
                  className="h-9 w-9 rounded-full"
                  resizeMode="cover"
                />
                <View className="ml-2 flex-1">
                  <Text className="text-sm font-bold text-slate-900" numberOfLines={2}>
                    {nested.author}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500">
                    {nested.handle} · {nested.timeLabel}
                  </Text>
                </View>
              </View>
              <Ionicons name="ellipsis-horizontal" size={18} color="#94a3b8" />
            </View>
            <Text className="mt-2 text-sm leading-5 text-slate-800">{nested.body}</Text>
            {nested.image ? (
              <Pressable onPress={onPressNestedImage} accessibilityLabel="View quoted image">
                <Image
                  source={nested.image}
                  className="mt-2 w-full overflow-hidden rounded-2xl"
                  style={{ height: 160 }}
                  resizeMode="cover"
                />
              </Pressable>
            ) : null}
          </View>
        </Pressable>

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
    </View>
  );
}
