import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Images } from '../../constants/images';
import type { MainStackParamList } from '../../navigation/types';
import { PostCard } from '../../components/feed/PostCard';

type Props = NativeStackScreenProps<MainStackParamList, 'Search'>;

const PAGE = '#F5F7F9';

export default function SearchScreen({ navigation }: Props) {
  const [tab, setTab] = useState<'People' | 'Posts'>('Posts');

  const posts = useMemo(
    () => [
      {
        id: 'cat',
        author: 'Annette Black',
        handle: '@elenadesign',
        timeLabel: '2h',
        body: `It's okay if you don't like cat. Don't call me weird.\n\nI'm perfectly fine with us having different favorite animals.\nWe all have our own preferences, and that's what makes us unique. Let's just keep the energy positive and respect each other's vibes.`,
        image: Images.mediaCat,
        avatar: Images.avatarSplit,
      },
      {
        id: 'mchen',
        author: 'Marcus Chen',
        handle: '@mchen_design',
        timeLabel: '5h',
        body: `Testing out the new mood-based algorithm. It's refreshing to see content that actually matches my energy levels.\n\nGreat work by the engineering team! ✨`,
        avatar: Images.avatarWade,
      },
      {
        id: 'jane',
        author: 'Jane Cooper',
        handle: '@j_cooper',
        timeLabel: '7h',
        body: `Took a moment today just to breathe and watch the clouds.\n\nSometimes the most productive thing you can do is give yourself permission to do absolutely nothing. Taking a slow day to reset. How are you finding your peace today?`,
        image: Images.feedPost2,
        avatar: Images.avatarSplit,
      },
    ],
    [],
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PAGE }} edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
        >
          <Ionicons name="chevron-back" size={22} color="#334155" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Search</Text>
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="search" size={20} color="#334155" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search people or posts..."
            placeholderTextColor="#94a3b8"
            className="ml-2 flex-1 text-sm text-slate-900"
          />
        </View>

        <View className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <View className="flex-row">
            <Pressable onPress={() => setTab('People')} className="flex-1 items-center py-3">
              <Text className={`text-sm font-semibold ${tab === 'People' ? 'text-slate-900' : 'text-slate-400'}`}>
                People
              </Text>
            </Pressable>
            <Pressable onPress={() => setTab('Posts')} className="flex-1 overflow-hidden">
              {tab === 'Posts' ? (
                <LinearGradient
                  colors={['#6366F1', '#FDE047']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text className="text-sm font-bold text-white">Posts</Text>
                </LinearGradient>
              ) : (
                <View className="items-center py-3">
                  <Text className="text-sm font-semibold text-slate-400">Posts</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View className="mt-4">
          {tab === 'Posts' ? (
            posts.map((p) => (
              <PostCard
                key={p.id}
                author={p.author}
                handle={p.handle}
                timeLabel={p.timeLabel}
                body={p.body}
                image={(p as any).image}
                avatar={(p as any).avatar}
                comments="7.50k"
                likes="24.4k"
                views="900K"
                onShift={() => {}}
              />
            ))
          ) : (
            <View className="mt-6 items-center">
              <Text className="text-sm text-slate-500">People results coming soon.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

