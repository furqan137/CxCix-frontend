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

import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'CreatePost'>;

const PAGE = '#F8F9FB';

/**
 * Create post composer — media, media type, AI tools (hi-fi).
 */
export default function CreatePostScreen({ navigation }: Props) {
  const [body, setBody] = useState('');
  const [mediaKind, setMediaKind] = useState<'human' | 'ai'>('human');
  const max = 280;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between px-3 py-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-200/80"
        >
          <Ionicons name="close" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Create Post</Text>
        <Pressable className="overflow-hidden rounded-full">
          <LinearGradient
            colors={['#7D89F0', '#F9C58D']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ paddingVertical: 10, paddingHorizontal: 18 }}
          >
            <Text className="text-sm font-bold text-white">Post</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <View className="rounded-3xl bg-white p-4 shadow-sm">
          <View className="flex-row items-center">
            <Image source={Images.avatarWade} className="h-11 w-11 rounded-full" resizeMode="cover" />
            <View className="ml-3">
              <Text className="font-bold text-slate-900">Wade Warren</Text>
              <Text className="text-sm text-slate-500">@wade_warren</Text>
            </View>
          </View>
          <TextInput
            className="mt-4 min-h-[80px] text-[16px] text-slate-900"
            placeholder="Write something..."
            placeholderTextColor="#8E949A"
            multiline
            value={body}
            onChangeText={setBody}
            maxLength={max}
          />
          <View className="relative mt-3">
            <Image
              source={Images.feedPost1}
              className="w-full overflow-hidden rounded-2xl"
              style={{ height: 200 }}
              resizeMode="cover"
            />
            <Pressable className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/35">
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
          <Pressable className="mt-4 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-8">
            <Ionicons name="add" size={28} color="#94a3b8" />
            <Text className="mt-2 text-sm font-medium text-slate-400">Add Media</Text>
          </Pressable>
          <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3">
            <View className="flex-row gap-4">
              <Ionicons name="image-outline" size={22} color="#94a3b8" />
              <Ionicons name="videocam-outline" size={22} color="#94a3b8" />
              <Ionicons name="location-outline" size={22} color="#94a3b8" />
              <Ionicons name="person-add-outline" size={22} color="#94a3b8" />
            </View>
            <Text className="text-sm text-slate-400">
              {body.length} / {max}
            </Text>
          </View>
        </View>

        <Text className="mb-3 mt-8 font-bold text-slate-900">Media Type</Text>
        <Pressable
          onPress={() => setMediaKind('human')}
          className="mb-2 flex-row items-center justify-between rounded-2xl bg-white p-4"
        >
          <View className="flex-row items-center">
            <Ionicons name="person-outline" size={22} color="#334155" />
            <Text className="ml-3 font-medium text-slate-800">Human-made / Original</Text>
          </View>
          <View
            className="h-5 w-5 rounded-full border-2"
            style={{
              borderColor: mediaKind === 'human' ? '#2563eb' : '#cbd5e1',
              backgroundColor: mediaKind === 'human' ? '#2563eb' : 'transparent',
            }}
          />
        </Pressable>
        <Pressable
          onPress={() => setMediaKind('ai')}
          className="flex-row items-center justify-between rounded-2xl bg-white p-4"
        >
          <View className="flex-row items-center">
            <Ionicons name="sparkles-outline" size={22} color="#334155" />
            <Text className="ml-3 font-medium text-slate-800">AI-generated / AI-edited</Text>
          </View>
          <View
            className="h-5 w-5 rounded-full border-2"
            style={{
              borderColor: mediaKind === 'ai' ? '#2563eb' : '#cbd5e1',
              backgroundColor: mediaKind === 'ai' ? '#2563eb' : 'transparent',
            }}
          />
        </Pressable>

        <Text className="mb-3 mt-8 font-bold text-slate-900">AI Writing Tools</Text>
        <LinearGradient
          colors={['#7D89F0', '#F9C58D']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
        >
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text className="ml-2 font-bold text-white">Draft with AI</Text>
          </View>
        </LinearGradient>
        <Pressable className="mt-3 flex-row items-center justify-center rounded-2xl border border-blue-400 bg-white py-3.5">
          <Ionicons name="git-branch-outline" size={20} color="#2563eb" />
          <Text className="ml-2 font-semibold text-blue-600">Split into thread</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
