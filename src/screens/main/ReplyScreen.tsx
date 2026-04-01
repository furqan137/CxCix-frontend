import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOOD_LABELS } from '../../constants/moods';
import { Images } from '../../constants/images';
import { useMoodStore } from '../../store/useMoodStore';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Reply'>;

/**
 * Reply thread — mood chrome, replying bar, quoted post, composer (hi-fi).
 */
export default function ReplyScreen({ navigation, route }: Props) {
  const handle = route.params?.replyToHandle ?? '@elenadesign';
  const currentMood = useMoodStore((s) => s.currentMood);
  const [reply, setReply] = useState('');
  const max = 280;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-3 py-2">
        <Image source={Images.logoHeader} style={{ width: 36, height: 36 }} resizeMode="contain" />
        <LinearGradient
          colors={['#5D7CFF', '#FFC371']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text className="text-xs font-bold text-white">
            You are in {MOOD_LABELS[currentMood]}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#fff" />
        </LinearGradient>
        <Pressable className="h-9 w-9 items-center justify-center rounded-full border border-slate-200">
          <Ionicons name="settings-outline" size={18} color="#334155" />
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between border-b border-slate-100 px-4 py-2">
        <View className="flex-row items-center">
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3b82f6" />
          <Text className="ml-2 text-sm text-slate-700">
            Replying to <Text className="font-semibold text-blue-600">{handle}</Text>
          </Text>
        </View>
        <Text className="text-sm font-semibold text-slate-500">Drafts</Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-row">
              <Image
                source={Images.avatarSplit}
                className="h-10 w-10 rounded-full"
                resizeMode="cover"
              />
              <View className="ml-2">
                <Text className="font-bold text-slate-900">Elena Fisher</Text>
                <Text className="text-xs text-slate-500">@elenadesign · 2h</Text>
              </View>
            </View>
            <Ionicons name="ellipsis-horizontal" size={18} color="#94a3b8" />
          </View>
          <Text className="mt-3 text-[15px] leading-6 text-slate-800">
            Taking a moment to breathe today. The world is quiet and everything feels aligned.
            Sending peace to everyone on the timeline. 🌿
          </Text>
          <Image
            source={Images.feedPost1}
            className="mt-3 w-full overflow-hidden rounded-2xl"
            style={{ height: 180 }}
            resizeMode="cover"
          />
        </View>

        <View className="mt-6 flex-row items-center">
          <Image source={Images.avatarWade} className="h-10 w-10 rounded-full" resizeMode="cover" />
          <View className="ml-2">
            <Text className="font-bold text-slate-900">Wade Warren</Text>
            <Text className="text-xs text-slate-500">@wade_warren</Text>
          </View>
        </View>

        <TextInput
          className="mt-4 min-h-[120px] rounded-2xl border border-slate-200 px-4 py-3 text-[16px] text-slate-900"
          placeholder="Write your reply..."
          placeholderTextColor="#94a3b8"
          multiline
          value={reply}
          onChangeText={setReply}
          maxLength={max}
        />

        <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2">
          <Ionicons name="image-outline" size={22} color="#94a3b8" />
          <Ionicons name="color-wand-outline" size={22} color="#94a3b8" />
          <Ionicons name="bar-chart-outline" size={22} color="#94a3b8" />
          <Ionicons name="time-outline" size={22} color="#94a3b8" />
          <Ionicons name="location-outline" size={22} color="#94a3b8" />
          <View className="ml-auto flex-row items-center">
            <View className="mr-2 h-8 w-8 rounded-full border-2 border-blue-500" />
            <Text className="text-sm font-medium text-slate-600">{max}</Text>
          </View>
        </View>

        <Pressable className="mt-6 overflow-hidden rounded-full">
          <LinearGradient
            colors={['#5D7CFF', '#FFC371']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ paddingVertical: 14, alignItems: 'center' }}
          >
            <Text className="text-base font-bold text-white">Reply</Text>
          </LinearGradient>
        </Pressable>

        <View className="mt-6 items-center">
          <Text className="text-center text-xs text-amber-600">
            ✨ After posting: AI labels reply type
          </Text>
          <Text className="mt-1 text-center text-xs font-semibold text-blue-600">
            Learn how reply tags work
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
