import { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, Text, View } from 'react-native';

export interface ShiftedPostCardProps {
  author: string;
  handle: string;
  timeLabel: string;
  avatar: ImageSourcePropType;
  perspectiveLabel: string;
  bodyLead: string;
  bodyAfterLink: string;
  nested: {
    author: string;
    handle: string;
    timeLabel: string;
    body: string;
    image: ImageSourcePropType;
    /** Small avatar in quoted card */
    avatar: ImageSourcePropType;
  };
  comments: string;
  likes: string;
  views: string;
  onPressCard?: () => void;
  onPressNestedImage?: () => void;
  onPressAiModerator?: () => void;
  onShift: () => void;
  onBookmark?: () => void;
  onMore?: () => void;
}

/**
 * Featured “shifted” post — perspective pill, nested quote + media, AI Moderator link.
 */
export function ShiftedPostCard({
  author,
  handle,
  timeLabel,
  avatar,
  perspectiveLabel,
  bodyLead,
  bodyAfterLink,
  nested,
  comments,
  likes,
  views,
  onPressCard,
  onPressNestedImage,
  onPressAiModerator,
  onShift,
  onBookmark,
  onMore,
}: ShiftedPostCardProps) {
  const cardStyle = {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  } as const;

  return (
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-soft" style={cardStyle}>
      <Pressable onPress={onPressCard} accessibilityRole="button" accessibilityLabel="Open shifted post">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 flex-row">
            <Image source={avatar} className="h-11 w-11 rounded-full" resizeMode="cover" />
            <View className="ml-3 flex-1">
              <View className="flex-row flex-wrap items-center gap-2">
                <Text className="text-[15px] font-bold text-slate-900">{author}</Text>
                <Text className="text-sm text-slate-500">{handle}</Text>
                <Text className="text-sm text-slate-400">· {timeLabel}</Text>
              </View>
              <View className="mt-2 self-start rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1">
                <Text className="text-xs font-semibold text-sky-700">
                  Perspective: {perspectiveLabel}
                </Text>
              </View>
            </View>
          </View>
          <Pressable
            hitSlop={8}
            accessibilityLabel="Save post"
            onPress={onBookmark}
          >
            <Ionicons name="bookmark-outline" size={22} color="#64748b" />
          </Pressable>
        </View>

        <Text className="mt-3 text-[15px] leading-6 text-slate-800">
          {bodyLead}{' '}
          <Text
            className="font-semibold text-blue-600"
            onPress={onPressAiModerator}
            suppressHighlighting
          >
            AI Moderator
          </Text>
          {bodyAfterLink}
        </Text>

        <View className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row">
              <Image
                source={nested.avatar}
                className="h-9 w-9 rounded-full"
                resizeMode="cover"
              />
              <View className="ml-2 flex-1">
                <Text className="text-sm font-bold text-slate-900">{nested.author}</Text>
                <Text className="text-xs text-slate-500">
                  {nested.handle} · {nested.timeLabel}
                </Text>
              </View>
            </View>
            <Ionicons name="ellipsis-horizontal" size={18} color="#94a3b8" />
          </View>
          <Text className="mt-2 text-sm leading-5 text-slate-800">{nested.body}</Text>
          <Pressable onPress={onPressNestedImage} accessibilityLabel="View quoted image">
            <Image
              source={nested.image}
              className="mt-2 w-full overflow-hidden rounded-2xl"
              style={{ height: 160 }}
              resizeMode="cover"
            />
          </Pressable>
        </View>
      </Pressable>

      <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
        <View className="flex-row items-center">
          <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
          <Text className="ml-1 text-sm text-slate-600">{comments}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="heart" size={18} color="#3b82f6" />
          <Text className="ml-1 text-sm font-medium text-slate-600">{likes}</Text>
        </View>
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
