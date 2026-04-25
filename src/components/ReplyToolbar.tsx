import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export type ToolbarActive = {
  image: boolean;
  ai: boolean;
  poll: boolean;
  schedule: boolean;
  location: boolean;
  emoji: boolean;
};

type Props = {
  remaining: number;
  max: number;
  active: ToolbarActive;
  onImage: () => void;
  onAI: () => void;
  onPoll: () => void;
  onSchedule: () => void;
  onLocation: () => void;
  onEmoji: () => void;
  onSend: () => void;
  sendDisabled: boolean;
  sending: boolean;
  uploadBusy?: boolean;
};

function iconColor(on: boolean) {
  return on ? '#4f46e5' : '#94a3b8';
}

export function ReplyToolbar({
  remaining,
  max,
  active,
  onImage,
  onAI,
  onPoll,
  onSchedule,
  onLocation,
  onEmoji,
  onSend,
  sendDisabled,
  sending,
  uploadBusy,
}: Props) {
  return (
    <View className="mt-3 flex-row flex-wrap items-center gap-x-2 gap-y-2">
      <Pressable
        onPress={onImage}
        disabled={!!uploadBusy}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: active.image ? '#eef2ff' : 'transparent' }}
        accessibilityLabel="Add image or video"
      >
        <Ionicons name="image-outline" size={22} color={iconColor(active.image)} />
      </Pressable>
      <Pressable
        onPress={onAI}
        disabled={!!uploadBusy}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: active.ai ? '#eef2ff' : 'transparent' }}
        accessibilityLabel="AI rewrite"
      >
        <Ionicons name="color-wand-outline" size={22} color={iconColor(active.ai)} />
      </Pressable>
      <Pressable
        onPress={onPoll}
        disabled={!!uploadBusy}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: active.poll ? '#eef2ff' : 'transparent' }}
        accessibilityLabel="Add poll"
      >
        <Ionicons name="bar-chart-outline" size={22} color={iconColor(active.poll)} />
      </Pressable>
      <Pressable
        onPress={onSchedule}
        disabled={!!uploadBusy}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: active.schedule ? '#eef2ff' : 'transparent' }}
        accessibilityLabel="Schedule reply"
      >
        <Ionicons name="time-outline" size={22} color={iconColor(active.schedule)} />
      </Pressable>
      <Pressable
        onPress={onLocation}
        disabled={!!uploadBusy}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: active.location ? '#eef2ff' : 'transparent' }}
        accessibilityLabel="Attach location"
      >
        <Ionicons name="location-outline" size={22} color={iconColor(active.location)} />
      </Pressable>
      <Pressable
        onPress={onEmoji}
        disabled={!!uploadBusy}
        hitSlop={6}
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: active.emoji ? '#eef2ff' : 'transparent' }}
        accessibilityLabel="Emoji"
      >
        <Ionicons name="happy-outline" size={22} color={iconColor(active.emoji)} />
      </Pressable>

      <View className="ml-auto flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-indigo-400">
          <Text className="text-[10px] font-bold text-indigo-600">{Math.max(0, remaining)}</Text>
        </View>
        <Text className="text-xs font-medium text-slate-400">/{max}</Text>
        <Pressable
          onPress={onSend}
          disabled={sendDisabled || sending || uploadBusy}
          className="overflow-hidden rounded-full"
          accessibilityLabel="Send reply"
        >
          <LinearGradient
            colors={['#5D7CFF', '#FFC371']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
              opacity: sendDisabled || sending || uploadBusy ? 0.45 : 1,
            }}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View className="flex-row items-center gap-1">
                <Ionicons name="arrow-up" size={18} color="#fff" />
                <Text className="text-sm font-bold text-white">Send</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
