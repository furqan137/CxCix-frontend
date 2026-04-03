import { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, Text, View } from 'react-native';

export interface PostCardProps {
  author: string;
  handle: string;
  timeLabel: string;
  body: string;
  image?: ImageSourcePropType;
  avatar?: ImageSourcePropType;
  comments: string;
  likes: string;
  views: string;
  onShift: () => void;
  onOpenPost?: () => void;
  onPressImage?: () => void;
  onBookmark?: () => void;
  onMore?: () => void;
}

/**
 * Threads-style post card — avatar row, body, optional media, action strip + Shift.
 */
export function PostCard({
  author,
  handle,
  timeLabel,
  body,
  image,
  avatar,
  comments,
  likes,
  views,
  onShift,
  onOpenPost,
  onPressImage,
  onBookmark,
  onMore,
}: PostCardProps) {
  const cardStyle = {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  } as const;

  return (
    <View className="mb-3 rounded-2xl bg-white p-4 shadow-soft" style={cardStyle}>
      <View className="flex-row items-start justify-between">
        <Pressable
          onPress={onOpenPost}
          accessibilityRole="button"
          accessibilityLabel={`Open post by ${author}`}
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
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-[15px] font-bold text-slate-900">{author}</Text>
              <Text className="text-sm text-slate-500">{handle}</Text>
              <Text className="text-sm text-slate-400">· {timeLabel}</Text>
            </View>
          </View>
        </Pressable>
        <Pressable
          hitSlop={8}
          accessibilityLabel="Save post"
          onPress={onBookmark}
        >
          <Ionicons name="bookmark-outline" size={22} color="#64748b" />
        </Pressable>
      </View>

      <Pressable onPress={onOpenPost} accessibilityRole="button" accessibilityLabel="Open post">
        <Text className="mt-3 text-[15px] leading-6 text-slate-800">{body}</Text>
      </Pressable>

      {image ? (
        <Pressable onPress={onPressImage} disabled={!onPressImage} accessibilityLabel="View image">
          <Image
            source={image}
            className="mt-3 w-full overflow-hidden rounded-2xl"
            style={{ height: 200 }}
            resizeMode="cover"
          />
        </Pressable>
      ) : null}

      <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
        <Action icon="chatbubble-outline" label={comments} />
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

function Action({ icon, label }: { icon: 'chatbubble-outline'; label: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon} size={18} color="#64748b" />
      <Text className="ml-1 text-sm text-slate-600">{label}</Text>
    </View>
  );
}
