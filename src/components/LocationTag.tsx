import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { ReplyLocation } from '../api/comments';

type Props = {
  location: ReplyLocation;
  onClear: () => void;
};

export function LocationTag({ location, onClear }: Props) {
  return (
    <View className="mt-2 flex-row items-center self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
      <Ionicons name="location" size={16} color="#059669" />
      <Text className="ml-1.5 max-w-[240px] text-sm font-medium text-emerald-900" numberOfLines={1}>
        {location.name}
      </Text>
      <Pressable onPress={onClear} hitSlop={8} className="ml-1" accessibilityLabel="Remove location">
        <Ionicons name="close-circle" size={20} color="#047857" />
      </Pressable>
    </View>
  );
}
